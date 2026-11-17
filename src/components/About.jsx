import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { getAbout } from "../lib/queries";
import { urlFor } from "../lib/sanity";

import defaultCrimsonMoonImage from "../assets/about/crimson_moon_peaks.jpg";

import HorizonVisual from "./HorizonVisual";
import VapourTextEffect from "./ui/vapour-text-effect";
import "./About.css";

gsap.registerPlugin(ScrollTrigger);

// Aspect ratio matching ECHO reference card (1024 / 546 ≈ 1.875)
const ASPECT_RATIO = 1024 / 546;

// Fallback content for the three-stage personal journey and controls
const DEFAULT_ABOUT = {
  titleFirst: "ABOUT",
  titleRest: "ME",
  subtitle: "BACKGROUND & VISION",
  scrollPrompt: "SCROLL TO EXPAND",

  // Stage 1
  stage1Headline:
    "TURNING VISIONARY IDEAS INTO FAST, DISTINCTIVE DIGITAL EXPERIENCES.",

  // Stage 2
  stage2Headline: "A CREATIVE MIND. A DEVELOPER'S APPROACH.",
  stage2Bio1:
    "I'M ABHISHEK — A CREATIVE DEVELOPER, DESIGN ENTHUSIAST AND CURRENTLY PURSUING MY BACHELOR OF COMPUTER APPLICATIONS (BCA) AT GRAPHIC ERA HILL UNIVERSITY, DEHRADUN.",
  stage2Bio2:
    "I'M PASSIONATE ABOUT EXPLORING TECHNOLOGY AND TURNING CREATIVE IDEAS INTO REAL-WORLD DIGITAL EXPERIENCES.",

  // Stage 3
  stage3Headline: "BUILT ON CURIOSITY. DRIVEN BY POSSIBILITY.",
  stage3Bio1: "ALWAYS LEARNING. ALWAYS EXPERIMENTING. ALWAYS BUILDING.",
  stage3Bio2: "THE JOURNEY HAS JUST BEGUN.",

  // Location and Action Buttons
  location: "BASED IN INDIA • WORLDWIDE",
  disciplinesLabel: "DISCIPLINE & CRAFT",
  disciplines: "UI/UX • WEB DESIGN • WEBFLOW • FIGMA",
  ctaText: "GET IN TOUCH",
  ctaLink: "#contact",
};

const clamp = (val, min = 0, max = 1) => Math.min(max, Math.max(min, val));
const smoothStep = (val) => {
  const t = clamp(val);
  return t * t * (3 - 2 * t);
};

const calcDimensions = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;

  if (isMobile) {
    const startW = Math.min(280, vw * 0.88);
    const startH = Math.min(360, vh * 0.52);

    // Taller portrait card on mobile
    const endW = vw * 0.92;
    const endH = Math.min(vh * 0.72, 680);

    return { startW, startH, endW, endH, isMobile };
  }

  const startW = 300;
  const startH = 400;

  const maxWByViewport = vw * 0.94;
  const maxWByHeight = vh * 0.86 * ASPECT_RATIO;
  const endW = Math.min(maxWByViewport, maxWByHeight);
  const endH = endW / ASPECT_RATIO;

  return { startW, startH, endW, endH, isMobile };
};

