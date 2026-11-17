// Horizon Hero Section - 21st.dev Three.js Effect
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

interface HorizonProps {
  isActive?: boolean;
  className?: string;
}

export const Component: React.FC<HorizonProps> = ({
  isActive = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const threeRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    composer: EffectComposer | null;
    stars: THREE.Points[];
    nebula: THREE.Mesh | null;
    mountains: THREE.Mesh[];
    animationId: number | null;
    isInitialized: boolean;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
    isInitialized: false,
  });

  // Initialize Three.js once on mount
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { current: refs } = threeRefs;
    if (refs.isInitialized) return;

    const initialWidth = container.clientWidth || 300;
    const initialHeight = container.clientHeight || 400;

    // Scene setup - strictly transparent to overlay Crimson Moon without blocking it
    refs.scene = new THREE.Scene();
    refs.scene.background = null;

    // Camera - strictly centered on x = 0
    refs.camera = new THREE.PerspectiveCamera(
      75,
      initialWidth / initialHeight,
      0.1,
      2000,
    );
    refs.camera.position.set(0, 20, 100);

    // Renderer with alpha: true and transparent clear color
    try {
      refs.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      refs.renderer.setSize(initialWidth, initialHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.setClearColor(0x000000, 0);
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.6;
    } catch (e) {
      console.warn("WebGL init error:", e);
      return;
    }

    // Post-processing with bloom pass
    refs.composer = new EffectComposer(refs.renderer);
    const renderPass = new RenderPass(refs.scene, refs.camera);
    refs.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(initialWidth, initialHeight),
      0.75,
      0.4,
      0.85,
    );
    refs.composer.addPass(bloomPass);

    // Create scene elements
    createStarField();

    // Nebula disabled to keep the original Crimson Moon image clearly visible.
    createMountains();
    createAtmosphere();

    refs.isInitialized = true;

    function createStarField() {
      if (!refs.scene) return;
      const starCount = 3500;

      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.7) {
            color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
          } else if (colorChoice < 0.9) {
            color.setHSL(0.08, 0.5, 0.8);
          } else {
            color.setHSL(0.6, 0.5, 0.8);
          }

          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;

          sizes[j] = Math.random() * 2 + 0.5;
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
            depth: { value: i },
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
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
    }

    function createNebula() {
      if (!refs.scene) return;
      const geometry = new THREE.PlaneGeometry(8000, 4000, 80, 80);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x0033ff) },
          color2: { value: new THREE.Color(0xff0066) },
          opacity: { value: 0.25 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
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
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      refs.scene.add(nebula);
      refs.nebula = nebula;
    }

    function createMountains() {
      if (!refs.scene) return;
      const layers = [
        { distance: -50, height: 60, color: 0x1a1a2e, opacity: 0.5 },
        { distance: -100, height: 80, color: 0x16213e, opacity: 0.4 },
        { distance: -150, height: 100, color: 0x0f3460, opacity: 0.35 },
        { distance: -200, height: 120, color: 0x0a4668, opacity: 0.25 },
      ];

      layers.forEach((layer, index) => {
        const points = [];
        const segments = 50;

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y =
            Math.sin(i * 0.1) * layer.height +
            Math.sin(i * 0.05) * layer.height * 0.5 +
            Math.random() * layer.height * 0.2 -
            100;
          points.push(new THREE.Vector2(x, y));
        }

        points.push(new THREE.Vector2(5000, -300));
        points.push(new THREE.Vector2(-5000, -300));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide,
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene?.add(mountain);
        refs.mountains.push(mountain);
      });
    }

    function createAtmosphere() {
      if (!refs.scene) return;
      const geometry = new THREE.SphereGeometry(600, 32, 32);
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
            vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
            
            float pulse = sin(time * 2.0) * 0.1 + 0.9;
            atmosphere *= pulse;
            
            gl_FragColor = vec4(atmosphere, intensity * 0.25);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      const atmosphere = new THREE.Mesh(geometry, material);
      refs.scene.add(atmosphere);
    }

    // Dynamic resize handler observing container dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w > 0 && h > 0 && refs.camera && refs.renderer && refs.composer) {
          refs.camera.aspect = w / h;
          refs.camera.updateProjectionMatrix();
          refs.renderer.setSize(w, h);
          refs.composer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId);
        refs.animationId = null;
      }

      refs.stars.forEach((starField) => {
        starField.geometry.dispose();
        (starField.material as THREE.Material).dispose();
      });

      refs.mountains.forEach((mountain) => {
        mountain.geometry.dispose();
        (mountain.material as THREE.Material).dispose();
      });

      if (refs.nebula) {
        refs.nebula.geometry.dispose();
        (refs.nebula.material as THREE.Material).dispose();
      }

      if (refs.renderer) {
        refs.renderer.dispose();
      }

      refs.isInitialized = false;
    };
  }, []);

  // Animation loop management: runs ONLY when isActive is true
  useEffect(() => {
    const { current: refs } = threeRefs;

    function renderLoop() {
      if (!refs.scene || !refs.camera || !refs.composer) return;
      refs.animationId = requestAnimationFrame(renderLoop);

      const time = Date.now() * 0.001;

      // Update stars
      refs.stars.forEach((starField) => {
        if (
          starField.material &&
          (starField.material as THREE.ShaderMaterial).uniforms
        ) {
          (starField.material as THREE.ShaderMaterial).uniforms.time.value =
            time;
        }
      });

      // Update nebula
      if (
        refs.nebula &&
        (refs.nebula.material as THREE.ShaderMaterial).uniforms
      ) {
        (refs.nebula.material as THREE.ShaderMaterial).uniforms.time.value =
          time * 0.5;
      }

      // Gentle floating motion
      const floatX = Math.sin(time * 0.1) * 2;
      const floatY = Math.cos(time * 0.15) * 1;

      refs.camera.position.x = floatX;
      refs.camera.position.y = 20 + floatY;
      refs.camera.position.z = 100;
      refs.camera.lookAt(0, 10, -600);

      // Parallax mountains
      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        mountain.position.y = 50 + Math.cos(time * 0.15) * 1 * parallaxFactor;
      });

      refs.composer.render();
    }

    if (isActive) {
      if (!refs.animationId && refs.composer) {
        refs.animationId = requestAnimationFrame(renderLoop);
      }
    } else {
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId);
        refs.animationId = null;
      }
    }

    return () => {
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId);
        refs.animationId = null;
      }
    };
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={`hero-container cosmos-style absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all duration-700 ease-out ${className}`}
      style={{
        zIndex: 1,
        opacity: isActive ? 1 : 0,
        visibility: isActive ? "visible" : "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        className="hero-canvas w-full h-full block pointer-events-none"
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
};

export default Component;
