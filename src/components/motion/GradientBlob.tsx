/**
 * GradientBlob — Blob lumineux anime en arriere-plan (ORA "Gradient Left/Right" style).
 *
 * Rendu : un cercle blur(120px) qui se deplace lentement en arriere-plan
 * via translate + rotate. Boucle infinie en spring soft. pointer-events:none.
 *
 * Usage :
 *   <div className="relative overflow-hidden">
 *     <GradientBlob preset="cobalt" position="top-right" />
 *     <div className="relative z-10">...content...</div>
 *   </div>
 *
 * Auto-disable sur prefers-reduced-motion (rendu statique).
 */
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Preset = "cobalt" | "star" | "zaire" | "blood" | "mixed";
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

interface GradientBlobProps {
  preset?: Preset;
  position?: Position;
  size?: number;          // px (defaut 600)
  opacity?: number;       // 0-1 (defaut 0.5)
  className?: string;
  duration?: number;      // duree de la boucle (defaut 18s)
}

const presetGradients: Record<Preset, string> = {
  cobalt: "radial-gradient(circle, rgba(37,99,184,0.6) 0%, rgba(37,99,184,0) 70%)",
  star:   "radial-gradient(circle, rgba(245,197,24,0.5) 0%, rgba(245,197,24,0) 70%)",
  zaire:  "radial-gradient(circle, rgba(14,94,60,0.55) 0%, rgba(14,94,60,0) 70%)",
  blood:  "radial-gradient(circle, rgba(200,32,43,0.5) 0%, rgba(200,32,43,0) 70%)",
  mixed:  "radial-gradient(circle, rgba(37,99,184,0.55) 0%, rgba(245,197,24,0.18) 45%, rgba(37,99,184,0) 70%)",
};

const positionStyles: Record<Position, React.CSSProperties> = {
  "top-left":     { top: "-15%", left: "-15%" },
  "top-right":    { top: "-15%", right: "-15%" },
  "bottom-left":  { bottom: "-15%", left: "-15%" },
  "bottom-right": { bottom: "-15%", right: "-15%" },
  "center":       { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
};

export function GradientBlob({
  preset = "cobalt",
  position = "top-right",
  size = 600,
  opacity = 0.5,
  className,
  duration = 18,
}: GradientBlobProps) {
  const prefersReduced = useReducedMotion();

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    background: presetGradients[preset],
    filter: "blur(60px)",
    opacity,
    ...positionStyles[position],
  };

  if (prefersReduced) {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute rounded-full", className)}
        style={baseStyle}
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={baseStyle}
      animate={{
        scale: [1, 1.15, 0.95, 1.1, 1],
        x: [0, 40, -30, 20, 0],
        y: [0, -30, 40, -20, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
