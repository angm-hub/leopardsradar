import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";

const PLAYER_DOTS = [
  { x: 0.48, y: 0.42 },
  { x: 0.5, y: 0.48 },
  { x: 0.51, y: 0.5 },
  { x: 0.53, y: 0.55 },
  { x: 0.47, y: 0.6 },
  { x: 0.54, y: 0.72 },
  { x: 0.6, y: 0.48 },
  { x: 0.62, y: 0.68 },
  { x: 0.58, y: 0.58 },
  { x: 0.45, y: 0.45 },
  { x: 0.52, y: 0.53 },
  { x: 0.5, y: 0.45 },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LeopardsHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationId = 0;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mouseRef.current = { x: rect.width / 2, y: rect.height / 2 };
      targetMouseRef.current = { x: rect.width / 2, y: rect.height / 2 };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const handleMouseLeave = () => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = { x: rect.width / 2, y: rect.height / 2 };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * 0.08;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * 0.08;

      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#0A0A0B");
      gradient.addColorStop(1, "#131316");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      PLAYER_DOTS.forEach((dot, i) => {
        const x = dot.x * w;
        const y = dot.y * h;

        const dx = x - mouseRef.current.x;
        const dy = y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / 300);

        const pulse = prefersReducedMotion
          ? 1
          : Math.sin(time * 0.02 + i * 0.5) * 0.25 + 0.85;
        const radius = (6 + influence * 4) * pulse;
        const alpha = 0.55 + influence * 0.45;

        const halo = ctx.createRadialGradient(x, y, 0, x, y, 40 + influence * 20);
        halo.addColorStop(0, `rgba(252, 209, 22, ${alpha * 0.55})`);
        halo.addColorStop(1, "rgba(252, 209, 22, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, 40 + influence * 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(252, 209, 22, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        time += 1;
        animationId = window.requestAnimationFrame(draw);
      }
    };

    if (prefersReducedMotion) {
      draw();
    } else {
      animationId = window.requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background pointer-events-none" />

      <div className="container-site relative z-10 flex min-h-screen items-center py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-8"
        >
          <motion.div variants={itemVariants}>
            <Pill dot dotColor="bg-success">
              Saison 2025/26
            </Pill>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance text-foreground"
          >
            Les yeux sur tous{" "}
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
              les Léopards.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-foreground/70 max-w-2xl text-balance"
          >
            Roster actuel. Talents éligibles. Un seul endroit.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" className="group">
              Voir le Roster
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg">
              S'abonner à la newsletter
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 mt-2"
          >
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-primary/70 to-pos-att/60 first:ml-0 -ml-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 70% 55%), hsl(${(i * 91) % 360} 60% 40%))`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-foreground/50">
              Rejoint par 247 fans passionnés
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default LeopardsHero;
