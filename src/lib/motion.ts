import { useReducedMotion, type MotionProps, type Variants } from "framer-motion";

/**
 * Returns a factory that produces fade-up motion props,
 * respecting the user's `prefers-reduced-motion` setting.
 *
 * When reduced motion is requested, the content is rendered as visible
 * from the start (no animation, no opacity:0 trap).
 *
 * Usage:
 *   const fadeUp = useFadeUp();
 *   <motion.div {...fadeUp(0.2)}>...</motion.div>
 */
export function useFadeUp() {
  const reduced = useReducedMotion();

  return function fadeUp(delay = 0): MotionProps {
    if (reduced) {
      return {
        initial: false,
        animate: { opacity: 1, y: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: 24 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0 },
      transition: { duration: 0.6, ease: "easeOut", delay },
    };
  };
}

/**
 * Returns container + item variants for staggered fade-up,
 * respecting the user's `prefers-reduced-motion` setting.
 *
 * When reduced motion is requested, returns identity variants
 * (no animation, content visible).
 */
export function useFadeUpVariants(staggerSeconds: number = 0.08): {
  container: Variants;
  item: Variants;
  initial: "hidden" | "visible";
  whileInView: "visible";
  viewport: { once: true; amount: number };
} {
  const reduced = useReducedMotion();

  if (reduced) {
    return {
      container: {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      },
      item: {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      },
      initial: "visible",
      whileInView: "visible",
      viewport: { once: true, amount: 0 },
    };
  }

  return {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: staggerSeconds } },
    },
    item: {
      hidden: { opacity: 0, y: 24 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
      },
    },
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0 },
  };
}
