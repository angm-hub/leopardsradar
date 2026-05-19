/**
 * TextRevealMask — Slide-up dans un masque vertical, sans fragmenter le texte.
 *
 * Contraire de TextRevealWords (qui split en spans), celle-ci garde le contenu
 * INTACT (children any) et l'anime via translateY dans un container overflow:hidden.
 *
 * Avantage : tout effet CSS qui depend d'un span continu reste fonctionnel —
 * notamment bg-clip-text + text-transparent (gradient text), text-shadow,
 * letter-spacing, etc.
 *
 * Pattern ORA "Reveal Text" (mask container).
 *
 * Usage :
 *   <h1>
 *     Toute la data du{" "}
 *     <TextRevealMask delay={0.3}>
 *       <span className="bg-gradient ...">football congolais.</span>
 *     </TextRevealMask>
 *   </h1>
 */
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRevealMaskProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** Pourcentage de translation Y initial. 100 = 100% en bas, 50 = mi-hauteur. */
  fromY?: number;
}

export function TextRevealMask({
  children,
  className,
  delay = 0,
  duration = 0.9,
  fromY = 110,
}: TextRevealMaskProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <span className={cn("inline-block", className)}>{children}</span>;
  }

  return (
    <span
      className={cn(
        "inline-block overflow-hidden align-bottom",
        className,
      )}
      // align-bottom evite le decalage typo du wrapper inline-block
    >
      <motion.span
        className="inline-block will-change-transform"
        initial={{ y: `${fromY}%`, opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
