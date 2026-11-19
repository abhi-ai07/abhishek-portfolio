import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

/**
 * HorizonVisual Component
 * 21st.dev Horizon Three.js scene:
 * - 3-layer rotating celestial star field
 * - Cosmic undulating nebula (crimson & deep indigo)
 * - 4-layer parallax mountain silhouettes
 * - Atmospheric rim-lit glowing sphere
 * - Foreground drifting crimson/white ember particles
 * - Scroll-progress synchronized continuous 3D camera travel
 * - Crystal-clear transparent renderer to overlay the Crimson Moon visual
 */
const HorizonVisual = forwardRef(({ isMobile = false, progress = 0 }, ref) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);

  const threeRefs = useRef({
    scene: null,
    camera: null,
    renderer: null,
    animationId: null,
    stars: [],
    nebula: null,
    mountains: [],
    atmosphere: null,
    particles: null,
    isInitialized: false,
    targetCamera: { x: 0, y: 18, z: 105 },
    currentCamera: { x: 0, y: 18, z: 105 },
    isIntersecting: false,
    isAnimating: false,
    startAnimation: null,
  });

  // Imperative handle so About.jsx can update scroll progress & opacity without React re-renders
  useImperativeHandle(
    ref,
    () => ({
      setProgress: (scrollProgress, opacity = 1) => {
        progressRef.current = Math.max(0, Math.min(1, scrollProgress));
        const isOpen = opacity > 0.001;
        if (containerRef.current) {
          containerRef.current.style.opacity = String(opacity);
          containerRef.current.style.visibility = isOpen ? "visible" : "hidden";
        }

        const refs = threeRefs.current;
        if (isOpen && refs.isIntersecting && !refs.isAnimating && refs.isInitialized) {
          refs.isAnimating = true;
          refs.startAnimation?.();
        } else if (!isOpen && refs.isAnimating) {
          refs.isAnimating = false;
          if (refs.animationId) {
            cancelAnimationFrame(refs.animationId);
            refs.animationId = null;
          }
        }
      },
    }),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const refs = threeRefs.current;
    if (refs.isInitialized) return;

    const initialWidth = container.clientWidth || 300;
    const initialHeight = container.clientHeight || 400;

    // 1. Scene setup - strictly transparent to overlay Crimson Moon without blocking it
    refs.scene = new THREE.Scene();
    refs.scene.background = null;

    // 2. Camera setup - strictly centered
    const fov = isMobile ? 65 : 55;
    refs.camera = new THREE.PerspectiveCamera(
      fov,
      initialWidth / initialHeight,
      0.1,
      2000,
    );
    refs.camera.position.set(0, 18, 105);
    refs.targetCamera = { x: 0, y: 18, z: 105 };
    refs.currentCamera = { x: 0, y: 18, z: 105 };

    // 3. WebGL Renderer with alpha: true and transparent clear color
    try {
      refs.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance",
      });
      refs.renderer.setSize(initialWidth, initialHeight);
      refs.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2),
      );
      refs.renderer.setClearColor(0x000000, 0);
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 1.0;
    } catch (e) {
      console.warn("WebGL init warning:", e);
      return;
    }

    // 4. Star Field: 3 depth layers of stars rotating in 3D
    const createStarField = () => {
      const starCount = isMobile ? 1800 : 3200;
      refs.stars = [];

      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 180 + Math.random() * 700;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.6) {
            // Soft white/silver stars
            color.setHSL(0, 0, 0.85 + Math.random() * 0.15);
          } else if (colorChoice < 0.8) {
            // Warm crimson/rose tint to match Crimson Moon
            color.setHSL(0.58, 0.15, 0.8);
          } else {
            // Celestial golden/ice star
            color.setHSL(0.08, 0.5, 0.8);
          }

          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;

          sizes[j] = Math.random() * 2.2 + 0.6;
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            scroll: { value: 0 },
            depth: { value: i },
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float scroll;
            uniform float depth;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              
              float angle = (time * 0.03 + scroll * 1.2) * (1.0 - depth * 0.25);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (260.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity * 0.85);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene.add(stars);
        refs.stars.push(stars);
      }
    };

    // 5. Cosmic Nebula: undulating cosmic plane mixing crimson & deep indigo
    const createNebula = () => {
      const geometry = new THREE.PlaneGeometry(6000, 3200, 60, 60);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          scroll: { value: 0 },
          color1: { value: new THREE.Color(0x101827) },
          color2: { value: new THREE.Color(0x26364a) },
          opacity: { value: 0.015 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          uniform float scroll;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            float elevation = sin(pos.x * 0.008 + time * 0.4 + scroll * 2.0) * cos(pos.y * 0.008 + time * 0.3) * 16.0;
            pos.z += elevation;
            vElevation = elevation;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            float mixFactor = sin(vUv.x * 8.0 + time * 0.3) * cos(vUv.y * 8.0 + time * 0.3);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.015;
            
            gl_FragColor = vec4(color, max(0.0, alpha));
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -900;
      refs.scene.add(nebula);
      refs.nebula = nebula;
    };

    // 6. Mountain Silhouettes: 4 layered procedural silhouettes with parallax
    const createMountains = () => {
      refs.mountains = [];
      const layers = [
        { distance: -60, height: 45, color: 0x140a18, opacity: 0.38 },
        { distance: -110, height: 65, color: 0x1a0d20, opacity: 0.3 },
        { distance: -160, height: 85, color: 0x22102a, opacity: 0.24 },
        { distance: -210, height: 105, color: 0x180b22, opacity: 0.18 },
      ];

      layers.forEach((layer, index) => {
        const points = [];
        const segments = 45;

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 900;
          const y =
            Math.sin(i * 0.15) * layer.height +
            Math.sin(i * 0.08) * layer.height * 0.5 +
            Math.sin(i * 0.35 + index) * layer.height * 0.2 -
            80;
          points.push(new THREE.Vector2(x, y));
        }

        points.push(new THREE.Vector2(4000, -300));
        points.push(new THREE.Vector2(-4000, -300));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance * 0.4 - 10;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene.add(mountain);
        refs.mountains.push(mountain);
      });
    };

    // 7. Atmosphere: subtle Fresnel rim lighting sphere
    const createAtmosphere = () => {
      const geometry = new THREE.SphereGeometry(550, 24, 24);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphere = vec3(0.55, 0.68, 0.8) * intensity;

            float pulse = sin(time * 1.5) * 0.04 + 0.96;
            atmosphere *= pulse;

            gl_FragColor = vec4(atmosphere, intensity * 0.02);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      const atmosphere = new THREE.Mesh(geometry, material);
      refs.scene.add(atmosphere);
      refs.atmosphere = atmosphere;
    };

    // 8. Floating Crimson & White Particles (Ember particles)
    const createParticles = () => {
      const particleCount = isMobile ? 90 : 160;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      const pColor = new Float32Array(particleCount * 3);
      const pSize = new Float32Array(particleCount);

      const crimson = new THREE.Color(0xcbd5e1);
      const rose = new THREE.Color(0xe2e8f0);
      const white = new THREE.Color(0xffffff);

      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 220;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 140;
        pPos[i * 3 + 2] = 5 + Math.random() * 50;

        const pick = Math.random();
        const col = pick < 0.6 ? crimson : pick < 0.85 ? rose : white;
        pColor[i * 3] = col.r;
        pColor[i * 3 + 1] = col.g;
        pColor[i * 3 + 2] = col.b;

        pSize[i] = Math.random() * 2.4 + 1.0;
      }

      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute("color", new THREE.BufferAttribute(pColor, 3));
      pGeo.setAttribute("size", new THREE.BufferAttribute(pSize, 1));

      const pMat = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          scroll: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          uniform float scroll;
          
          void main() {
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.35 + pos.x * 0.05 + scroll * 2.5) * 3.0;
            pos.x += cos(time * 0.25 + pos.y * 0.05) * 2.0;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (240.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(vColor, alpha * 0.7);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      refs.particles = new THREE.Points(pGeo, pMat);
      refs.scene.add(refs.particles);
    };

    createStarField();
    createNebula();
    createMountains();
    createAtmosphere();
    createParticles();

    refs.isInitialized = true;

    // 9. Continuous Animation Loop reacting smoothly to scroll progress across all 3 stages
    const animate = () => {
      if (!refs.isAnimating || !refs.isIntersecting) {
        refs.animationId = null;
        return;
      }
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      const p = progressRef.current;

      // Update stars
      refs.stars.forEach((starField) => {
        if (starField.material && starField.material.uniforms) {
          starField.material.uniforms.time.value = time;
          starField.material.uniforms.scroll.value = p;
        }
      });

      // Update nebula
      if (refs.nebula && refs.nebula.material.uniforms) {
        refs.nebula.material.uniforms.time.value = time;
        refs.nebula.material.uniforms.scroll.value = p;
      }

      // Update atmosphere
      if (refs.atmosphere && refs.atmosphere.material.uniforms) {
        refs.atmosphere.material.uniforms.time.value = time;
      }

      // Update particles
      if (refs.particles && refs.particles.material.uniforms) {
        refs.particles.material.uniforms.time.value = time;
        refs.particles.material.uniforms.scroll.value = p;
      }

      // Smooth floating motion
      const floatX = Math.sin(time * 0.08) * 1.5;
      const floatY = Math.cos(time * 0.12) * 1.0;

      // Continuous camera journey mapped across all stages:
      // Smoothly glides forward from z=105 to z=72, and tilts up slightly from y=18 to y=28
      refs.targetCamera.z = 105 - p * 33;
      refs.targetCamera.y = 18 + p * 10;

      // Smooth interpolation for silky response when scrolling up or down
      refs.currentCamera.z +=
        (refs.targetCamera.z - refs.currentCamera.z) * 0.08;
      refs.currentCamera.y +=
        (refs.targetCamera.y - refs.currentCamera.y) * 0.08;

      refs.camera.position.x = floatX;
      refs.camera.position.y = refs.currentCamera.y + floatY;
      refs.camera.position.z = refs.currentCamera.z;
      refs.camera.lookAt(0, 8, -600);

      // Multi-layer mountain parallax responding to scroll progress
      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.6;
        mountain.position.x = Math.sin(time * 0.08) * 1.5 * parallaxFactor;
        mountain.position.y =
          mountain.userData.baseZ * 0.4 -
          10 +
          p * 8 * (i + 1) * 0.35 +
          Math.cos(time * 0.12) * 0.8 * parallaxFactor;
      });

      refs.renderer.render(refs.scene, refs.camera);
    };

    refs.startAnimation = () => {
      if (!refs.animationId && refs.isAnimating && refs.isIntersecting) {
        refs.animationId = requestAnimationFrame(animate);
      }
    };

    // 10. IntersectionObserver to dynamically pause Three.js when off-screen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        refs.isIntersecting = entry.isIntersecting;
        if (refs.isIntersecting && refs.isAnimating) {
          refs.startAnimation?.();
        } else if (!refs.isIntersecting && refs.animationId) {
          cancelAnimationFrame(refs.animationId);
          refs.animationId = null;
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // 11. ResizeObserver to dynamically update aspect ratio without distortion
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w > 0 && h > 0 && refs.camera && refs.renderer) {
          refs.camera.aspect = w / h;
          refs.camera.updateProjectionMatrix();
          refs.renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId);
        refs.animationId = null;
      }

      refs.stars.forEach((s) => {
        s.geometry.dispose();
        s.material.dispose();
      });

      refs.mountains.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });

      if (refs.nebula) {
        refs.nebula.geometry.dispose();
        refs.nebula.material.dispose();
      }

      if (refs.atmosphere) {
        refs.atmosphere.geometry.dispose();
        refs.atmosphere.material.dispose();
      }

      if (refs.particles) {
        refs.particles.geometry.dispose();
        refs.particles.material.dispose();
      }

      if (refs.renderer) {
        refs.renderer.dispose();
      }

      refs.isInitialized = false;
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none transition-opacity duration-300"
      style={{
        zIndex: 1,
        opacity: 0,
        visibility: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
});

HorizonVisual.displayName = "HorizonVisual";

export default HorizonVisual;
