import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import VapourTextEffect from "./ui/vapour-text-effect";
import Navbar from "./Navbar";
import { getResume } from "../lib/queries";

gsap.registerPlugin(ScrollTrigger);

// Vite resolves these asset URLs at build time, so the frames also work
// after deployment (unlike hard-coded /src/... URLs).
const HERO_FRAMES = Object.entries(
  import.meta.glob("../assets/hero-video/ezgif-frame-*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
)
  .sort(([a], [b]) => {
    const frameA = Number(a.match(/ezgif-frame-(\\d+)\\.jpg$/)?.[1] ?? 0);
    const frameB = Number(b.match(/ezgif-frame-(\\d+)\\.jpg$/)?.[1] ?? 0);
    return frameA - frameB;
  })
  .map(([, url]) => url);


// Easy-to-edit portfolio statistics
const HERO_STATS = [
  { value: "05+", label: "Projects" },
  { value: "05+", label: "Tech stacks" },
  { value: "01+", label: "Years building" },
];

const Hero = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const bgTextRef = useRef(null);
  const topLayerRef = useRef(null);

  // Vaporize Text Effect Refs
  const eyebrowVapourRef = useRef(null);
  const name1VapourRef = useRef(null);
  const name2VapourRef = useRef(null);
  const roleVapourRef = useRef(null);
  const descVapourRef = useRef(null);
  const ctaVapourRef = useRef(null);
  const statsVapourRefs = useRef([]);

  // Cinematic Reveal Refs
  const revealCanvasRef = useRef(null);
  const revealMaskCanvasRef = useRef(null);
  const heroOverlayObj = useRef(null);
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    isActive: false,
  });

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);

  // Fetch published resume PDF from Sanity CMS
  useEffect(() => {
    let isMounted = true;
    getResume()
      .then((data) => {
        if (isMounted && data?.pdfUrl) {
          setResumeUrl(data.pdfUrl);
        }
      })
      .catch((err) => {
        console.warn("Could not load resume from Sanity:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Image Sequence and Progressive Loading
  const imagesRef = useRef([]);
  const currentFrameRef = useRef({ index: 0 });
  const isMobileRef = useRef(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  // 1. CANVAS FRAME RENDERING
  const renderFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const frameCount = HERO_FRAMES.length;
    let targetIndex = isMobileRef.current
      ? index % 2 === 1
        ? index - 1
        : index
      : index;
    targetIndex = Math.max(0, Math.min(frameCount - 1, targetIndex));

    let img = imagesRef.current[targetIndex];

    // Fallback: If target frame is still loading, find nearest available loaded frame
    if (!img || !img.complete) {
      for (let offset = 1; offset < frameCount; offset++) {
        const prev = targetIndex - offset;
        if (prev >= 0 && imagesRef.current[prev]?.complete) {
          img = imagesRef.current[prev];
          break;
        }
        const next = targetIndex + offset;
        if (next < frameCount && imagesRef.current[next]?.complete) {
          img = imagesRef.current[next];
          break;
        }
      }
    }

    if (!img || !img.complete) return;

    const context = canvas.getContext("2d", {
      alpha: false,
    });
    if (!context) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    if (isMobileRef.current) {
      // MOBILE: Cover-style crop — no black bars
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const scale = Math.max(scaleX, scaleY);

      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      const x = (canvasWidth - drawWidth) / 2;
      const y = (canvasHeight - drawHeight) / 2;

      context.drawImage(img, x, y, drawWidth, drawHeight);
    } else {
      // DESKTOP: Original width-fit behavior
      const scale = canvasWidth / img.width;
      const x = 0;
      const y = canvasHeight / 2 - (img.height / 2) * scale;

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
  }, []);

  // 2. PROGRESSIVE & ESSENTIAL ASSETS PRELOADER
  // Loads only critical initial frames to unlock the website in <1s,
  // then streams remaining frames smoothly in background batches.
  useEffect(() => {
    const frameCount = HERO_FRAMES.length;
    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;

    const images = new Array(frameCount);
    imagesRef.current = images;

    const CRITICAL_COUNT = isMobile ? 6 : 10;
    let criticalLoaded = 0;
    let isCancelled = false;

    // Preload overlay image
    const overlayImg = new Image();
    overlayImg.onload = () => {
      heroOverlayObj.current = overlayImg;
    };
    overlayImg.src = HERO_FRAMES[frameCount - 1] || "";
    revealMaskCanvasRef.current = document.createElement("canvas");

    const loadFrame = (index, isHighPriority = false) => {
      if (images[index]) return images[index];

      const img = new Image();
      if (isHighPriority) {
        img.fetchPriority = "high";
      }
      img.src = HERO_FRAMES[index] || "";

      img.onload = () => {
        if (img.decode) {
          img.decode().catch(() => {});
        }
      };

      images[index] = img;
      return img;
    };

    // Smooth, snappy counter animation (never gets stuck)
    let progressVal = 0;
    let targetProgress = 15;
    let animationFrameId;

    const updateCounter = () => {
      if (isCancelled) return;
      if (progressVal < targetProgress) {
        const step = Math.max(1, Math.ceil((targetProgress - progressVal) * 0.22));
        progressVal = Math.min(targetProgress, progressVal + step);
        setLoadingProgress(progressVal);
      }
      if (progressVal >= 100) {
        setIsLoaded(true);
        return;
      }
      animationFrameId = requestAnimationFrame(updateCounter);
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    // Initial critical batch
    for (let i = 0; i < CRITICAL_COUNT; i++) {
      const idx = isMobile ? i * 2 : i;
      if (idx >= frameCount) break;

      const img = loadFrame(idx, true);
      const onCritDone = () => {
        criticalLoaded++;
        targetProgress = Math.min(100, Math.floor((criticalLoaded / CRITICAL_COUNT) * 100));
        if (criticalLoaded === 1) {
          renderFrame(0);
        }
        if (criticalLoaded >= CRITICAL_COUNT) {
          targetProgress = 100;
        }
      };

      if (img.complete) {
        onCritDone();
      } else {
        img.onload = onCritDone;
        img.onerror = onCritDone;
      }
    }

    // Safety timeout: Guarantees loading NEVER gets stuck on slow/offline connections
    const safetyTimer = setTimeout(() => {
      targetProgress = 100;
    }, 900);

    // Progressive background stream for remaining frames
    let bgIndex = isMobile ? CRITICAL_COUNT * 2 : CRITICAL_COUNT;
    const loadNextBatch = () => {
      if (isCancelled) return;
      if (bgIndex >= frameCount) return;

      const batchSize = isMobile ? 4 : 8;
      const step = isMobile ? 2 : 1;

      for (let b = 0; b < batchSize && bgIndex < frameCount; b++) {
        loadFrame(bgIndex, false);
        bgIndex += step;
      }

      if (bgIndex < frameCount) {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          window.requestIdleCallback(loadNextBatch, { timeout: 120 });
        } else {
          setTimeout(loadNextBatch, 30);
        }
      }
    };

    const bgTimer = setTimeout(loadNextBatch, 150);

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
      clearTimeout(bgTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderFrame]);

  // 3. RESIZE HANDLER
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isMobileRef.current = window.innerWidth < 768;

    // Cap DPR on mobile to save GPU memory while keeping clarity
    const rawDpr = window.devicePixelRatio || 1;
    const dpr = isMobileRef.current
      ? Math.min(rawDpr, 1.5)
      : Math.min(rawDpr, 2);

    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);

    if (revealCanvasRef.current) {
      revealCanvasRef.current.width = Math.round(window.innerWidth * dpr);
      revealCanvasRef.current.height = Math.round(window.innerHeight * dpr);
    }

    if (revealMaskCanvasRef.current) {
      revealMaskCanvasRef.current.width = Math.round(window.innerWidth * dpr);
      revealMaskCanvasRef.current.height = Math.round(window.innerHeight * dpr);

      const maskCtx = revealMaskCanvasRef.current.getContext("2d");
      if (maskCtx) {
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(
          0,
          0,
          revealMaskCanvasRef.current.width,
          revealMaskCanvasRef.current.height,
        );
      }
    }

    renderFrame(currentFrameRef.current.index);
  }, [renderFrame]);

  // 4. GSAP ANIMATIONS
  useGSAP(
    () => {
      if (!preloaderComplete) {
        document.body.style.overflow = "hidden";
      }

      if (!isLoaded) return;

      // PRELOADER: Fast and responsive panel reveal
      const preloaderTimeline = gsap.timeline({
        onComplete: () => {
          setPreloaderComplete(true);
          document.body.style.overflow = "";
        },
      });

      preloaderTimeline.to(".preloader-panel", {
        yPercent: 100,
        duration: 0.65,
        stagger: 0.04,
        ease: "power3.inOut",
      });

      // Initial canvas render
      handleResize();

      window.addEventListener("resize", handleResize);

      const frameCount = 240;

      // IMAGE SEQUENCE SCROLL ANIMATION
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,

        onUpdate: (self) => {
          const frameIndex = Math.floor(self.progress * (frameCount - 1));

          if (frameIndex !== currentFrameRef.current.index) {
            currentFrameRef.current.index = frameIndex;

            requestAnimationFrame(() => {
              renderFrame(frameIndex);
            });
          }
        },
      });

      // IMAGE ZOOM
      gsap.to(canvasRef.current, {
        scale: 1.1,
        ease: "none",

        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // ----------------------------------
      // TEXT REVEAL - VAPORIZE SYNCED WITH SCROLL
      // ----------------------------------

      const textProgress = {
        eyebrow: 0,
        name1: 0,
        name2: 0,
        role: 0,
        desc: 0,
        cta: 0,
        stats: 0,
        dissolve: 0,
      };

      // Initially hide decorative accents & non-canvas elements
      gsap.set(".hero-intro-eyebrow-line", {
        scaleX: 0,
        transformOrigin: "left center",
        autoAlpha: 0,
      });

      gsap.set(".hero-role-bar", {
        scaleY: 0,
        transformOrigin: "top center",
        autoAlpha: 0,
      });

      gsap.set(".hero-cta", {
        autoAlpha: 0,
        y: 20,
      });

      gsap.set(".hero-stat", {
        autoAlpha: 0,
        y: 20,
      });

      gsap.set(".hero-scroll-hint, .hero-footer", {
        autoAlpha: 0,
        y: 20,
      });

      // Text animation timeline synced with scroll scrub
      const introTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
        onUpdate: () => {
          eyebrowVapourRef.current?.setAnimationProgress(
            textProgress.eyebrow,
            0,
          );
          name1VapourRef.current?.setAnimationProgress(textProgress.name1, 0);
          name2VapourRef.current?.setAnimationProgress(textProgress.name2, 0);
          roleVapourRef.current?.setAnimationProgress(textProgress.role, 0);
          descVapourRef.current?.setAnimationProgress(textProgress.desc, 0);
          ctaVapourRef.current?.setAnimationProgress(textProgress.cta, 0);
          statsVapourRefs.current.forEach((r) => {
            r?.setAnimationProgress(textProgress.stats, 0);
          });
        },
      });

      // --- ASSEMBLE (REVEAL) PHASE ---
      introTimeline
        // 74–77%: HELLO, I'M reveals slowly
        .to(
          textProgress,
          {
            eyebrow: 1,
            ease: "none",
            duration: 0.03,
          },
          0.74,
        )
        .to(
          ".hero-intro-eyebrow-line",
          {
            scaleX: 1,
            autoAlpha: 1,
            ease: "none",
            duration: 0.03,
          },
          0.74,
        )

        // 77–83%: ABHISHEK KASHYAP reveals
        .to(
          textProgress,
          {
            name1: 1,
            ease: "none",
            duration: 0.04,
          },
          0.77,
        )
        .to(
          textProgress,
          {
            name2: 1,
            ease: "none",
            duration: 0.04,
          },
          0.79,
        )

        // 83–86%: CREATIVE DEVELOPER reveals
        .to(
          textProgress,
          {
            role: 1,
            ease: "none",
            duration: 0.03,
          },
          0.83,
        )
        .to(
          ".hero-role-bar",
          {
            scaleY: 1,
            autoAlpha: 1,
            ease: "none",
            duration: 0.03,
          },
          0.83,
        )

        // 86–89%: Description reveals
        .to(
          textProgress,
          {
            desc: 1,
            ease: "none",
            duration: 0.03,
          },
          0.86,
        )

        // 89–92%: DOWNLOAD PDF button reveals
        .to(
          textProgress,
          {
            cta: 1,
            ease: "none",
            duration: 0.03,
          },
          0.89,
        )
        .to(
          ".hero-cta",
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            duration: 0.03,
          },
          0.89,
        )

        // 92–96%: Statistics reveal
        .to(
          textProgress,
          {
            stats: 1,
            ease: "none",
            duration: 0.04,
          },
          0.92,
        )
        .to(
          ".hero-stat",
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.015,
            ease: "none",
            duration: 0.04,
          },
          0.92,
        )

        // 94–96%: Scroll hint and footer appear
        .to(
          ".hero-scroll-hint, .hero-footer",
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            duration: 0.02,
          },
          0.94,
        );

      // 96–100%: Everything stays fully visible and readable

      // ----------------------------------
      // CINEMATIC LIGHT REVEAL
      // ----------------------------------

      const renderReveal = () => {
        if (
          isMobileRef.current ||
          !revealCanvasRef.current ||
          !revealMaskCanvasRef.current ||
          !heroOverlayObj.current
        ) {
          return;
        }

        // Only active during frames 235-240
        if (currentFrameRef.current.index < 235) {
          if (mouseRef.current.isActive) {
            const ctx = revealCanvasRef.current.getContext("2d", { alpha: true });
            const maskCtx = revealMaskCanvasRef.current.getContext("2d", { alpha: true });
            if (ctx && maskCtx) {
              ctx.clearRect(0, 0, revealCanvasRef.current.width, revealCanvasRef.current.height);
              maskCtx.globalCompositeOperation = "source-over";
              maskCtx.fillStyle = "black";
              maskCtx.fillRect(0, 0, revealMaskCanvasRef.current.width, revealMaskCanvasRef.current.height);
            }
            mouseRef.current.isActive = false;
          }
          return;
        }

        const canvas = revealCanvasRef.current;
        const maskCanvas = revealMaskCanvasRef.current;

        const ctx = canvas.getContext("2d", {
          alpha: true,
        });

        const maskCtx = maskCanvas.getContext("2d", {
          alpha: true,
        });

        const w = canvas.width;
        const h = canvas.height;

        if (!ctx || !maskCtx || w === 0 || h === 0) {
          return;
        }

        mouseRef.current.isActive = true;

        // Fade mask trail
        maskCtx.globalCompositeOperation = "source-over";

        maskCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
        maskCtx.fillRect(0, 0, w, h);

        // Draw brush stroke
        const { x, y } = mouseRef.current;

        if (x >= 0 && y >= 0) {
          maskCtx.globalCompositeOperation = "destination-out";

          const radius = 250;

          const gradient = maskCtx.createRadialGradient(x, y, 0, x, y, radius);

          gradient.addColorStop(0, "rgba(255, 255, 255, 1)");

          gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");

          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

          maskCtx.fillStyle = gradient;
          maskCtx.beginPath();
          maskCtx.arc(x, y, radius, 0, Math.PI * 2);
          maskCtx.fill();
        }

        // Render overlay image
        ctx.clearRect(0, 0, w, h);

        const img = heroOverlayObj.current;

        if (isMobileRef.current) {
          // Cover-style for overlay on mobile (matches main canvas)
          const scaleX = w / img.width;
          const scaleY = h / img.height;
          const scale = Math.max(scaleX, scaleY);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const imgX = (w - drawW) / 2;
          const imgY = (h - drawH) / 2;

          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(img, imgX, imgY, drawW, drawH);
        } else {
          const scale = w / img.width;
          const imgY = h / 2 - (img.height / 2) * scale;

          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(img, 0, imgY, img.width * scale, img.height * scale);
        }

        // Apply mask
        ctx.globalCompositeOperation = "destination-out";

        ctx.drawImage(maskCanvas, 0, 0);
      };

      gsap.ticker.add(renderReveal);

      // Mouse movement
      const handleMouseMove = (e) => {
        const dpr = window.devicePixelRatio || 1;

        mouseRef.current.x = e.clientX * dpr;
        mouseRef.current.y = e.clientY * dpr;
      };

      const handleMouseLeave = () => {
        mouseRef.current.x = -1000;
        mouseRef.current.y = -1000;
      };

      const stickyViewport = containerRef.current.querySelector(".sticky");

      if (stickyViewport) {
        stickyViewport.addEventListener("mousemove", handleMouseMove);

        stickyViewport.addEventListener("mouseleave", handleMouseLeave);
      }

      // CLEANUP
      return () => {
        gsap.ticker.remove(renderReveal);

        if (stickyViewport) {
          stickyViewport.removeEventListener("mousemove", handleMouseMove);

          stickyViewport.removeEventListener("mouseleave", handleMouseLeave);
        }

        window.removeEventListener("resize", handleResize);

        document.body.style.overflow = "";
      };
    },
    {
      scope: containerRef,
      dependencies: [isLoaded],
    },
  );

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative h-[400vh] w-full bg-black"
    >
      <Navbar />

      {/* PRELOADER */}
      {!preloaderComplete && (
        <div className="fixed inset-0 z-[200] flex w-full h-screen pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="preloader-panel h-full bg-[#1a1a1a] border-r border-[#222]"
              style={{ width: "16.666667%" }}
            />
          ))}

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-10 text-sm font-medium tracking-widest uppercase opacity-50">
              {loadingProgress}%
            </div>
          )}
        </div>
      )}

      {/* STICKY VIEWPORT */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* MAIN CANVAS */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover origin-center"
        />

        {/* CINEMATIC REVEAL CANVAS */}
        <canvas
          ref={revealCanvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none z-[2] hidden md:block"
        />

        {/* BACKGROUND TEXT */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          <h1
            ref={bgTextRef}
            className="text-[18vw] font-black text-[#ff2a2a] tracking-tighter opacity-0 whitespace-nowrap"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            CREATIVE
          </h1>
        </div>

        {/* TOP LAYER IMAGE */}
        <img
          ref={topLayerRef}
          src={HERO_FRAMES[HERO_FRAMES.length - 1] || ""}
          className="absolute inset-0 h-full w-full object-cover origin-center pointer-events-none z-[2] opacity-0"
          alt="Top Layer Cutout"
        />

        {/* PERSONAL INTRO */}
        <div className="absolute inset-0 z-[10] pointer-events-none">
          <div className="absolute left-4 sm:left-6 md:left-[5.2%] top-[52%] sm:top-[40%] md:top-[19%] w-[92%] sm:w-[70%] md:w-[39%] max-w-[570px] pointer-events-auto">
            {/* HELLO */}
            <p className="hero-intro-eyebrow flex items-center gap-3 md:gap-4 text-white/85 text-[9px] sm:text-[10px] md:text-[13px] uppercase tracking-[0.34em] mb-3 md:mb-5">
              <VapourTextEffect
                ref={eyebrowVapourRef}
                text="HELLO, I'M"
                color="rgb(255, 255, 255)"
                spread={4}
                density={5}
                direction="left-to-right"
              />
              <span className="hero-intro-eyebrow-line block h-px w-10 sm:w-16 md:w-28 bg-[#ff2a2a]" />
            </p>

            {/* NAME */}
            <h1 className="font-black uppercase leading-[0.88] tracking-[-0.055em] text-white text-[2.2rem] sm:text-[clamp(2.7rem,6.2vw,6.2rem)] md:text-[clamp(2.7rem,6.2vw,6.2rem)]">
              <span className="hero-name-line block">
                <VapourTextEffect
                  ref={name1VapourRef}
                  text="ABHISHEK"
                  color="rgb(255, 255, 255)"
                  spread={5}
                  density={5}
                  direction="left-to-right"
                />
              </span>

              <span className="hero-name-line block text-[#ff2a2a]">
                <VapourTextEffect
                  ref={name2VapourRef}
                  text={[
                    { text: "KASHYAP", color: "rgb(255, 42, 42)" },
                    { text: ".", color: "rgb(255, 255, 255)" },
                  ]}
                  spread={5}
                  density={5}
                  direction="left-to-right"
                />
              </span>
            </h1>

            {/* ROLE */}
            <div className="hero-role mt-4 md:mt-6 flex items-center gap-2 md:gap-3">
              <span className="hero-role-bar block w-[3px] h-6 md:h-8 bg-[#ff2a2a]" />

              <h2 className="text-white text-[11px] sm:text-[13px] md:text-[19px] font-semibold uppercase tracking-[0.18em] md:tracking-[0.24em]">
                <VapourTextEffect
                  ref={roleVapourRef}
                  text="CREATIVE DEVELOPER"
                  color="rgb(255, 255, 255)"
                  spread={4}
                  density={5}
                  direction="left-to-right"
                />
              </h2>
            </div>

            {/* INTRODUCTION */}
            <p className="hero-description mt-3 md:mt-5 max-w-[440px] text-white/75 text-[11px] sm:text-[13px] md:text-[16px] leading-[1.55] md:leading-[1.65]">
              <VapourTextEffect
                ref={descVapourRef}
                text="I build modern digital experiences by combining creative design, technology and interactive web animations."
                color="rgba(255, 255, 255, 0.85)"
                spread={4}
                density={5}
                multiline={true}
                direction="left-to-right"
              />
            </p>

            {/* DOWNLOAD PDF */}
            <a
              href={resumeUrl || "#"}
              target={resumeUrl ? "_blank" : undefined}
              rel={resumeUrl ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (!resumeUrl) {
                  e.preventDefault();
                }
              }}
              aria-label="Download Resume PDF"
              className="hero-cta mt-5 md:mt-7 inline-flex items-center gap-3 md:gap-4 border border-[#ff2a2a] bg-[#ff2a2a]/[0.08] px-5 sm:px-6 md:px-8 py-3 md:py-4 text-white text-[10px] sm:text-[11px] md:text-[13px] font-semibold uppercase tracking-[0.12em] md:tracking-[0.16em] transition-all duration-300 hover:bg-[#ff2a2a] hover:shadow-[0_0_24px_rgba(255,42,42,0.28)]"
            >
              <span>
                <VapourTextEffect
                  ref={ctaVapourRef}
                  text="DOWNLOAD PDF"
                  color="rgb(255, 255, 255)"
                  spread={3}
                  density={5}
                  direction="left-to-right"
                />
              </span>

              <span className="text-lg leading-none text-[#ff2a2a]">↓</span>
            </a>

            {/* STATS */}
            <div className="mt-6 md:mt-12 flex items-center gap-3 sm:gap-5 md:gap-8">
              {HERO_STATS.map((stat, index) => (
                <div
                  key={index}
                  className={`hero-stat ${
                    index < HERO_STATS.length - 1
                      ? "pr-3 sm:pr-5 md:pr-8 border-r border-white/25"
                      : ""
                  }`}
                >
                  <p className="text-[#ff2a2a] text-[20px] sm:text-[23px] md:text-[29px] font-bold leading-none">
                    <VapourTextEffect
                      ref={(el) => (statsVapourRefs.current[index] = el)}
                      text={stat.value}
                      color="rgb(255, 42, 42)"
                      spread={3}
                      density={5}
                      direction="left-to-right"
                    />
                  </p>

                  <p className="mt-1 md:mt-2 text-white/80 text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.1em]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SCROLL INDICATOR */}
          <div className="hero-scroll-hint absolute right-4 sm:right-6 md:right-[4%] bottom-[20%] sm:bottom-[17%] md:bottom-[17%] flex items-center gap-2 md:gap-3 text-white text-[9px] sm:text-[10px] md:text-[12px] uppercase tracking-[0.2em]">
            <span>Scroll to explore</span>

            <span className="text-[#ff2a2a] text-xl md:text-2xl leading-none">
              ↓
            </span>
          </div>

          {/* FOOTER */}
          <div className="hero-footer absolute bottom-0 left-4 right-4 sm:left-6 sm:right-6 md:left-[4%] md:right-[4%] border-t border-white/15 py-4 md:py-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 text-white text-[8px] sm:text-[9px] md:text-[11px] font-medium uppercase tracking-[0.14em] md:tracking-[0.18em] flex-shrink-0">
              <span>Development</span>

              <span className="text-[#ff2a2a]">•</span>

              <span>Design</span>

              <span className="text-[#ff2a2a]">•</span>

              <span>Creativity</span>
            </div>

            <p className="text-white/50 text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.12em] truncate max-w-full">
              © 2026 ABHI. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
