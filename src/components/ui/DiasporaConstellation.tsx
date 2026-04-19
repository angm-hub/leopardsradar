import { useEffect, useRef, useState } from "react";

interface Star {
  id: string;
  city: string;
  country: string;
  player: string;
  lat: number;
  lon: number;
  isSun?: boolean;
}

const DIASPORA_STARS: Star[] = [
  { id: "kinshasa", city: "Kinshasa", country: "RDC", player: "Stade des Martyrs", lat: -4.32, lon: 15.32, isSun: true },
  { id: "london", city: "Londres", country: "ENG", player: "Wan-Bissaka (West Ham)", lat: 51.51, lon: -0.13 },
  { id: "watford", city: "Watford", country: "ENG", player: "Kayembe · Ngakia", lat: 51.66, lon: -0.40 },
  { id: "sunderland", city: "Sunderland", country: "ENG", player: "Sadiki", lat: 54.91, lon: -1.38 },
  { id: "burnley", city: "Burnley", country: "ENG", player: "Tuanzebe", lat: 53.79, lon: -2.24 },
  { id: "newcastle", city: "Newcastle", country: "ENG", player: "Wissa", lat: 54.98, lon: -1.61 },
  { id: "edinburgh", city: "Édimbourg", country: "SCO", player: "Bushiri (Hibernian)", lat: 55.95, lon: -3.19 },
  { id: "lille", city: "Lille", country: "FRA", player: "Mbemba · Mukau", lat: 50.63, lon: 3.07 },
  { id: "lens", city: "Lens", country: "FRA", player: "Masuaku", lat: 50.43, lon: 2.83 },
  { id: "le-havre", city: "Le Havre", country: "FRA", player: "Mpasi-Nzau", lat: 49.49, lon: 0.11 },
  { id: "montpellier", city: "Montpellier", country: "FRA", player: "Mbuku", lat: 43.61, lon: 3.88 },
  { id: "genk", city: "Genk", country: "BEL", player: "Kayembe Ditu", lat: 50.97, lon: 5.50 },
  { id: "liege", city: "Liège", country: "BEL", player: "Epolo (Standard)", lat: 50.63, lon: 5.57 },
  { id: "seville", city: "Séville", country: "ESP", player: "Bakambu (Betis)", lat: 37.39, lon: -5.99 },
  { id: "elche", city: "Elche", country: "ESP", player: "Diangana", lat: 38.27, lon: -0.70 },
  { id: "moscow", city: "Moscou", country: "RUS", player: "Bongonda (Spartak)", lat: 55.76, lon: 37.62 },
  { id: "cairo", city: "Le Caire", country: "EGY", player: "Mayele (Pyramids)", lat: 30.04, lon: 31.24 },
  { id: "lodz", city: "Łódź", country: "POL", player: "Kapuadi (Widzew)", lat: 51.76, lon: 19.46 },
];

function projectCoordinates(lat: number, lon: number, w: number, h: number) {
  const centerLon = 15;
  const centerLat = 25;
  const scaleX = w / 90;
  const scaleY = h / 60;
  return {
    x: (lon - centerLon) * scaleX + w / 2,
    y: -(lat - centerLat) * scaleY + h / 2,
  };
}

interface DiasporaConstellationProps {
  className?: string;
}

