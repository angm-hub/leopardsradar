/**
 * RevealOnScroll — Fade + slide-up au scroll, declenche a 15% du viewport.
 *
 * Wrapper drop-in pour n'importe quel contenu. Stagger automatique si on passe
 * des enfants multiples avec `staggerChildren > 0`.
 *
 * Usage simple :
 *   <RevealOnScroll>
 *     <h2>Mes Leopards</h2>
 *   </RevealOnScroll>
 *
 * Usage liste avec stagger :
 *   <RevealOnScroll staggerChildren={0.08}>
 *     {items.map(item => (
 *       <RevealOnScrollItem key={item.id}>{item.title}</RevealOnScrollItem>
 *     ))}
 *   </RevealOnScroll>
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;                 // offset translateY (defaut 32px)
  duration?: number;          // duree (defaut 0.7s)
  staggerChildren?: number;   // stagger entre enfants (defaut 0 = pas de stagger)
  once?: boolean;             // ne joue qu'une fois (defaut true)
  margin?: string;            // viewport margin (defaut "-12% 0px")
}

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  y = 32,
  duration = 0.7,
  staggerChildren = 0,
  once = true,
  margin = "-12% 0px",
}: RevealOnScrollProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: { opacity: 0, y, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration,
        ease: [0.16, 1, 0.3, 1],
        delay,
        ...(staggerChildren > 0 ? { staggerChildren, delayChildren: delay } : {}),
      },
    },
  };

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: margin as `${number}px` | `${number}%` }}
    >
      {children}
    </motion.div>
  );
}

// Item enfant pour usage avec stagger
export const RevealOnScrollItem = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string; y?: number }
>(({ children, className, y = 24 }, ref) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
});
RevealOnScrollItem.displayName = "RevealOnScrollItem";
