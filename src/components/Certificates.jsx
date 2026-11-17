import { useEffect, useState, useRef, useCallback } from "react";
import { getCertificates } from "../lib/queries";
import { urlFor } from "../lib/sanity";
import "./Certificates.css";

// High-fidelity fallback certificates matching Abhishek's Black & Red Editorial Theme
export const DEFAULT_CERTIFICATES = [
  {
    id: "cert-aws-saa",
    title: "AWS Certified Solutions Architect",
    issuer: "Amazon Web Services",
    issueDate: "2025-08-15",
    credentialId: "AWS-SAA-83920184",
    credentialUrl: "https://aws.amazon.com/verification",
    image: "/certificates/cert-aws.svg",
    description:
      "Demonstrated comprehensive expertise in designing resilient, high-performance, cost-optimized, and secure cloud architectures on Amazon Web Services.",
    skills: ["AWS", "Cloud Architecture", "EC2 / S3 / RDS", "Serverless", "IAM Security", "VPC Networking"],
    order: 1,
    published: true,
  },
  {
    id: "cert-meta-fed",
    title: "Meta Front-End Developer Specialization",
    issuer: "Meta",
    issueDate: "2025-04-10",
    credentialId: "META-FED-994120",
    credentialUrl: "https://www.coursera.org/verify/professional-cert/meta-frontend",
    image: "/certificates/cert-meta.svg",
    description:
      "Mastery of modern client-side architecture, React 19 component lifecycle, state orchestration, responsive UI design systems, and Web performance profiling.",
    skills: ["React", "JavaScript (ESNext)", "CSS Architecture", "UI/UX Systems", "Testing & CI/CD", "Web Performance"],
    order: 2,
    published: true,
  },
  {
    id: "cert-gcp-ace",
    title: "Google Cloud Associate Cloud Engineer",
    issuer: "Google Cloud",
    issueDate: "2024-11-20",
    credentialId: "GCP-ACE-441890",
    credentialUrl: "https://cloud.google.com/certification",
    image: "/certificates/cert-gcp.svg",
    description:
      "Validated proficiency in deploying containerized microservices, configuring Google Kubernetes Engine (GKE), managing IAM policies, and cloud resource automation.",
    skills: ["Google Cloud Platform", "Kubernetes (GKE)", "Docker", "Cloud Run", "Terraform", "Cloud Monitoring"],
    order: 3,
    published: true,
  },
  {
    id: "cert-cs50x",
    title: "CS50: Computer Science & Systems",
    issuer: "Harvard University",
    issueDate: "2024-06-05",
    credentialId: "CS50X-2024-098214",
    credentialUrl: "https://cs50.harvard.edu/certificates",
    image: "/certificates/cert-cs50.svg",
    description:
      "Rigorous foundation in computer science fundamentals: algorithms, computational complexity, memory management in C, data structures, and relational databases.",
    skills: ["C", "Algorithms", "Data Structures", "Memory Management", "Python", "SQL & Database Design"],
    order: 4,
    published: true,
  },
  {
    id: "cert-psm-1",
    title: "Professional Scrum Master™ I (PSM I)",
    issuer: "Scrum.org",
    issueDate: "2024-02-18",
    credentialId: "PSM-I-772910",
    credentialUrl: "https://www.scrum.org/certificates",
    image: "/certificates/cert-scrum.svg",
    description:
      "Certified understanding of agile product delivery frameworks, Scrum mechanics, sprint velocity optimization, and cross-functional team leadership.",
    skills: ["Scrum", "Agile Leadership", "Sprint Planning", "Cross-Functional Collaboration", "Product Delivery"],
    order: 5,
    published: true,
  },
  {
    id: "cert-fullstack",
    title: "Full-Stack Web Development Architecture",
    issuer: "freeCodeCamp & Open Source Community",
    issueDate: "2023-10-30",
    credentialId: "FCC-FSW-551029",
    credentialUrl: "https://www.freecodecamp.org/certification",
    image: "/certificates/cert-fullstack.svg",
    description:
      "Comprehensive 1,800+ hour curriculum covering full-stack web applications, RESTful APIs, Node.js backend scalability, and database optimization.",
    skills: ["Node.js", "Express", "TypeScript", "PostgreSQL", "REST APIs", "Modern Web Architecture"],
    order: 6,
    published: true,
  },
];

