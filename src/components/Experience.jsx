import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getExperience } from "../lib/queries";
import { urlFor } from "../lib/sanity";
import "./Experience.css";

gsap.registerPlugin(ScrollTrigger);

// Original ECHO Experience content fallback
const DEFAULT_EXPERIENCE_INTRO = {
  eyebrow: "FOUNDATION & JOURNEY",
  heading: "WHERE\nI'VE BEEN",
  body: "My professional journey through different roles and environments.",
  tickerTop:
    "CREATIVE TECHNOLOGIST \u00A0\u00A0 FULL STACK ARCHITECTURE \u00A0\u00A0 CREATIVE TECHNOLOGIST \u00A0\u00A0 FULL STACK ARCHITECTURE \u00A0\u00A0",
  tickerBottom:
    "2023 \u00A0\u00A0 SELF-DIRECTED LEARNING \u00A0\u00A0 2026 \u00A0\u00A0 BUILDING SYSTEMS \u00A0\u00A0 2023 \u00A0\u00A0 SELF-DIRECTED LEARNING \u00A0\u00A0",
  phaseOrigin: "ORIGIN & FOUNDATIONS",
  phaseLearning: "SELF-DIRECTED LEARNING",
  phaseBUILDING: "BUILDING / INDEPENDENT",
  jumpLearningLabel: "LEARNING",
  jumpBUILDINGLabel: "BUILDING",
  jumpLearningProgress: 0.3,
  jumpBUILDINGProgress: 0.75,
};

const DEFAULT_EXPERIENCE_CHAPTERS = [
  {
    _id: "default-chapter-1",
    dateLabel: "2023 — 2024",
    eyebrow: "SELF-DIRECTED LEARNING",
    heading: "CREATIVE\nPRODUCTION",
    body: "Started as a BUILDING video editor, exploring creative projects, visual storytelling, and editing technologies through hands-on experience and self-learning.",
    backgroundDate: "2023 — 2024",
    parallaxFactor: 0.15,
    milestones: [
      {
        label: "MILESTONE 01",
        text: "Worked as a BUILDING video editor on creative projects.",
      },
      {
        label: "MILESTONE 02",
        text: "Worked with CapCut, Alight Motion and After Effects for video editing, motion graphics and visual effects.",
      },
      {
        label: "MILESTONE 03",
        text: "Explored creative tools, digital workflows and emerging technologies.",
      },
    ],
  },
  {
    _id: "default-chapter-2",
    dateLabel: "2024 — ONGOING",
    eyebrow: "ACADEMIC JOURNEY",
    heading: "WEB \nDEVELOPMENT",
    body: "Joined Graphic Era Hill University for a BCA, while exploring programming and web development and building a foundation in frontend and backend technologies.",
    backgroundDate: "2024 — ONGOING",
    parallaxFactor: 0.15,
    milestones: [
      {
        label: "MILESTONE 01",
        text: "Started the BCA journey at Graphic Era Hill University.",
      },
      {
        label: "MILESTONE 02",
        text: "Explored programming and web development concepts.",
      },
      {
        label: "MILESTONE 03",
        text: "Built a foundation in frontend and backend technologies.",
      },
    ],
  },
  {
    _id: "default-chapter-3",
    dateLabel: "2026 — PRESENT",
    eyebrow: "BUILDING & CREATING",
    heading: "TURNING IDEAS\nINTO PROJECTS",
    body: "Applying my technical skills through college and personal projects, building practical full-stack applications and exploring new technologies.",
    backgroundDate: "2026 — PRESENT",
    parallaxFactor: 0.15,
    milestones: [
      {
        label: "MILESTONE 01",
        text: "Building real-world applications as part of academic projects.",
      },
      {
        label: "MILESTONE 02",
        text: "Turning ideas into functional web experiences.",
      },
      {
        label: "MILESTONE 03",
        text: "Working with React, Node.js, MongoDB and modern web technologies.",
      },
    ],
  },
];

