/**
 * TextRevealWords — Reveal mot par mot avec blur + slide-up.
 *
 * Pattern ORA-style : chaque mot dans un span inline-block, opacite 0→1,
 * blur(12px)→blur(0), translateY(20px)→0, stagger 40ms entre les mots.
 *
 * Usage :
 *   <TextRevealWords as="h1" className="text-6xl">
 *     L'automatisation IA à votre service
 *   </TextRevealWords>
 *
 * Respecte prefers-reduced-motion (rendu instantane si actif).
 */
import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRevealWordsProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;            // delai initial avant le 1er mot, en secondes
  stagger?: number;          // ecart entre les mots, en secondes (defaut 0.04)
  startOnView?: boolean;     // declenche au scroll plutot qu'au mount (defaut false = mount)
  blur?: boolean;            // active le blur (defaut true, ORA-style)
}

const containerVariants: Variants = {
  hidden: {},
  visible: (custom: { stagger: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.stagger,
      delayChildren: custom.delay,
    },
  }),
};

const wordVariants = (blur: boolean): Variants => ({
  hidden: {
    opacity: 0,
    y: 22,
    filter: blur ? "blur(12px)" : "blur(0px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1], // expo.out — la courbe Awwwards
    },
  },
});

export function TextRevealWords({
  children,
  className,
  as = "span",
  delay = 0,
  stagger = 0.04,
  startOnView = false,
  blur = true,
}: TextRevealWordsProps) {
  const prefersReduced = useReducedMotion();
  const words = children.split(/(\s+)/); // preserve les espaces
  const variants = wordVariants(blur);

  if (prefersReduced) {
    // Rendu statique pour accessibilite
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={cn("inline-block", className)}
      variants={containerVariants}
      custom={{ stagger, delay }}
      initial="hidden"
      animate={startOnView ? undefined : "visible"}
      whileInView={startOnView ? "visible" : undefined}
      viewport={startOnView ? { once: true, margin: "-15% 0px" } : undefined}
      aria-label={children}
    >
      {words.map((word, i) =>
        /^\s+$/.test(word) ? (
          <span key={i} aria-hidden="true">
            {word}
          </span>
        ) : (
          <motion.span
            key={i}
            variants={variants}
            className="inline-block will-change-transform"
            aria-hidden="true"
          >
            {word}
          </motion.span>
        ),
      )}
    </MotionTag>
  );
}
