import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "promo_banner_liste26_dismissed_2026_04_21";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

export function PromoBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  // Hide on /ma-liste
  const onMaListe = location.pathname.startsWith("/ma-liste");

  useEffect(() => {
    if (onMaListe) {
      setVisible(false);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS) {
          setVisible(false);
          return;
        }
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [onMaListe]);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="promo-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="banner"
          aria-label="Promotion Mondial 2026"
          className="relative z-[60] overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #00A651 0%, #007a37 55%, #004d25 100%)",
          }}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 md:py-3 lg:px-8">
            {/* Left: Pill + title + sub */}
            <div className="flex flex-1 flex-col gap-1.5 pr-10 md:flex-row md:items-center md:gap-5 md:pr-0">
              <div className="flex flex-col gap-1.5 md:flex-1">
                <span
                  className="inline-flex w-fit items-center rounded-full bg-[#FFC107] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black md:text-[11px]"
                >
                  Mondial 2026
                </span>
                <p className="font-serif text-base leading-tight text-white md:text-lg lg:text-xl">
                  Compose ta liste des 26 Léopards.
                </p>
                <p className="hidden text-[12px] leading-snug text-white/80 md:block lg:text-[13px]">
                  2 min. Partage aux copains. Compare aux autres fans.
                </p>
              </div>

              {/* CTA */}
              <Link
                to="/ma-liste"
                onClick={() => {
                  // Optional dismiss-on-click so it does not reappear after returning
                  try {
                    localStorage.setItem(STORAGE_KEY, String(Date.now()));
                  } catch {
                    /* ignore */
                  }
                }}
                className="group inline-flex w-full items-center justify-center md:w-auto"
              >
                <motion.span
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 2.4,
                    ease: "easeInOut",
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-black shadow-md transition-colors hover:bg-[#FFD54F] md:w-auto md:px-6"
                >
                  Composer ma liste
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </motion.span>
              </Link>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer la bannière"
              className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white md:relative md:right-0 md:top-0 md:h-9 md:w-9"
            >
              <X className="h-4 w-4 md:h-4 md:w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PromoBanner;