export function DiasporaConstellation({ className }: DiasporaConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<{ star: Star; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    // Phase offsets per star (stable per mount)
    const phases = DIASPORA_STARS.map((_, i) => (i * 0.7) % (Math.PI * 2));

    // Pulses traveling along lines (one per non-sun star, with stagger)
    const lineCount = DIASPORA_STARS.length - 1;
    const pulseStarts = Array.from({ length: lineCount }, (_, i) => -((i / lineCount) * 3));

    const mouse = { x: -9999, y: -9999, inside: false };

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.inside = true;
    };
    const handleLeave = () => {
      mouse.inside = false;
      mouse.x = -9999;
      mouse.y = -9999;
      setHovered(null);
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);

    const start = performance.now();
    let raf = 0;
    let last = 0;
    const minFrameMs = 1000 / 30;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!prefersReduced && now - last < minFrameMs) return;
      last = now;
      const t = (now - start) / 1000;

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#050506");
      bg.addColorStop(1, "#0A0A0B");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm radial glow at center
      const radial = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * 0.55
      );
      radial.addColorStop(0, "rgba(252,209,22,0.04)");
      radial.addColorStop(1, "rgba(252,209,22,0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Project all stars
      const projected = DIASPORA_STARS.map((s) => ({
        star: s,
        ...projectCoordinates(s.lat, s.lon, width, height),
      }));

      const sun = projected.find((p) => p.star.isSun)!;

      // Connection lines (Kinshasa -> each)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(252,209,22,0.08)";
      for (const p of projected) {
        if (p.star.isSun) continue;
        ctx.beginPath();
        ctx.moveTo(sun.x, sun.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Travelling pulses on lines (skip on mobile or reduced motion)
      if (!prefersReduced && !isMobile) {
        const others = projected.filter((p) => !p.star.isSun);
        const pulseDuration = 3;
        const pulseLenPx = 40;
        for (let i = 0; i < others.length; i++) {
          const target = others[i];
          const elapsed = t - pulseStarts[i];
          const cycle = ((elapsed % pulseDuration) + pulseDuration) % pulseDuration;
          const progress = cycle / pulseDuration;
          if (progress < 0 || progress > 1) continue;

          const dx = target.x - sun.x;
          const dy = target.y - sun.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1) continue;
          const ux = dx / dist;
          const uy = dy / dist;

          const headDist = progress * dist;
          const tailDist = Math.max(0, headDist - pulseLenPx);
          const hx = sun.x + ux * headDist;
          const hy = sun.y + uy * headDist;
          const tx = sun.x + ux * tailDist;
          const ty = sun.y + uy * tailDist;

          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0, "rgba(252,209,22,0)");
          grad.addColorStop(1, "rgba(252,209,22,0.3)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();
        }
      }

      // Hover detection
      let nearest: { star: Star; x: number; y: number; d: number } | null = null;
      if (mouse.inside) {
        for (const p of projected) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < 60 && (!nearest || d < nearest.d)) {
            nearest = { star: p.star, x: p.x, y: p.y, d };
          }
        }
      }

      // Draw stars
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const isHover = nearest && nearest.star.id === p.star.id;
        const phase = phases[i];
        const baseCycle = p.star.isSun ? 3 : 2;
        const pulse = prefersReduced ? 0.5 : 0.5 + 0.5 * Math.sin((t / baseCycle) * Math.PI * 2 + phase);
        const intensity = isHover ? 1 + 0.5 : 0.7 + pulse * 0.3;

        if (p.star.isSun) {
          // Sonar ring
          if (!prefersReduced) {
            const sonarPeriod = 4;
            const sonarT = (t % sonarPeriod) / sonarPeriod;
            const sonarR = 10 + sonarT * 80;
            const sonarA = (1 - sonarT) * 0.25;
            ctx.beginPath();
            ctx.arc(p.x, p.y, sonarR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(252,209,22,${sonarA})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          // Outer glow
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 60);
          glow.addColorStop(0, `rgba(252,209,22,${0.5 * intensity})`);
          glow.addColorStop(1, "rgba(252,209,22,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 60, 0, Math.PI * 2);
          ctx.fill();
          // Middle ring
          ctx.fillStyle = `rgba(252,209,22,${0.8 * intensity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fill();
          // Bright white core
          ctx.fillStyle = "#F4F4F1";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const glowR = 30 * (isHover ? 1.4 : 1);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          glow.addColorStop(0, `rgba(252,209,22,${0.3 * intensity})`);
          glow.addColorStop(1, "rgba(252,209,22,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#FCD116";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update tooltip state (lazy — only when changed)
      if (nearest) {
        setHovered((prev) => {
          if (prev && prev.star.id === nearest!.star.id) return prev;
          return { star: nearest!.star, x: nearest!.x, y: nearest!.y };
        });
      } else {
        setHovered((prev) => (prev ? null : prev));
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // Tooltip placement: if star is in right half, render tooltip to the left
  const tooltipStyle = hovered
    ? (() => {
        const wrapperW = wrapperRef.current?.getBoundingClientRect().width ?? 0;
        const onRight = hovered.x > wrapperW / 2;
        return {
          left: hovered.x + (onRight ? -15 : 15),
          top: hovered.y - 15,
          transform: onRight ? "translate(-100%, -100%)" : "translate(0, -100%)",
        } as React.CSSProperties;
      })()
    : undefined;

  return (
    <div ref={wrapperRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-black/80 px-3 py-2 backdrop-blur-md"
          style={tooltipStyle}
        >
          <div className="font-serif text-sm text-foreground">{hovered.star.city}</div>
          <div className="text-xs text-muted-foreground">{hovered.star.player}</div>
        </div>
      )}
    </div>
  );
}

export default DiasporaConstellation;