// Mathematical & 3D Drum Constants from ECHO Reference
const CARD_RATIO = 1.45;
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius in card heights
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
const BOW = 1.82; // bow curve factor
const TITLE_SCALE = 0.115;
const INDEX_SCALE = 0.038;
const CULL = 1.6;

const WHEEL_UNITS = 850;
const DRAG_UNITS = 380;
const SETTLE_DELAY = 140;
const EASE_FACTOR = 0.12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = (deg) => (deg * Math.PI) / 180;
const bowAt = (drumDeg, bow) => -bow * (1 - Math.cos(rad(drumDeg)));

function calculatePlacement(ringDeg, drumDeg, ringR, drumR, bow, m) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

// Certificate Preview Modal Component
const CertificatePreviewModal = ({ cert, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!cert) return null;

  const handleCopyId = () => {
    if (cert.credentialId) {
      navigator.clipboard?.writeText(cert.credentialId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = cert.issueDate
    ? new Date(cert.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "Verified Credential";

  return (
    <div
      id="certificate-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-modal-title"
    >
      <div
        id="certificate-modal-card"
        className="cert-modal-animate bg-[#0e0e14] text-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 sm:p-8 md:p-9 shadow-2xl border border-[rgba(160,45,50,0.3)] relative"
      >
        {/* Header */}
        <div className="relative text-center pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ff2a2a] animate-pulse" />
            <span
              id="cert-modal-issuer"
              className="text-[11px] font-bold tracking-widest uppercase text-[#ff2a2a]"
            >
              {cert.issuer || "ACCREDITED CREDENTIAL"}
            </span>
          </div>
          <h3
            id="cert-modal-title"
            className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight px-8"
          >
            {cert.title}
          </h3>
          <button
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:border-[#ff2a2a] hover:text-[#ff2a2a] hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Close certificate modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-sm text-neutral-300">
          {/* Certificate Image Preview */}
          {cert.image && (
            <div className="w-full h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-[rgba(160,45,50,0.25)] bg-[#14141e] shadow-inner relative group">
              <img
                src={cert.image}
                alt={cert.title}
                className="w-full h-full object-contain p-2 select-none"
              />
            </div>
          )}

          {/* Details Bar: Issue Date & Credential ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff2a2a] mb-1 font-mono">
                Awarded / Issue Date
              </p>
              <p className="text-xs sm:text-sm text-white font-semibold">
                {formattedDate}
              </p>
            </div>

            {cert.credentialId ? (
              <div
                onClick={handleCopyId}
                className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 text-center cursor-pointer hover:border-[#ff2a2a]/40 transition-colors group relative"
                title="Click to copy credential ID"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff2a2a] mb-1 font-mono">
                  Credential ID {copied ? "✓ (COPIED)" : "(CLICK TO COPY)"}
                </p>
                <p className="text-xs sm:text-sm text-white font-mono font-medium truncate">
                  {cert.credentialId}
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff2a2a] mb-1 font-mono">
                  Status
                </p>
                <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
                  ✓ Verified &amp; Active
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {cert.description && (
            <p className="text-neutral-300 leading-relaxed font-normal text-sm sm:text-base text-center max-w-xl mx-auto">
              {cert.description}
            </p>
          )}

          {/* Skills / Technologies */}
          {cert.skills && cert.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 text-center font-mono">
                Validated Competencies &amp; Technologies
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {cert.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/[0.05] border border-white/10 text-neutral-200 hover:border-[#ff2a2a]/40 text-[11px] font-medium rounded-full uppercase transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Verification Link (Rendered ONLY if credentialUrl exists!) */}
          {cert.credentialUrl && (
            <div className="pt-2 flex justify-center items-center">
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#ff2a2a] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#e02424] transition-all shadow-lg shadow-[#ff2a2a]/25 hover:scale-105 active:scale-95 cursor-pointer font-mono"
              >
                View Credential ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Certificates Component
const Certificates = () => {
  const [certificates, setCertificates] = useState(DEFAULT_CERTIFICATES);
  const [selectedCert, setSelectedCert] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
  );

  // Wheel interaction and DOM refs
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const wheelRef = useRef(null);
  const cardRefs = useRef([]);
  const labelRef = useRef(null);
  const titleRef = useRef(null);

  // Physics animation values
  const turnRef = useRef(0);
  const targetRef = useRef(0);
  const activeRef = useRef(0);
  const stageMetricsRef = useRef({ w: 800, h: 600 });
  const animFrameRef = useRef(0);
  const settlingTimerRef = useRef(null);
  const dragDeltaRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);

  // Handle responsive media changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleChange = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch Certificates from Sanity CMS
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getCertificates()
      .then((docs) => {
        if (!isMounted) return;
        if (Array.isArray(docs) && docs.length > 0) {
          const mapped = docs.map((doc, idx) => {
            let imgSrc = "/certificates/cert-aws.svg";
            if (doc.certificateImage) {
              try {
                const built = urlFor(doc.certificateImage)
                  ?.width(1200)
                  ?.auto("format")
                  ?.quality(90)
                  ?.url();
                if (built) imgSrc = built;
              } catch (e) {
                console.warn("Failed to build certificate image url:", e);
              }
            } else if (DEFAULT_CERTIFICATES[idx % DEFAULT_CERTIFICATES.length]?.image) {
              imgSrc = DEFAULT_CERTIFICATES[idx % DEFAULT_CERTIFICATES.length].image;
            }

            return {
              id: doc._id || `cert-${idx}`,
              title: doc.title,
              issuer: doc.issuer || "Verified Issuer",
              issueDate: doc.issueDate,
              credentialId: doc.credentialId,
              credentialUrl: doc.credentialUrl,
              image: imgSrc,
              description: doc.description,
              skills: Array.isArray(doc.skills) ? doc.skills : [],
              order: typeof doc.order === "number" ? doc.order : idx + 1,
              published: doc.published !== false,
            };
          });

          // Sort by display order ascending
          mapped.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCertificates(mapped);
          setError(null);
        } else {
          // If no documents found in Sanity, preserve high-quality default editorial fallbacks
          setCertificates(DEFAULT_CERTIFICATES);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not load certificates from Sanity, using defaults:", err);
        setError("Could not load latest certificates from Sanity. Displaying offline archive.");
        setCertificates(DEFAULT_CERTIFICATES);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const count = certificates.length;
  const lastIndex = Math.max(count - 1, 0);

  // Steer target with boundary clamping
  const steerTo = useCallback(
    (next) => {
      targetRef.current = clamp(next, 0, lastIndex + 1);
    },
    [lastIndex]
  );

  const handlePrev = useCallback(() => {
    steerTo(Math.max(0, Math.round(targetRef.current) - 1));
  }, [steerTo]);

  const handleNext = useCallback(() => {
    steerTo(Math.min(lastIndex + 1, Math.round(targetRef.current) + 1));
  }, [steerTo, lastIndex]);

  // Compute 3D geometry metrics based on viewport dimensions
  const calculateMetrics = useCallback(() => {
    const w = stageMetricsRef.current.w || 800;
    const h = stageMetricsRef.current.h || 600;

    const isNarrow = w < 640;
    const isMedium = w >= 640 && w < 1024;

    const cardMaxWFactor = isNarrow ? 0.78 : isMedium ? 0.52 : 0.36;
    const cardHFactor = isNarrow ? 0.34 : isMedium ? 0.36 : 0.38;
    const ratio = isNarrow ? 1.4 : CARD_RATIO;

    const cardW = Math.min(h * cardHFactor * ratio, w * cardMaxWFactor);
    const cardH = cardW / ratio;
    const drumR = cardH * (isNarrow ? 2.05 : DRUM);
    const ringR = cardH * (isNarrow ? 0.95 : RING_R);
    const bow = cardH * (isNarrow ? 0.6 : BOW);

    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;

    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow,
      depth: cardH * (isNarrow ? 2.2 : LENS),
      title: Math.max(isNarrow ? 18 : 24, cardH * TITLE_SCALE),
      index: Math.max(10, cardH * INDEX_SCALE),
    };
  }, [count]);

  // Main 3D Drum & Ring Render Loop
  useEffect(() => {
    const stageEl = stageRef.current;
    const wheelEl = wheelRef.current;
    if (!stageEl || !wheelEl || count === 0) return;

    let isRunning = true;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Apply geometric sizing
    const applyMetrics = () => {
      const metrics = calculateMetrics();
      stageEl.style.perspective = `${metrics.depth}px`;

      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.width = `${metrics.cardW}px`;
        card.style.height = `${metrics.cardH}px`;
        card.style.marginLeft = `${-metrics.cardW / 2}px`;
        card.style.marginTop = `${-metrics.cardH / 2}px`;
      });

      if (labelRef.current) {
        labelRef.current.style.fontSize = `${metrics.title}px`;
      }
      if (titleRef.current) {
        titleRef.current.style.fontSize = `${metrics.title * 0.85}px`;
      }
    };

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      stageMetricsRef.current = {
        w: stageEl.clientWidth || 800,
        h: stageEl.clientHeight || 600,
      };
      applyMetrics();
    });
    ro.observe(stageEl);
    applyMetrics();

    // Wheel Scroll Event
    const onWheel = (e) => {
      const delta = e.deltaY;
      const next = targetRef.current + delta / WHEEL_UNITS;
      if (next > 0 && next < lastIndex + 1) {
        e.preventDefault();
      }
      steerTo(next);
      clearTimeout(settlingTimerRef.current);
      settlingTimerRef.current = setTimeout(() => {
        steerTo(Math.round(targetRef.current));
      }, SETTLE_DELAY);
    };
    stageEl.addEventListener("wheel", onWheel, { passive: false });

    // Pointer Drag Events (mouse + touch)
    const onPointerDown = (e) => {
      isPointerDownRef.current = true;
      dragStartYRef.current = e.clientY;
      dragStartXRef.current = e.clientX;
      dragDeltaRef.current = 0;
      try {
        stageEl.setPointerCapture(e.pointerId);
      } catch (_) {}
    };

    const onPointerMove = (e) => {
      if (!isPointerDownRef.current) return;
      const diffY = dragStartYRef.current - e.clientY;
      const diffX = dragStartXRef.current - e.clientX;
      const diff = Math.abs(diffY) >= Math.abs(diffX) ? diffY : diffX;
      dragDeltaRef.current += Math.abs(diff);
      steerTo(targetRef.current + diff / DRAG_UNITS);
      dragStartYRef.current = e.clientY;
      dragStartXRef.current = e.clientX;
    };

    const onPointerUp = (e) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      try {
        stageEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (targetRef.current > 0.4) {
        steerTo(Math.round(targetRef.current));
      }
    };

    stageEl.addEventListener("pointerdown", onPointerDown);
    stageEl.addEventListener("pointermove", onPointerMove);
    stageEl.addEventListener("pointerup", onPointerUp);
    stageEl.addEventListener("pointercancel", onPointerUp);

    // Keyboard Arrow Navigation
    const onKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        steerTo(Math.round(targetRef.current) + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        steerTo(Math.round(targetRef.current) - 1);
      }
    };
    stageEl.addEventListener("keydown", onKeyDown);

    // 60fps rAF Animation Engine
    const draw = () => {
      if (!isRunning) return;
      animFrameRef.current = requestAnimationFrame(draw);

      const gap = targetRef.current - turnRef.current;
      if (Math.abs(gap) < 0.0005) {
        turnRef.current = targetRef.current;
      } else {
        turnRef.current += gap * (reducedMotion ? 1 : EASE_FACTOR);
      }

      const t = turnRef.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      const metrics = calculateMetrics();
      const { ringR, ringScale, drumR, bow } = metrics;

      if (wheelEl) {
        wheelEl.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const ringDeg = d * (360 / count);
        const card = cardRefs.current[i];

        if (card) {
          card.style.transform = calculatePlacement(
            ringDeg,
            drumDeg,
            ringR,
            drumR,
            bow,
            m
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }

        const face = card ? card.firstElementChild : null;
        if (face) {
          face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
        }
      }

      if (labelRef.current) {
        labelRef.current.style.opacity = String(1 - m);
        labelRef.current.style.pointerEvents = m > 0.2 ? "none" : "auto";
      }
      if (titleRef.current) {
        titleRef.current.style.opacity = String(m);
      }

      const near = clamp(Math.round(pos), 0, lastIndex);
      if (near !== activeRef.current) {
        activeRef.current = near;
        setActiveIndex(near);
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      stageEl.removeEventListener("wheel", onWheel);
      stageEl.removeEventListener("pointerdown", onPointerDown);
      stageEl.removeEventListener("pointermove", onPointerMove);
      stageEl.removeEventListener("pointerup", onPointerUp);
      stageEl.removeEventListener("pointercancel", onPointerUp);
      stageEl.removeEventListener("keydown", onKeyDown);
      clearTimeout(settlingTimerRef.current);
    };
  }, [count, lastIndex, steerTo, calculateMetrics]);

  // Card click handler
  const handleCardClick = (index, cert) => {
    // Ignore click if it was a drag operation
    if (dragDeltaRef.current > 8) return;

    if (turnRef.current >= 0.5 && activeRef.current === index) {
      setSelectedCert(cert);
    } else {
      steerTo(index + 1);
    }
  };

  const activeCert = certificates[activeIndex] || certificates[0];

  return (
    <section
      className="relative w-full bg-[#070709] text-white py-24 px-6 md:px-14 border-t border-white/[0.06] overflow-hidden"
      data-purpose="certificates-section"
      id="certificates"
      aria-label="Accreditations and Certificates"
    >
      {/* Dark Red Atmospheric Background */}
      <div className="certificates-ambient-backdrop" aria-hidden="true">
        <div className="certificates-glow-red-top" />
        <div className="certificates-glow-red-bottom" />
        <div className="certificates-glow-charcoal" />
        <div className="certificates-film-grain" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Editorial Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ff2a2a] animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#ff2a2a]">
                Verified Credentials &amp; Standards
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-none">
              HONORS &amp; <span className="text-[#ff2a2a]">CERTIFICATES</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm uppercase font-medium leading-relaxed tracking-wider text-neutral-400 max-w-md">
            Validated technical proficiencies across cloud architecture, modern client-side engineering, and distributed systems.
          </p>
        </div>

        {/* 3D Wheel Drum Container or Empty State */}
        {count > 0 ? (
          <div
            ref={containerRef}
            className="rounded-3xl border border-[rgba(160,45,50,0.22)] overflow-hidden shadow-2xl relative bg-[#09090e]/95 backdrop-blur-xl transition-colors duration-500 hover:border-[rgba(255,42,42,0.35)]"
            style={{
              width: "100%",
              height: isMobile ? "540px" : "640px",
              minHeight: "500px",
              position: "relative",
            }}
          >
          {/* Stage Element (Perspective & Events) */}
          <div
            ref={stageRef}
            tabIndex={0}
            role="listbox"
            aria-label="Certificates 3D Wheel"
            className="certificates-stage absolute inset-0 cursor-grab outline-none focus-visible:outline-2 focus-visible:outline-[#ff2a2a] focus-visible:-outline-offset-4 active:cursor-grabbing"
          >
            {/* 3D Wheel Container */}
            <div
              ref={wheelRef}
              className="certificates-wheel"
            >
              {certificates.map((cert, i) => (
                <div
                  key={cert.id || i}
                  ref={(el) => (cardRefs.current[i] = el)}
                  id={`cert-wheel-card-${i}`}
                  role="option"
                  aria-selected={i === activeIndex ? "true" : "false"}
                  className="certificate-card-wrapper group"
                  onClick={() => handleCardClick(i, cert)}
                >
                  <div className="certificate-card-face">
                    {/* Certificate Preview Image */}
                    <img
                      src={cert.image}
                      alt={cert.title}
                      draggable={false}
                      loading="eager"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />

                    {/* Gradient Overlay for Editorial Contrast */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Top Issuer Tag */}
                    <div className="pointer-events-none absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a2a]" />
                      <span className="text-[10px] font-mono tracking-wider text-neutral-300 font-semibold uppercase truncate max-w-[180px]">
                        {cert.issuer}
                      </span>
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="pointer-events-none absolute left-3.5 bottom-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                      <span className="text-[11px] md:text-xs font-mono tracking-wider text-white drop-shadow font-bold truncate max-w-[65%]">
                        {cert.title}
                      </span>
                      <span className="bg-[#ff2a2a] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow flex items-center gap-1 group-hover:scale-105 transition-transform font-mono shrink-0">
                        View ↗
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Ring Label (Visible when turn == 0) */}
          <div
            ref={labelRef}
            onClick={() => steerTo(1)}
            title="Click to enter 3D Drum"
            className="cursor-pointer absolute inset-0 grid place-items-center tracking-tight font-black uppercase text-center select-none z-10 transition-opacity duration-300"
          >
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-[#ff2a2a] mb-2 font-bold">
                Portfolio Index
              </span>
              <span className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight text-white/95 drop-shadow-[0_4px_30px_rgba(255,42,42,0.25)]">
                CERTIFICATES &apos;26
              </span>
              <span className="text-[11px] font-mono tracking-widest text-neutral-400 mt-2 font-semibold flex items-center gap-2">
                <span>SCROLL OR DRAG TO ROTATE</span>
                <span className="text-[#ff2a2a]">↓</span>
              </span>
            </div>
          </div>

          {/* Top-Left Active Certificate Title (Visible when turn >= 1) */}
          <div
            ref={titleRef}
            className="pointer-events-none absolute top-6 left-6 md:top-8 md:left-8 tracking-tight font-black uppercase text-white opacity-0 select-none z-10 max-w-[55%] sm:max-w-[45%] leading-[1.05]"
          >
            <span className="block text-[10px] md:text-[11px] font-mono tracking-widest uppercase text-[#ff2a2a] mb-1 font-bold truncate">
              {activeCert?.issuer}
            </span>
            <h3 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight line-clamp-2 drop-shadow">
              {activeCert?.title}
            </h3>
          </div>

          {/* Side Index List (Desktop & Tablet) */}
          {!isMobile && (
            <ol className="text-neutral-500 absolute top-8 right-6 text-right leading-[1.7] z-20 space-y-1 select-none font-mono">
              <li className="pb-1 mb-1 border-b border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => steerTo(0)}
                  className={`cursor-pointer transition-all duration-200 text-[10px] md:text-[11px] tracking-wider outline-none block ml-auto ${
                    turnRef.current < 0.5
                      ? "text-[#ff2a2a] font-bold"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  ⟲ RING OVERVIEW
                </button>
              </li>
              {certificates.map((cert, i) => (
                <li key={cert.id || i}>
                  <button
                    type="button"
                    onClick={() => steerTo(i + 1)}
                    className={`cursor-pointer transition-all duration-200 text-[11px] md:text-xs tracking-wider outline-none block ml-auto ${
                      i === activeIndex && turnRef.current >= 0.5
                        ? "text-[#ff2a2a] font-bold scale-105 underline decoration-2 underline-offset-4 decoration-[#ff2a2a]"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="text-[#ff2a2a]/60 mr-1.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {cert.title}
                  </button>
                </li>
              ))}
            </ol>
          )}

          {/* Mobile Counter Badge */}
          {isMobile && (
            <div className="absolute top-5 right-5 z-20 px-3 py-1 rounded-full bg-black/80 border border-white/10 text-white font-mono text-[11px] font-bold tracking-wider">
              <span className="text-[#ff2a2a]">{String(activeIndex + 1).padStart(2, "0")}</span>
              <span className="text-neutral-500"> / </span>
              <span>{String(count).padStart(2, "0")}</span>
            </div>
          )}

          {/* Navigation Controls & Hint Pill (Bottom) */}
          <div className="pointer-events-none absolute bottom-5 inset-x-5 flex items-center justify-between z-20">
            {/* Quick Prev / Next / Ring Buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#121218]/90 border border-white/10 text-white flex items-center justify-center hover:border-[#ff2a2a] hover:text-[#ff2a2a] transition-all cursor-pointer backdrop-blur-md active:scale-95"
                aria-label="Previous certificate"
                title="Previous certificate"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#121218]/90 border border-white/10 text-white flex items-center justify-center hover:border-[#ff2a2a] hover:text-[#ff2a2a] transition-all cursor-pointer backdrop-blur-md active:scale-95"
                aria-label="Next certificate"
                title="Next certificate"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => steerTo(0)}
                className="px-2.5 h-8 md:h-9 rounded-full bg-[#121218]/90 border border-white/10 text-neutral-300 text-[10px] font-mono flex items-center gap-1 hover:border-[#ff2a2a] hover:text-[#ff2a2a] transition-all cursor-pointer backdrop-blur-md active:scale-95"
                aria-label="Circular Ring Overview"
                title="Circular Ring Overview"
              >
                <span>⟲</span>
                <span className="hidden sm:inline">RING</span>
              </button>
            </div>

            {/* Bottom Helper Hint Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d0d14]/90 border border-white/10 backdrop-blur-md text-[10px] md:text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a2a] animate-ping" />
              <span>Scroll or drag drum to cycle</span>
            </div>

            {/* Counter (Desktop) */}
            {!isMobile && (
              <div className="font-mono text-xs text-neutral-400 tracking-wider">
                <span className="text-white font-bold">{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="text-[#ff2a2a] mx-1">/</span>
                <span>{String(count).padStart(2, "0")}</span>
              </div>
            )}
          </div>
        </div>
        ) : (
          !loading && (
            <div className="w-full py-24 text-center border border-white/10 rounded-3xl bg-[#09090e]/80">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 flex items-center justify-center text-[#ff2a2a]">
                <span className="text-2xl">📜</span>
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2 font-mono">
                No Certificates Published
              </h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Certificates added and published in Sanity Studio will appear in this 3D wheel automatically.
              </p>
            </div>
          )
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-neutral-500 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#ff2a2a] animate-pulse" />
            <span>Connecting to Sanity CMS...</span>
          </div>
        )}

        {/* Optional Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/20 border border-[#ff2a2a]/30 text-center text-xs font-mono text-neutral-400">
            {error}
          </div>
        )}
      </div>

      {/* Certificate Details Modal */}
      {selectedCert && (
        <CertificatePreviewModal
          cert={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </section>
  );
};

export default Certificates;