const Experience = () => {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const tickerTopRef = useRef(null);
  const tickerBottomRef = useRef(null);
  const hudProgressRef = useRef(null);
  const hudPhaseRef = useRef(null);
  const dateBgRefs = useRef([]);
  const jumpLearningRef = useRef(null);
  const jumpBUILDINGRef = useRef(null);
  const triggerRef = useRef(null);

  const [sanityIntro, setSanityIntro] = useState(null);
  const [sanityChapters, setSanityChapters] = useState(null);

  // Fetch Sanity Experience Data
  useEffect(() => {
    let isMounted = true;

    getExperience()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const introDoc = data.find((doc) => doc.panelKind === "intro");
          const chapterDocs = data.filter((doc) => doc.panelKind === "chapter");

          if (introDoc) {
            setSanityIntro(introDoc);
          }
          if (chapterDocs.length > 0) {
            setSanityChapters(chapterDocs);
          }
        }
      })
      .catch((err) => {
        console.warn(
          "Could not load experience from Sanity, using default fallback:",
          err,
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const intro = sanityIntro || DEFAULT_EXPERIENCE_INTRO;
  const chapters = sanityChapters || DEFAULT_EXPERIENCE_CHAPTERS;

  const phaseOrigin = intro.phaseOrigin || DEFAULT_EXPERIENCE_INTRO.phaseOrigin;
  const phaseLearning =
    intro.phaseLearning || DEFAULT_EXPERIENCE_INTRO.phaseLearning;
  const phaseBUILDING =
    intro.phaseBUILDING || DEFAULT_EXPERIENCE_INTRO.phaseBUILDING;
  const jumpLearningLabel =
    intro.jumpLearningLabel || DEFAULT_EXPERIENCE_INTRO.jumpLearningLabel;
  const jumpBUILDINGLabel =
    intro.jumpBUILDINGLabel || DEFAULT_EXPERIENCE_INTRO.jumpBUILDINGLabel;
  const jumpLearningTarget =
    typeof intro.jumpLearningProgress === "number"
      ? intro.jumpLearningProgress
      : DEFAULT_EXPERIENCE_INTRO.jumpLearningProgress;
  const jumpBUILDINGTarget =
    typeof intro.jumpBUILDINGProgress === "number"
      ? intro.jumpBUILDINGProgress
      : DEFAULT_EXPERIENCE_INTRO.jumpBUILDINGProgress;

  // Frame application (controlled smoothly by ScrollTrigger scrub)
  const applyFrame = useCallback(
    (progress, maxTranslate) => {
      const p = Math.min(Math.max(progress, 0), 1);
      const curX = -p * maxTranslate;

      // 1. Move Horizontal Camera / Stage
      if (stageRef.current) {
        stageRef.current.style.transform = `translate3d(${curX.toFixed(2)}px, 0, 0)`;
      }

      // 2. Parallax Drift for Large Background Typography Dates
      if (dateBgRefs.current) {
        dateBgRefs.current.forEach((dateEl) => {
          if (!dateEl) return;
          const factor = parseFloat(
            dateEl.getAttribute("data-parallax-factor") || "0.15",
          );
          const dateOffset = -curX * factor;
          dateEl.style.transform = `translate3d(${dateOffset.toFixed(2)}px, 0, 0)`;
        });
      }

      // 3. Counter-drifting Background Tickers
      if (tickerTopRef.current) {
        const topOffset = curX * 0.35;
        tickerTopRef.current.style.transform = `translate3d(${topOffset.toFixed(2)}px, 0, 0)`;
      }
      if (tickerBottomRef.current) {
        const bottomOffset = -curX * 0.25;
        tickerBottomRef.current.style.transform = `translate3d(${bottomOffset.toFixed(2)}px, 0, 0)`;
      }

      // 4. Update HUD Progress Bar
      if (hudProgressRef.current) {
        hudProgressRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      }

      // 5. Update HUD Phase Title
      if (hudPhaseRef.current) {
        if (p < 0.3) {
          hudPhaseRef.current.textContent = phaseOrigin;
        } else if (p < 0.65) {
          hudPhaseRef.current.textContent = phaseLearning;
        } else {
          hudPhaseRef.current.textContent = phaseBUILDING;
        }
      }

      // 6. Highlight active bottom jump button
      if (jumpLearningRef.current && jumpBUILDINGRef.current) {
        const isLearning = Math.abs(p - jumpLearningTarget) < 0.2;
        const isBUILDING = Math.abs(p - jumpBUILDINGTarget) < 0.2;

        if (isLearning) {
          jumpLearningRef.current.classList.add(
            "text-white",
            "bg-white/20",
            "border-white/40",
          );
          jumpLearningRef.current.classList.remove(
            "text-neutral-500",
            "border-white/5",
          );
        } else {
          jumpLearningRef.current.classList.remove(
            "text-white",
            "bg-white/20",
            "border-white/40",
          );
          jumpLearningRef.current.classList.add(
            "text-neutral-500",
            "border-white/5",
          );
        }

        if (isBUILDING) {
          jumpBUILDINGRef.current.classList.add(
            "text-white",
            "bg-white/20",
            "border-white/40",
          );
          jumpBUILDINGRef.current.classList.remove(
            "text-neutral-500",
            "border-white/5",
          );
        } else {
          jumpBUILDINGRef.current.classList.remove(
            "text-white",
            "bg-white/20",
            "border-white/40",
          );
          jumpBUILDINGRef.current.classList.add(
            "text-neutral-500",
            "border-white/5",
          );
        }
      }
    },
    [
      phaseOrigin,
      phaseLearning,
      phaseBUILDING,
      jumpLearningTarget,
      jumpBUILDINGTarget,
    ],
  );

  // Jump to specific progress target with ScrollTrigger coordinates
  const handleJump = useCallback((targetP) => {
    const trigger = triggerRef.current;
    if (trigger) {
      const targetScroll =
        trigger.start + targetP * (trigger.end - trigger.start);
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    } else if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const totalDist = sectionRef.current.offsetHeight - window.innerHeight;
      const targetScroll = sectionTop + targetP * totalDist;
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, []);

  // GSAP ScrollTrigger Integration
  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        stage.style.transform = "none";
        return;
      }

      const calcMaxTranslate = () =>
        Math.max(0, stage.scrollWidth - window.innerWidth);

      let maxTranslate = calcMaxTranslate();

      // Match vertical scroll distance to exact horizontal travel.
      const updateTrackHeight = () => {
        maxTranslate = calcMaxTranslate();
        section.style.height = `${window.innerHeight + maxTranslate}px`;
      };

      updateTrackHeight();

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = Math.min(Math.max(self.progress, 0), 1);
          applyFrame(p, maxTranslate);
        },
        onRefresh: (self) => {
          maxTranslate = calcMaxTranslate();
          const p = Math.min(Math.max(self.progress, 0), 1);
          applyFrame(p, maxTranslate);
        },
      });

      triggerRef.current = trigger;
      applyFrame(trigger.progress || 0, maxTranslate);

      const handleResize = () => {
        const previousProgress = trigger.progress || 0;
        updateTrackHeight();
        ScrollTrigger.refresh();
        applyFrame(previousProgress, maxTranslate);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(stage);

      window.addEventListener("resize", handleResize, { passive: true });
      window.addEventListener("orientationchange", handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
        trigger.kill();
        triggerRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [chapters, intro, applyFrame],
    },
  );

  // Refresh ScrollTrigger once fonts load or after layout settles
  useEffect(() => {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#070709] text-white overflow-visible"
      data-purpose="experience-section"
      id="experience"
      style={{ height: "280vh" }}
    >
      {/* Sticky 100vh Theater / Viewport Window */}
      <div
        id="exp-sticky-viewport"
        className="sticky top-0 w-full h-[100dvh] overflow-hidden bg-[#070709] flex flex-col justify-between select-none"
      >
        {/* Layer 0: Background Cinematic Ambience & Atmospheric Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Layer 0B: Massive Ambient Horizontal Running Tickers (Layered Depth) */}
        <div className="absolute inset-0 flex flex-col justify-around pointer-events-none overflow-hidden opacity-[0.035]">
          {/* Upper Ticker (Drifting Left) */}
          <div
            ref={tickerTopRef}
            id="exp-ticker-top"
            className="exp-ticker whitespace-nowrap font-black uppercase text-[14vw] tracking-tighter will-change-transform leading-none"
          >
            {intro.tickerTop || DEFAULT_EXPERIENCE_INTRO.tickerTop}
          </div>
          {/* Lower Ticker (Drifting Right) */}
          <div
            ref={tickerBottomRef}
            id="exp-ticker-bottom"
            className="exp-ticker whitespace-nowrap font-black uppercase text-[14vw] tracking-tighter will-change-transform leading-none"
          >
            {intro.tickerBottom || DEFAULT_EXPERIENCE_INTRO.tickerBottom}
          </div>
        </div>

        {/* Top Minimalist Editorial HUD Bar */}
        <header className="relative z-30 w-full px-6 md:px-14 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-md bg-[#070709]/80">
          <div className="flex items-center gap-4">
            <span
              ref={hudPhaseRef}
              id="exp-hud-phase"
              className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400"
            >
              {phaseLearning}
            </span>
          </div>

          {/* Progress Tracker Bar (Top Hairline) */}
          <div className="flex items-center gap-3">
            <div className="w-24 sm:w-36 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                ref={hudProgressRef}
                id="exp-hud-progress"
                className="h-full bg-white transition-all duration-75 w-0"
              />
            </div>
          </div>
        </header>

        {/* Center: Massive Horizontal Spatial Canvas (Controlled by Vertical Scroll) */}
        <div className="relative z-20 flex-1 w-full overflow-hidden flex items-center">
          <div
            ref={stageRef}
            id="exp-horizontal-stage"
            className="flex items-center h-full will-change-transform transition-none"
            style={{ width: "max-content", minWidth: "290vw" }}
          >
            {/* ================= INTRO ENVIRONMENT (0vw - 90vw) ================= */}
            <div className="exp-panel flex-shrink-0 w-[95vw] md:w-[85vw] px-8 md:px-16 lg:px-24 flex flex-col justify-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/[0.04] text-[10px] font-semibold tracking-widest uppercase text-neutral-300 mb-6">
                  <span>
                    {intro.eyebrow || DEFAULT_EXPERIENCE_INTRO.eyebrow}
                  </span>
                </div>
                <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-white leading-[0.88] mb-8 whitespace-pre-line">
                  {intro.heading || DEFAULT_EXPERIENCE_INTRO.heading}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed max-w-xl font-normal">
                  {intro.body || DEFAULT_EXPERIENCE_INTRO.body}
                </p>
              </div>
            </div>

            {/* ================= CHAPTER PANELS ================= */}
            {chapters.map((chapter, index) => {
              const bgDate = chapter.backgroundDate || chapter.dateLabel || "";
              const factor = chapter.parallaxFactor ?? 0.15;
              const imageUrl = chapter.image
                ? urlFor(chapter.image)?.width(800)?.auto("format")?.url()
                : null;

              return (
                <div
                  key={chapter._id || index}
                  className="exp-panel relative flex-shrink-0 w-[105vw] md:w-[100vw] px-8 md:px-16 lg:px-24 flex flex-col justify-center"
                >
                  {/* Background Parallax Date Typography */}
                  {bgDate && (
                    <div
                      ref={(el) => (dateBgRefs.current[index] = el)}
                      className="exp-date-bg absolute -top-8 right-12 md:right-28 text-[12vw] md:text-[14vw] font-black uppercase text-white/[0.04] tracking-tighter select-none pointer-events-none will-change-transform"
                      data-parallax-factor={factor}
                    >
                      {bgDate}
                    </div>
                  )}

                  <div className="relative z-10 max-w-4xl">
                    {/* Eyebrow & Date */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      {chapter.dateLabel && (
                        <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
                          {chapter.dateLabel}
                        </span>
                      )}
                      {chapter.dateLabel && chapter.eyebrow && (
                        <span className="h-[1px] w-12 bg-white/20" />
                      )}
                      {chapter.eyebrow && (
                        <span className="text-xs font-bold tracking-widest uppercase text-white">
                          {chapter.eyebrow}
                        </span>
                      )}
                      {chapter.badge && (
                        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/20 text-[10px] font-semibold uppercase text-neutral-300">
                          {chapter.badge}
                        </span>
                      )}
                    </div>

                    {/* Oversized Typographic Role Title */}
                    <h3 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.92] mb-6 whitespace-pre-line">
                      {chapter.heading}
                    </h3>

                    {/* Optional Image */}
                    {imageUrl && (
                      <div className="mb-6">
                        <img
                          src={imageUrl}
                          alt={chapter.heading || "Experience preview"}
                          className="exp-chapter-image"
                        />
                      </div>
                    )}

                    {/* Narrative Summary */}
                    {chapter.body && (
                      <p className="text-sm sm:text-base md:text-lg text-neutral-300 leading-relaxed max-w-2xl mb-8">
                        {chapter.body}
                      </p>
                    )}

                    {/* Milestone Specifications (Hairline Grid) */}
                    {chapter.milestones && chapter.milestones.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-3xl mb-8">
                        {chapter.milestones.map((milestone, mIdx) => (
                          <div key={mIdx}>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                              {milestone.label}
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-200 font-medium leading-snug">
                              {milestone.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Minimalist Editorial Navigation & Spatial Status Bar */}
        <footer className="relative z-30 w-full px-6 md:px-14 py-4 flex items-center justify-between border-t border-white/[0.08] backdrop-blur-md bg-[#070709]/80">
          {/* Interactive Navigation Markers */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              ref={jumpLearningRef}
              type="button"
              onClick={() => handleJump(jumpLearningTarget)}
              className="exp-jump-btn text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-md border border-white/20 text-white bg-white/10 transition-all hover:bg-white/20 cursor-pointer"
              data-target-progress={jumpLearningTarget}
            >
              {jumpLearningLabel}
            </button>
            <button
              ref={jumpBUILDINGRef}
              type="button"
              onClick={() => handleJump(jumpBUILDINGTarget)}
              className="exp-jump-btn text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-md border border-white/5 text-neutral-500 hover:text-white transition-all hover:border-white/20 cursor-pointer"
              data-target-progress={jumpBUILDINGTarget}
            >
              {jumpBUILDINGLabel}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default Experience;
