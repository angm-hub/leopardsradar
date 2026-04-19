import { motion } from "framer-motion";
import { ReactNode } from "react";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";

interface EditorialSeparatorProps {
  variant: "quote" | "bignumber" | "headline";
  content: string | ReactNode;
  author?: string;
  context?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const EditorialSeparator = ({ variant, content, author, context }: EditorialSeparatorProps) => {
  if (variant === "quote") {
    return (
      <section className="relative py-24 md:py-32 bg-background overflow-hidden">
        <StrongGradient intensity={0.9} position="center" />
        <motion.div {...fadeUp} className="max-w-4xl mx-auto px-6 text-center relative">
          <span
            aria-hidden
            className="block font-serif text-[12rem] md:text-[16rem] leading-none text-primary/20 select-none -mb-16 md:-mb-24"
          >
            “
          </span>
          <blockquote className="font-serif italic text-3xl md:text-5xl leading-tight text-balance text-foreground">
            {content}
          </blockquote>
          {(author || context) && (
            <div className="mt-10 flex flex-col items-center gap-1">
              {author && (
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  {author}
                </div>
              )}
              {context && (
                <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
                  {context}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  if (variant === "bignumber") {
    return (
      <section className="relative py-24 md:py-32 bg-background overflow-hidden">
        <StrongGradient intensity={1} position="center" />
        <motion.div {...fadeUp} className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="font-mono text-[8rem] md:text-[16rem] leading-none font-bold text-primary tracking-tighter">
            {content}
          </div>
          {context && (
            <div className="mt-8 font-serif text-xl md:text-2xl text-foreground/80 text-balance max-w-2xl mx-auto">
              {context}
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  // headline
  return (
    <section className="py-40 bg-card">
      <motion.div {...fadeUp} className="max-w-5xl mx-auto px-6">
        <h2 className="font-serif text-5xl md:text-7xl font-semibold text-balance leading-[1.1] text-foreground">
          {content}
        </h2>
        {context && (
          <p className="mt-8 text-muted-foreground text-lg max-w-2xl">{context}</p>
        )}
      </motion.div>
    </section>
  );
};

export default EditorialSeparator;
