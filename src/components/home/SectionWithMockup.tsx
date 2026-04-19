import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionWithMockupProps {
  badge: string;
  title: ReactNode;
  description: ReactNode;
  ctaLabel: string;
  ctaHref: string;
  primaryImageSrc?: string;
  secondaryImageSrc: string;
  primaryNode?: ReactNode;
  reverseLayout?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const primaryImgVariants: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: {
    opacity: 1,
    y: 30,
    transition: { duration: 1.2, ease: "easeOut", delay: 0.1 },
  },
};

const secondaryImgVariants: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: {
    opacity: 0.7,
    y: -20,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

export function SectionWithMockup({
  badge,
  title,
  description,
  ctaLabel,
  ctaHref,
  primaryImageSrc,
  secondaryImageSrc,
  primaryNode,
  reverseLayout = false,
}: SectionWithMockupProps) {
  return (
    <section className="relative py-24 md:py-40 bg-background overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="container-site grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center"
      >
        {/* Text */}
        <motion.div
          variants={textVariants}
          className={cn(
            "flex flex-col gap-6",
            reverseLayout && "md:col-start-2 md:row-start-1",
          )}
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            {badge}
          </span>
          <h2 className="font-serif text-4xl md:text-[2.75rem] font-semibold leading-tight text-balance text-foreground">
            {title}
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-md">
            {description}
          </p>
          <a
            href={ctaHref}
            className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>

        {/* Images */}
        <div
          className={cn(
            "relative mx-auto w-full max-w-[480px] h-[440px] md:h-[640px]",
            reverseLayout && "md:col-start-1 md:row-start-1",
          )}
        >
          <motion.div
            variants={secondaryImgVariants}
            className="absolute top-0 left-0 w-[300px] h-[320px] md:w-[460px] md:h-[500px] rounded-card overflow-hidden bg-cover bg-center blur-[2px] z-0"
            style={{ backgroundImage: `url(${secondaryImageSrc})` }}
            aria-hidden
          />
          <motion.div
            variants={primaryImgVariants}
            className="relative w-full rounded-card overflow-hidden z-10 mt-12 md:mt-20 ml-6 md:ml-10"
          >
            {primaryNode ? (
              primaryNode
            ) : (
              <div
                className="w-full h-[400px] md:h-[600px] rounded-card overflow-hidden border border-border bg-card backdrop-blur-[15px] bg-cover bg-center"
                style={{ backgroundImage: `url(${primaryImageSrc})` }}
                aria-hidden
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.2), transparent 70%)",
        }}
      />
    </section>
  );
}

export default SectionWithMockup;
