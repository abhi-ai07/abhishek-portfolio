import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";

/**
 * calculateVaporizeSpread from 21st.dev
 */
const calculateVaporizeSpread = (fontSize) => {
  const size = typeof fontSize === "string" ? parseInt(fontSize, 10) : fontSize;
  const points = [
    { size: 20, spread: 0.2 },
    { size: 50, spread: 0.5 },
    { size: 100, spread: 1.5 },
  ];

  if (size <= points[0].size) return points[0].spread;
  if (size >= points[points.length - 1].size)
    return points[points.length - 1].spread;

  let i = 0;
  while (i < points.length - 1 && points[i + 1].size < size) i++;
  const p1 = points[i];
  const p2 = points[i + 1];

  return (
    p1.spread +
    ((size - p1.size) * (p2.spread - p1.spread)) / (p2.size - p1.size)
  );
};

/**
 * Parses color string into rgba
 */
const parseColor = (color) => {
  if (!color) return "rgba(255, 255, 255, 1)";
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);

  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${rgbaMatch[4]})`;
  } else if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 1)`;
  } else if (color.startsWith("#")) {
    let hex = color.replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const num = parseInt(hex, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, 1)`;
  }
  return "rgba(255, 255, 255, 1)";
};

/**
 * VapourTextEffect (21st.dev implementation with smooth, slow, scroll-synchronized physics)
 *
 * - Assembles gradually from particles when scrolling down
 * - Locks into clean, solid, sharp text once assembled
 * - Smoothly dissolves into particles when scrolling up (or further down)
 * - Zero sudden pops or jumps: continuous easing for every particle
 */
const VapourTextEffect = forwardRef(
  (
    {
      text,
      className = "",
      style = {},
      color = "rgb(255, 255, 255)",
      spread = 5,
      density = 5,
      direction = "left-to-right",
      as: Tag = "span",
      multiline = false,
      ariaLabel,
    },
    ref,
  ) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const textBoundariesRef = useRef({ left: 0, right: 0, width: 0 });
    const assembleProgressRef = useRef(0);
    const dissolveProgressRef = useRef(0);
    const boundsRef = useRef({ width: 0, height: 0, pad: 0 });

    // Normalize text into segments: [{ text, color }]
    const segments = useMemo(() => {
      if (Array.isArray(text)) {
        return text.map((s) => ({
          text: String(s.text || ""),
          color: parseColor(s.color || color),
        }));
      }
      return [{ text: String(text || ""), color: parseColor(color) }];
    }, [text, color]);

    const plainText = useMemo(() => {
      return ariaLabel || segments.map((s) => s.text).join("");
    }, [ariaLabel, segments]);

    // Canvas draw method for scroll progression with smooth, slow deceleration
    const draw = useCallback(
      (assembleProg, dissolveProg = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const aProg = Math.max(0, Math.min(1, assembleProg));
        const dProg = Math.max(0, Math.min(1, dissolveProg));

        assembleProgressRef.current = aProg;
        dissolveProgressRef.current = dProg;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // State 1: Completely unrevealed
        if (aProg <= 0.02) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (textRef.current) {
            textRef.current.style.opacity = "0";
            textRef.current.style.visibility = "hidden";
          }
          return;
        }

        // State 2: Completely assembled and solid (aProg >= 0.98, dProg <= 0.02)
        // Clear canvas completely so only ONE single DOM text layer is rendered!
        if (aProg >= 0.98 && dProg <= 0.02) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (textRef.current) {
            textRef.current.style.opacity = "1";
            textRef.current.style.visibility = "visible";
          }
          return;
        }

        // State 3: Fully dissolved
        if (dProg >= 0.98) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (textRef.current) {
            textRef.current.style.opacity = "0";
            textRef.current.style.visibility = "hidden";
          }
          return;
        }

        // State 4: During particle animation (0.02 < aProg < 0.98 OR 0.02 < dProg < 0.98)
        // Ensure DOM text is 100% hidden so canvas particles and DOM text NEVER appear simultaneously!
        if (textRef.current) {
          textRef.current.style.opacity = "0";
          textRef.current.style.visibility = "hidden";
        }

        const globalDpr = Math.min(window.devicePixelRatio * 1.5 || 1, 3);
        const textBoundaries = textBoundariesRef.current;
        const particles = particlesRef.current;
        const len = particles.length;
        const width = textBoundaries.width || 1;

        ctx.save();
        ctx.scale(globalDpr, globalDpr);

        if (dProg > 0) {
          // --- DISSOLVE PHASE ---
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            let xNorm = Math.min(
              1,
              Math.max(0, (p.originalX - textBoundaries.left) / width),
            );
            if (direction === "right-to-left") {
              xNorm = 1 - xNorm;
            }
            const center = Math.min(
              0.95,
              Math.max(0.05, xNorm * 0.7 + p.delay + 0.15),
            );

            // 50% transition window ensures slow, noticeable dissolution
            const local = Math.min(
              1,
              Math.max(0, (dProg - (center - 0.25)) / 0.5),
            );

            if (local <= 0) {
              ctx.fillStyle = `${p.colorPrefix}${p.originalAlpha})`;
              ctx.fillRect(
                p.originalX / globalDpr,
                p.originalY / globalDpr,
                1,
                1,
              );
            } else if (local < 1) {
              const ease = Math.pow(local, 1.8);
              const inv = 1 - ease;
              const curX =
                p.originalX +
                p.dispX * ease +
                Math.sin(local * Math.PI + p.swirl) * 2.0 * inv;
              const curY =
                p.originalY +
                p.dispY * ease +
                Math.cos(local * Math.PI + p.swirl) * 1.5 * inv;
              const curAlpha = Math.max(0, p.originalAlpha * (1 - local * 1.1));

              if (curAlpha > 0.01) {
                ctx.fillStyle = `${p.colorPrefix}${curAlpha})`;
                ctx.fillRect(curX / globalDpr, curY / globalDpr, 1, 1);
              }
            }
          }
        } else {
          // --- ASSEMBLE PHASE (Smooth, gradual, cinematic glide into place) ---
          for (let i = 0; i < len; i++) {
            const p = particles[i];
            let xNorm = Math.min(
              1,
              Math.max(0, (p.originalX - textBoundaries.left) / width),
            );
            if (direction === "right-to-left") {
              xNorm = 1 - xNorm;
            }
            const center = Math.min(
              0.95,
              Math.max(0.05, xNorm * 0.7 + p.delay + 0.15),
            );

            // 50% transition window gives every particle generous travel time
            const local = Math.min(
              1,
              Math.max(0, (aProg - (center - 0.25)) / 0.5),
            );

            if (local <= 0) {
              continue;
            } else if (local >= 1) {
              ctx.fillStyle = `${p.colorPrefix}${p.originalAlpha})`;
              ctx.fillRect(
                p.originalX / globalDpr,
                p.originalY / globalDpr,
                1,
                1,
              );
            } else {
              // Cubic ease-out gives smooth arrival and gentle deceleration
              const ease = 1 - Math.pow(1 - local, 2.4);
              const inv = 1 - ease;

              // Subtle organic wisp while floating
              const wispX = Math.sin(local * Math.PI + p.swirl) * 2.5 * inv;
              const wispY = Math.cos(local * Math.PI + p.swirl) * 1.8 * inv;

              const curX = p.originalX + p.dispX * inv + wispX;
              const curY = p.originalY + p.dispY * inv + wispY;
              const curAlpha = Math.min(1, local * 1.6) * p.originalAlpha;

              if (curAlpha > 0.01) {
                ctx.fillStyle = `${p.colorPrefix}${curAlpha})`;
                ctx.fillRect(curX / globalDpr, curY / globalDpr, 1, 1);
              }
            }
          }
        }

        ctx.restore();
      },
      [direction],
    );

    // Offscreen pixel sampling
    const initParticles = useCallback(() => {
      const span = textRef.current;
      const canvas = canvasRef.current;
      if (!span || !canvas) return;

      const rect = span.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);

      if (width === 0 || height === 0) {
        requestAnimationFrame(() => {
          initParticles();
        });
        return;
      }

      const globalDpr = Math.min(window.devicePixelRatio * 1.5 || 1, 3);
      const computed = window.getComputedStyle(span);
      const fontSizeNum = parseInt(computed.fontSize || "50", 10) || 50;

      const VAPORIZE_SPREAD = calculateVaporizeSpread(fontSizeNum);
      const MULTIPLIED_VAPORIZE_SPREAD = VAPORIZE_SPREAD * spread;

      // Bleed area so dispersing particles are never clipped
      const pad = Math.ceil(Math.max(MULTIPLIED_VAPORIZE_SPREAD * 12, 40));
      boundsRef.current = { width, height, pad };

      // Canvas CSS dimensions with bleed
      canvas.style.position = "absolute";
      canvas.style.left = `-${pad}px`;
      canvas.style.top = `-${pad}px`;
      canvas.style.width = `${width + pad * 2}px`;
      canvas.style.height = `${height + pad * 2}px`;
      canvas.style.pointerEvents = "none";

      canvas.width = Math.floor((width + pad * 2) * globalDpr);
      canvas.height = Math.floor((height + pad * 2) * globalDpr);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render text on canvas for sampling
      ctx.save();
      ctx.scale(globalDpr, globalDpr);
      ctx.font = `${computed.fontWeight || 400} ${fontSizeNum}px ${computed.fontFamily || "sans-serif"}`;
      if (computed.letterSpacing && "letterSpacing" in ctx) {
        ctx.letterSpacing = computed.letterSpacing;
      }
      ctx.textBaseline = "middle";

      const textAlign = computed.textAlign || "left";
      const isCentered = textAlign === "center";
      ctx.textAlign = isCentered ? "center" : "left";
      ctx.imageSmoothingQuality = "high";
      ctx.imageSmoothingEnabled = true;

      const centerY = pad + height / 2;
      const textX = isCentered ? pad + width / 2 : pad;
      let curX = pad;

      if (multiline) {
        // Multi-line word wrap preserving manual newlines
        const paragraphs = plainText.split("\n");
        const lines = [];

        for (const para of paragraphs) {
          const words = para.split(/\s+/).filter(Boolean);
          let currentLine = "";

          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine
              ? `${currentLine} ${words[i]}`
              : words[i];
            if (ctx.measureText(testLine).width > width && currentLine) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
        }

        const lineHeight = parseFloat(computed.lineHeight) || fontSizeNum * 1.35;
        ctx.fillStyle = parseColor(color);

        lines.forEach((line, i) => {
          const lineY = pad + i * lineHeight + lineHeight / 2;
          ctx.fillText(line, textX, lineY);
        });
      } else {
        if (isCentered) {
          ctx.fillStyle = parseColor(color);
          ctx.fillText(plainText, textX, centerY);
        } else {
          segments.forEach((seg) => {
            ctx.fillStyle = seg.color;
            ctx.fillText(seg.text, curX, centerY);
            curX += ctx.measureText(seg.text).width;
          });
        }
      }
      ctx.restore();

      const textBoundaries = {
        left: pad * globalDpr,
        right: (pad + width) * globalDpr,
        width: width * globalDpr,
      };
      textBoundariesRef.current = textBoundaries;

      // Sample pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const baseDPR = 3;
      const currentDPR = canvas.width / (width + pad * 2);
      const baseSampleRate = Math.max(1, Math.round(currentDPR / baseDPR));
      const sampleRate = Math.max(
        1,
        Math.round(baseSampleRate * (5 / Math.max(1, density))),
      );

      const particles = [];

      for (let y = 0; y < canvas.height; y += sampleRate) {
        for (let x = 0; x < canvas.width; x += sampleRate) {
          const index = (y * canvas.width + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 0) {
            const originalAlpha = (alpha / 255) * (sampleRate / currentDPR);
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // Controlled dispersion for a subtle, graceful vapor plume
            const dispX =
              (Math.random() - 0.5) * MULTIPLIED_VAPORIZE_SPREAD * 6.0;
            const dispY =
              -(Math.random() * 0.7 + 0.3) * MULTIPLIED_VAPORIZE_SPREAD * 7.0;

            particles.push({
              originalX: x,
              originalY: y,
              colorPrefix: `rgba(${r}, ${g}, ${b}, `,
              originalAlpha,
              dispX,
              dispY,
              delay: (Math.random() - 0.5) * 0.2,
              swirl: Math.random() * Math.PI * 2,
            });
          }
        }
      }

      particlesRef.current = particles;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render initial state
      draw(assembleProgressRef.current, dissolveProgressRef.current);
    }, [color, density, draw, multiline, plainText, segments, spread]);

    // Imperative API for Hero.jsx
    useImperativeHandle(
      ref,
      () => ({
        setAnimationProgress: (assembleProg, dissolveProg = 0) => {
          draw(assembleProg, dissolveProg);
        },
        setProgress: (assembleProg) => {
          draw(assembleProg, 0);
        },
        recalculate: () => {
          initParticles();
        },
      }),
      [initParticles, draw],
    );

    // Initial setup and font readiness
    useEffect(() => {
      initParticles();

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          initParticles();
        });
      }

      let resizeTimer = null;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          initParticles();
        }, 120);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);
      };
    }, [initParticles]);

    return (
      <Tag
        ref={containerRef}
        className={`relative inline-block ${className}`}
        style={style}
      >
        {/* Crisp DOM text displayed once assembled */}
        <span
          ref={textRef}
          className="inline-block select-text"
          style={{ opacity: 0, visibility: "hidden" }}
          aria-label={plainText}
        >
          {segments.map((seg, i) => (
            <span key={i} style={{ color: seg.color }}>
              {seg.text}
            </span>
          ))}
        </span>

        {/* 21st.dev Canvas Particle Overlay */}
        <canvas ref={canvasRef} />
      </Tag>
    );
  },
);

VapourTextEffect.displayName = "VapourTextEffect";

export default VapourTextEffect;
export { VapourTextEffect };