const About = () => {
  const [sanityData, setSanityData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Core DOM refs for direct hardware-accelerated manipulation
  const sectionRef = useRef(null);
  const bgImgRef = useRef(null);
  const mediaContainerRef = useRef(null);
  const mediaImgRef = useRef(null);
  const mediaOverlayRef = useRef(null);
  const cinematicLightRef = useRef(null);
  const titleFirstRef = useRef(null);
  const titleRestRef = useRef(null);
  const dateTagRef = useRef(null);
  const scrollPromptRef = useRef(null);

  // Perimeter layout refs (Top location & Bottom CTAs / disciplines)
  const mediaContentRef = useRef(null);
  const topRailRef = useRef(null);
  const bottomRailRef = useRef(null);

  // Three-stage personal journey container refs
  const stage1Ref = useRef(null);
  const stage2Ref = useRef(null);
  const stage3Ref = useRef(null);

  // 21st.dev Vaporize Text Effect Imperative Refs
  const stage1HeadlineRef = useRef(null);

  const stage2HeadlineRef = useRef(null);
  const stage2Bio1Ref = useRef(null);
  const stage2Bio2Ref = useRef(null);

  const stage3HeadlineRef = useRef(null);
  const stage3Bio1Ref = useRef(null);
  const stage3Bio2Ref = useRef(null);

  // 21st.dev Horizon Three.js scene Imperative Ref
  const horizonRef = useRef(null);

  // Responsive state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Sanity About content dynamically
  useEffect(() => {
    let isMounted = true;

    getAbout()
      .then((data) => {
        if (isMounted && data) {
          setSanityData(data);
        }
      })
      .catch((err) => {
        console.warn("Using default About fallback content:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Synchronized Timeline Orchestration
   * Total section scroll progress p: [0.0 -> 1.0]
   *
   * 1. Card Opening: p in [0.0 -> 0.22]
   *    - Card expands from closed dimensions to full viewport size
   *    - Split titles translate outward and fade
   *    - Journey content, header, footer, and Horizon remain completely hidden
   *
   * 2. Card Fully Opened & First Stage Reveal: p in [0.22 -> 0.52]
   *    - As soon as card is fully expanded (p >= 0.22):
   *      * Header & footer fade in normally
   *      * Horizon 3D scene starts and continues smoothly
   *      * Stage 1 headline reveals via Vaporize Text Effect (p: 0.22 -> 0.34)
   *      * Stage 1 solid reading window (p: 0.34 -> 0.44)
   *      * Stage 1 dissolves via Vaporize Text Effect (p: 0.44 -> 0.52)
   *
   * 3. Stage 2 Journey: p in [0.50 -> 0.78]
   *      * Stage 2 reveals via Vaporize Text Effect (p: 0.50 -> 0.62)
   *      * Stage 2 solid reading window (p: 0.62 -> 0.72)
   *      * Stage 2 dissolves via Vaporize Text Effect (p: 0.72 -> 0.80)
   *
   * 4. Stage 3 Journey: p in [0.78 -> 1.0]
   *      * Stage 3 reveals via Vaporize Text Effect (p: 0.78 -> 0.90)
   *      * Stage 3 remains solid and active (p: 0.90 -> 1.0)
   *
   * 5. Continuous Horizon Animation:
   *    - Smooth, continuous 3D camera travel and parallax across all three stages (p: 0.22 -> 1.0)
   *    - Reverses smoothly when scrolling up
   */
  const applyFrame = useCallback((progress) => {
    const p = clamp(progress);

    const { startW, startH, endW, endH, isMobile: isMob } = calcDimensions();

    // Ensure perimeter content bounds match the expanded card layout
    if (mediaContentRef.current) {
      mediaContentRef.current.style.width = `${endW.toFixed(1)}px`;
      mediaContentRef.current.style.height = `${endH.toFixed(1)}px`;
    }

    // --- PHASE 1: CARD EXPANSION [p: 0.0 -> 0.22] ---
    const CARD_EXPAND_END = 0.22;
    const cardProgress = smoothStep(clamp(p / CARD_EXPAND_END));
    const currentW = startW + cardProgress * (endW - startW);
    const currentH = startH + cardProgress * (endH - startH);
    const textTranslateX = (cardProgress * (isMob ? 180 : 150)).toFixed(1);

    // 1. Direct 1:1 hardware composited card dimensions
    if (mediaContainerRef.current) {
      mediaContainerRef.current.style.width = `${currentW.toFixed(1)}px`;
      mediaContainerRef.current.style.height = `${currentH.toFixed(1)}px`;
      const borderOpacity = (0.1 + (1 - cardProgress) * 0.25).toFixed(2);
      mediaContainerRef.current.style.borderColor = `rgba(255, 255, 255, ${borderOpacity})`;
    }

    // 2. Ambient background image fade
    if (bgImgRef.current) {
      bgImgRef.current.style.opacity = Math.max(
        0,
        1 - cardProgress * 1.4,
      ).toFixed(3);
    }

    // 3. Subtle overlay contrast
    if (mediaOverlayRef.current) {
      mediaOverlayRef.current.style.opacity = Math.max(
        0.3,
        0.65 - cardProgress * 0.25,
      ).toFixed(3);
    }

    // 4. Cinematic spotlight treatment
    if (cinematicLightRef.current) {
      const lightProgress = smoothStep((cardProgress - 0.2) / 0.8);
      cinematicLightRef.current.style.opacity = (lightProgress * 0.85).toFixed(
        3,
      );
    }

    // 5. Split titles translate outward and fade (ABOUT moves left, ME moves right)
    const titleOpacity = Math.max(0, 1 - cardProgress * 1.6).toFixed(3);
    if (titleFirstRef.current) {
      titleFirstRef.current.style.transform = `translateX(-${textTranslateX}vw) translateZ(0)`;
      titleFirstRef.current.style.opacity = titleOpacity;
    }
    if (titleRestRef.current) {
      titleRestRef.current.style.transform = `translateX(${textTranslateX}vw) translateZ(0)`;
      titleRestRef.current.style.opacity = titleOpacity;
    }

    // 6. Subtitles translate outward and fade
    const subOpacity = Math.max(0, 1 - cardProgress * 2.5).toFixed(3);
    if (dateTagRef.current) {
      dateTagRef.current.style.transform = `translateX(-${textTranslateX}vw)`;
      dateTagRef.current.style.opacity = subOpacity;
    }
    if (scrollPromptRef.current) {
      scrollPromptRef.current.style.transform = `translateX(${textTranslateX}vw)`;
      scrollPromptRef.current.style.opacity = subOpacity;
    }

    // --- PHASE 2: PERIMETER RAILS (Header & Footer) ---
    // Revealed normally as soon as card is fully opened (p >= 0.22)
    const railFade = smoothStep((p - 0.22) / 0.06);
    if (topRailRef.current) {
      topRailRef.current.style.opacity = railFade.toFixed(3);
      topRailRef.current.style.transform = `translateY(${((1 - railFade) * -8).toFixed(1)}px)`;
    }
    if (bottomRailRef.current) {
      bottomRailRef.current.style.opacity = railFade.toFixed(3);
      bottomRailRef.current.style.transform = `translateY(${((1 - railFade) * 10).toFixed(1)}px)`;
      bottomRailRef.current.style.pointerEvents =
        railFade > 0.5 ? "auto" : "none";
    }

    // --- PHASE 3: CONTINUOUS HORIZON 3D SCENE ---
    // Starts at the exact same time as card full expansion & Stage 1 reveal (p >= 0.22)
    // Runs continuously throughout Stage 1, Stage 2, and Stage 3 (p: 0.22 -> 1.0)
    const horizonFade = smoothStep((p - 0.22) / 0.06);
    const horizonProgress = clamp((p - 0.22) / (1.0 - 0.22), 0, 1);
    horizonRef.current?.setProgress(horizonProgress, horizonFade);

    // --- PHASE 4: THREE-STAGE PERSONAL JOURNEY (VAPORIZE TEXT EFFECT) ---

    // STAGE 1:
    // Assemble: 0.22 -> 0.34
    // Hold: 0.34 -> 0.44
    // Dissolve: 0.44 -> 0.52
    const s1Assemble = smoothStep((p - 0.22) / 0.12);
    const s1Dissolve = smoothStep((p - 0.44) / 0.08);
    stage1HeadlineRef.current?.setAnimationProgress(s1Assemble, s1Dissolve);

    if (stage1Ref.current) {
      stage1Ref.current.style.opacity = String(
        Math.min(s1Assemble, 1 - s1Dissolve),
      );
      stage1Ref.current.style.pointerEvents = "none";
    }

    // STAGE 2:
    // Assemble: 0.50 -> 0.62
    // Hold: 0.62 -> 0.72
    // Dissolve: 0.72 -> 0.80
    const s2Assemble = smoothStep((p - 0.5) / 0.12);
    const s2Dissolve = smoothStep((p - 0.72) / 0.08);
    stage2HeadlineRef.current?.setAnimationProgress(s2Assemble, s2Dissolve);
    stage2Bio1Ref.current?.setAnimationProgress(s2Assemble, s2Dissolve);
    stage2Bio2Ref.current?.setAnimationProgress(s2Assemble, s2Dissolve);

    if (stage2Ref.current) {
      stage2Ref.current.style.opacity = String(
        Math.min(s2Assemble, 1 - s2Dissolve),
      );
      stage2Ref.current.style.pointerEvents = "none";
    }

    // STAGE 3:
    // Assemble: 0.78 -> 0.90
    // Hold: 0.90 -> 1.0
    // Dissolve: 0 (stays active at final stage)
    const s3Assemble = smoothStep((p - 0.78) / 0.12);
    const s3Dissolve = 0;
    stage3HeadlineRef.current?.setAnimationProgress(s3Assemble, s3Dissolve);
    stage3Bio1Ref.current?.setAnimationProgress(s3Assemble, s3Dissolve);
    stage3Bio2Ref.current?.setAnimationProgress(s3Assemble, s3Dissolve);

    if (stage3Ref.current) {
      stage3Ref.current.style.opacity = String(s3Assemble);
      stage3Ref.current.style.pointerEvents = "none";
    }
  }, []);

  // GSAP ScrollTrigger synchronized with ECHO scrub behavior
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      applyFrame(0);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const target = Math.min(Math.max(self.progress, 0), 1);
          applyFrame(target);
        },
        onRefresh: (self) => {
          const target = Math.min(Math.max(self.progress, 0), 1);
          applyFrame(target);
        },
      });

      const handleResize = () => {
        const { endW, endH } = calcDimensions();
        if (mediaContentRef.current) {
          mediaContentRef.current.style.width = `${endW.toFixed(1)}px`;
          mediaContentRef.current.style.height = `${endH.toFixed(1)}px`;
        }
        ScrollTrigger.refresh();
        const target = Math.min(Math.max(trigger.progress, 0), 1);
        applyFrame(target);
      };

      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("orientationchange", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
        trigger.kill();
      };
    },
    { scope: sectionRef, dependencies: [applyFrame] },
  );

  // Content resolution with exact journey wording as guaranteed fallbacks
  const titleFirst = sanityData?.titleFirst || DEFAULT_ABOUT.titleFirst;
  const titleRest = sanityData?.titleRest || DEFAULT_ABOUT.titleRest;
  const subtitle = sanityData?.subtitle || DEFAULT_ABOUT.subtitle;
  const scrollPrompt = sanityData?.scrollPrompt || DEFAULT_ABOUT.scrollPrompt;

  // Stage 1 Content
  const stage1Headline =
    sanityData?.stage1Headline ||
    sanityData?.headline ||
    DEFAULT_ABOUT.stage1Headline;

  // Stage 2 Content
  const stage2Headline =
    sanityData?.stage2Headline || DEFAULT_ABOUT.stage2Headline;
  const stage2Bio1 =
    sanityData?.stage2Bio1 || sanityData?.fullBio || DEFAULT_ABOUT.stage2Bio1;
  const stage2Bio2 =
    sanityData?.stage2Bio2 || sanityData?.shortBio || DEFAULT_ABOUT.stage2Bio2;

  // Stage 3 Content
  const stage3Headline =
    sanityData?.stage3Headline || DEFAULT_ABOUT.stage3Headline;
  const stage3Bio1 = sanityData?.stage3Bio1 || DEFAULT_ABOUT.stage3Bio1;
  const stage3Bio2 = sanityData?.stage3Bio2 || DEFAULT_ABOUT.stage3Bio2;

  // Kept elements
  const location = sanityData?.location || DEFAULT_ABOUT.location;
  const disciplinesLabel =
    sanityData?.disciplinesLabel || DEFAULT_ABOUT.disciplinesLabel;
  const disciplines = sanityData?.disciplines || DEFAULT_ABOUT.disciplines;
  const ctaText = sanityData?.ctaText || DEFAULT_ABOUT.ctaText;
  const ctaLink =
    sanityData?.ctaLink ||
    (sanityData?.email ? `mailto:${sanityData.email}` : DEFAULT_ABOUT.ctaLink);
  const secondaryCtaText =
    sanityData?.secondaryCtaText || DEFAULT_ABOUT.secondaryCtaText;
  const secondaryCtaLink =
    sanityData?.secondaryCtaLink || DEFAULT_ABOUT.secondaryCtaLink;

  // Central artwork strictly displays the Crimson Moon image
  const centerImageSrc = defaultCrimsonMoonImage;

  // Background artwork strictly uses Crimson Moon as fallback so template images NEVER appear
  const bgImageSrc = sanityData?.bgImage
    ? urlFor(sanityData.bgImage)?.url() || defaultCrimsonMoonImage
    : defaultCrimsonMoonImage;

  const initialDims = calcDimensions();

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full bg-[#0D0D0D] text-white"
      style={{ minHeight: "420vh" }}
      aria-label="About section"
    >
      <div className="about-sticky-viewport">
        {/* Ambient background with dynamic opacity */}
        <div ref={bgImgRef} id="sem-bg-img">
          <img src={bgImageSrc} alt="Crimson Moon Background" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Centered Interactive Stage Container */}
        <div className="container mx-auto flex flex-col items-center justify-start relative z-10 w-full h-full">
          <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
            {/* Expanding Media Card */}
            <div
              ref={mediaContainerRef}
              id="sem-media-container"
              style={{
                width: `${initialDims.startW}px`,
                height: `${initialDims.startH}px`,
                maxWidth: "95vw",
                maxHeight: "85vh",
              }}
            >
              {/* Media Container holding Crimson Moon + Horizon 3D Visual + Journey Content */}
              <div className="relative w-full h-full overflow-hidden rounded-xl flex items-center justify-center bg-[#07090E]">
                {/* Continuous 21st.dev Horizon Three.js scene (Mounted once, crystal-clear transparent overlay) */}
                <HorizonVisual ref={horizonRef} isMobile={isMobile} />

                {/* Base Image displaying Crimson Moon Over Misty Peaks with rock-solid stability */}
                <img
                  ref={mediaImgRef}
                  id="sem-media-img"
                  src={centerImageSrc}
                  alt="Crimson Moon Over Misty Peaks"
                  className="absolute inset-0 w-full h-full object-cover rounded-xl transition-none pointer-events-none select-none"
                  style={{
                    zIndex: 0,
                    transform: "scale(1.02) translateZ(0)",
                    transformOrigin: "center",
                    backfaceVisibility: "hidden",
                  }}
                />

                {/* Dark cinematic overlay */}
                <div
                  ref={mediaOverlayRef}
                  id="sem-media-overlay"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex: 2,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.18) 100%)",
                    opacity: 0.25,
                  }}
                />

                {/* Cinematic spotlight */}
                <div
                  ref={cinematicLightRef}
                  className="about-cinematic-light"
                />

                {/* Clean, Minimal, Cinematic Perimeter Layout & Journey Stages */}
                <div
                  ref={mediaContentRef}
                  id="sem-media-content"
                  className="absolute z-20 flex flex-col justify-between p-5 sm:p-7 md:p-8 select-none"
                  style={{
                    width: `${initialDims.endW}px`,
                    height: `${initialDims.endH}px`,
                  }}
                >
                  {/* TOP AREA: Header Location Text (Shown normally once card opens) */}
                  <div
                    ref={topRailRef}
                    className="flex items-center justify-end w-full border-b border-white/10 pb-3"
                    style={{ opacity: 0 }}
                  >
                    <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                      {location}
                    </span>
                  </div>

                  {/* CENTER ZONE: The Three-Stage Personal Journey with Vaporize Text Effect */}
                  <div className="flex-1 relative flex items-center justify-center w-full min-h-0 pointer-events-none my-auto">
                    {/* Stage 1 Content (Reveals upon card full expansion with 21st.dev Vaporize Text Effect) */}
                    <div
                      ref={stage1Ref}
                      className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-8 pointer-events-none"
                      style={{ opacity: 0 }}
                    >
                      <VapourTextEffect
                        ref={stage1HeadlineRef}
                        text={stage1Headline}
                        as="h2"
                        className="text-base sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white max-w-2xl leading-snug drop-shadow-2xl text-center"
                        multiline={true}
                        color="rgb(255, 255, 255)"
                        spread={4}
                        density={5}
                      />
                    </div>

                    {/* Stage 2 Content (Reveals on further scroll with Vaporize Text Effect) */}
                    <div
                      ref={stage2Ref}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 pointer-events-none"
                      style={{ opacity: 0 }}
                    >
                      <div className="mb-3 max-w-2xl">
                        <VapourTextEffect
                          ref={stage2HeadlineRef}
                          text={stage2Headline}
                          as="h3"
                          className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-2xl text-center"
                          multiline={true}
                          color="rgb(255, 255, 255)"
                          spread={4}
                          density={5}
                        />
                      </div>
                      <div className="mb-2 max-w-2xl">
                        <VapourTextEffect
                          ref={stage2Bio1Ref}
                          text={stage2Bio1}
                          as="p"
                          className="text-xs sm:text-sm md:text-base font-medium uppercase leading-relaxed text-neutral-200 tracking-wide drop-shadow text-center"
                          multiline={true}
                          color="rgb(229, 229, 229)"
                          spread={4}
                          density={5}
                        />
                      </div>
                      <div className="max-w-xl">
                        <VapourTextEffect
                          ref={stage2Bio2Ref}
                          text={stage2Bio2}
                          as="p"
                          className="text-[11px] sm:text-xs md:text-sm uppercase leading-relaxed text-neutral-400 tracking-wider drop-shadow text-center"
                          multiline={true}
                          color="rgb(163, 163, 163)"
                          spread={4}
                          density={5}
                        />
                      </div>
                    </div>

                    {/* Stage 3 Content (Reveals on final scroll with Vaporize Text Effect) */}
                    <div
                      ref={stage3Ref}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 pointer-events-none"
                      style={{ opacity: 0 }}
                    >
                      <div className="mb-3 max-w-2xl">
                        <VapourTextEffect
                          ref={stage3HeadlineRef}
                          text={stage3Headline}
                          as="h3"
                          className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-2xl text-center"
                          multiline={true}
                          color="rgb(255, 255, 255)"
                          spread={4}
                          density={5}
                        />
                      </div>
                      <div className="mb-2 max-w-xl">
                        <VapourTextEffect
                          ref={stage3Bio1Ref}
                          text={stage3Bio1}
                          as="p"
                          className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-neutral-300 drop-shadow text-center"
                          multiline={true}
                          color="rgb(212, 212, 212)"
                          spread={4}
                          density={5}
                        />
                      </div>
                      <div className="max-w-xl">
                        <VapourTextEffect
                          ref={stage3Bio2Ref}
                          text={stage3Bio2}
                          as="p"
                          className="text-xs sm:text-sm uppercase tracking-widest font-extrabold drop-shadow text-center"
                          multiline={true}
                          color="rgb(239, 68, 68)"
                          spread={4}
                          density={5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM AREA: Footer Disciplines & Action Buttons (GET IN TOUCH & SERVICES) */}
                  <div
                    ref={bottomRailRef}
                    className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full"
                    style={{ opacity: 0 }}
                  >
                    {/* Left: Disciplines & Craft line */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-neutral-400">
                      <span className="font-bold text-neutral-300">
                        {disciplinesLabel}
                      </span>
                      <span className="text-neutral-500">—</span>
                      <span>{disciplines}</span>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={ctaLink}
                        className="pointer-events-auto px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-bold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-2"
                      >
                        <span>{ctaText}</span>
                        <svg
                          className="w-3.5 h-3.5 text-black"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                      {secondaryCtaText && (
                        <a
                          href={secondaryCtaLink}
                          className="pointer-events-auto px-5 py-2.5 rounded-full border border-neutral-500 hover:border-white text-white text-xs font-bold tracking-wider uppercase transition-all duration-200"
                        >
                          {secondaryCtaText}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Subtitles (Translate Outward on scroll) */}
              <div className="about-subtitles">
                <p ref={dateTagRef} id="sem-date">
                  {subtitle}
                </p>
                <p ref={scrollPromptRef} id="sem-scroll-prompt">
                  {scrollPrompt}
                </p>
              </div>
            </div>

            {/* Splitting Title Header (ABOUT translates left, ME translates right) */}
            <div className="about-title-container">
              <h2 ref={titleFirstRef} id="sem-title-first">
                {titleFirst}
              </h2>
              <h2 ref={titleRestRef} id="sem-title-rest">
                {titleRest}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
