import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const vertex = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Cinematic aurora: layered flowing bands using simplex-like noise.
// Palette: deep black base, yellow primary, green secondary, rare red accent.
const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;     // 0..1
  uniform float uMouseStr; // 0..1

  varying vec2 vUv;

  // Hash + value noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // Aurora band: distance from a flowing horizontal wave
  float band(vec2 uv, float yCenter, float thickness, float speed, float freq, float phase) {
    float wave =
      sin(uv.x * freq + uTime * speed + phase) * 0.08 +
      sin(uv.x * freq * 2.3 + uTime * speed * 0.7 + phase) * 0.04 +
      fbm(vec2(uv.x * 1.5 + uTime * 0.05 * speed, phase)) * 0.18 - 0.09;
    float d = abs(uv.y - (yCenter + wave));
    return smoothstep(thickness, 0.0, d);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv;
    p.x *= uResolution.x / uResolution.y;

    // Base deep black with subtle vertical falloff
    vec3 base = vec3(0.039, 0.039, 0.043); // #0A0A0B
    base += vec3(0.02, 0.018, 0.012) * (1.0 - uv.y);

    // Mouse influence — intensity boost near cursor
    float md = distance(uv, uMouse);
    float mouseBoost = (1.0 - smoothstep(0.0, 0.45, md)) * uMouseStr;

    // Brand colors
    vec3 yellow = vec3(0.988, 0.820, 0.086); // #FCD116
    vec3 green  = vec3(0.000, 0.651, 0.318); // #00A651
    vec3 red    = vec3(0.808, 0.067, 0.149); // #CE1126

    // Three slow flowing bands at different heights
    float b1 = band(p, 0.62, 0.32, 0.18, 1.6, 0.0);
    float b2 = band(p, 0.48, 0.28, 0.13, 2.1, 2.7);
    float b3 = band(p, 0.34, 0.26, 0.10, 1.2, 5.3);

    // Rare red accent — only triggered by slow noise gate
    float redGate = smoothstep(0.62, 0.78, fbm(p * 0.6 + uTime * 0.03));
    float b4 = band(p, 0.55, 0.18, 0.08, 1.8, 9.1) * redGate * 0.55;

    // Soft turbulence overlay
    float turb = fbm(p * 1.8 + vec2(uTime * 0.04, -uTime * 0.03));
    float vignette = smoothstep(1.15, 0.25, length(uv - 0.5));

    vec3 col = base;
    col += green  * b1 * (0.55 + 0.4 * turb) * (0.85 + mouseBoost * 0.6);
    col += yellow * b2 * (0.50 + 0.5 * turb) * (0.85 + mouseBoost * 0.7);
    col += green  * b3 * 0.35 * (0.7 + 0.3 * turb);
    col += red    * b4 * (0.7 + mouseBoost * 0.4);

    // Glow wash blending bands
    float wash = (b1 + b2 + b3) * 0.25;
    col += mix(green, yellow, 0.4) * wash * 0.18;

    // Cinematic vignette + slight tone curve
    col *= mix(0.55, 1.0, vignette);
    col = pow(col, vec3(0.95));

    // Subtle film grain
    float grain = (hash(uv * uResolution.xy + uTime) - 0.5) * 0.025;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface AuroraShaderProps {
  className?: string;
}

export function AuroraShader({ className }: AuroraShaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const renderer = new Renderer({
      alpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0.039, 0.039, 0.043, 1);
    container.appendChild(gl.canvas);
    gl.canvas.style.display = "block";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uMouseStr: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const targetMouse = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    let targetMouseStr = 0;
    let mouseStr = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value = [rect.width, rect.height];
    };

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) {
        targetMouseStr = 0;
        return;
      }
      targetMouse.x = x;
      targetMouse.y = y;
      targetMouseStr = 1;
    };

    const handleLeave = () => {
      targetMouseStr = 0;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    let raf = 0;
    let last = 0;
    const targetFps = isMobile ? 30 : 60;
    const minFrameMs = 1000 / targetFps;
    const start = performance.now();

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (now - last < minFrameMs) return;
      last = now;

      mouse.x += (targetMouse.x - mouse.x) * 0.06;
      mouse.y += (targetMouse.y - mouse.y) * 0.06;
      mouseStr += (targetMouseStr - mouseStr) * 0.05;

      program.uniforms.uTime.value = (now - start) * 0.001;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];
      program.uniforms.uMouseStr.value = mouseStr;
      renderer.render({ scene: mesh });
    };

    if (prefersReducedMotion) {
      // Static single frame
      program.uniforms.uTime.value = 4.2;
      renderer.render({ scene: mesh });
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className ?? "absolute inset-0 h-full w-full"}
    />
  );
}

export default AuroraShader;
