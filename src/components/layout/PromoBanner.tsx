import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMondialCountdown } from "@/hooks/useMondialCountdown";

// Bumped after audit day 1 — copy changed (J-N + 11 juin) so previous
// dismissals shouldn't suppress the new banner.
const STORAGE_KEY = "promo_banner_mondial_dismissed_2026_05_03";
// 24h was too short — users dismissed the banner thinking it would stay
// down for at least a few days. 7 days is the standard "respect" window
// for promotional bars (Linear, Stripe). Re-surface after a week so users
// who actually want to act on the Mondial countdown still get reminded.
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Slim announcement bar (Vercel/Linear pattern).
 *
 * One line, ~40px tall. Whole row is clickable to /ma-liste.
 * Dismissible. Hidden on /ma-liste (where the same CTA is the page itself).
 *
 * No duplicate CTA button : the hero and the navbar already carry the action.
 */
export function PromoBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { daysUntilKickoff, kickoffDateLabel, phase } = useMondialCountdown();

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

  // Expose banner height as a CSS var so the Navbar can offset itself.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const setVar = () => {
      const h = visible && ref.current ? ref.current.offsetHeight : 0;
      root.style.setProperty("--promo-banner-h", `${h}px`);
    };
    setVar();
    if (!visible) return;
    const ro = new ResizeObserver(setVar);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--promo-banner-h", "0px");
    };
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const handleClickThrough = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence
      initial={false}
      onExitComplete={() => {
        document.documentElement.style.setProperty("--promo-banner-h", "0px");
      }}
    >
      {visible && (
        <motion.div
          key="promo-banner"
          ref={ref}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="banner"
          aria-label="Promotion Mondial 2026"
          className="fixed top-0 inset-x-0 z-[70] overflow-hidden border-b border-cobalt-500/30"
          style={{
            // Pivot DA Cobalt : gradient cobalt 700 → 900 → void deep
            // (drapeau RDC désaturé). Avant : vert RDC saturé qui faisait
            // tâche vs le reste du site cobalt cinéma.
            background:
              "linear-gradient(90deg, #1A3A78 0%, #0E1F44 60%, #050B1A 100%)",
          }}
        >
          <Link
            to="/ma-liste"
            onClick={handleClickThrough}
            className="group relative block"
          >
            <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center lg:px-8">
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
                {phase === "before" ? `J-${daysUntilKickoff}` : phase === "during" ? "EN COURS" : "MONDIAL"}
              </span>
              <p className="truncate text-[12px] leading-snug text-white md:text-[13px]">
                {phase === "before" ? (
                  <>
                    <span className="font-medium">
                      Mondial 2026 — coup d'envoi le {kickoffDateLabel}.
                    </span>
                    <span className="ml-2 hidden text-white/80 sm:inline">
                      Compose ta liste des 26.
                    </span>
                  </>
                ) : phase === "during" ? (
                  <span className="font-medium">
                    Léopards au Mondial 2026 — suis-les en direct.
                  </span>
                ) : (
                  <span className="font-medium">
                    Mondial 2026 terminé — bilan et héritage.
                  </span>
                )}
                <span
                  aria-hidden
                  className="ml-2 inline-block translate-x-0 text-white/80 transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer la bannière"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PromoBanner;
