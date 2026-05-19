/**
 * SmoothScroll — Wrapper Lenis global pour un scroll "buttery" type ORA / Awwwards.
 *
 * Initialise Lenis avec une lerp douce (0.1) et un wheelMultiplier reduit (0.9)
 * pour eviter la sensation "swooshy" qui devient vite gimmicky. RAF gere par
 * requestAnimationFrame natif (pas de dependance circular).
 *
 * Auto-disable :
 *  - prefers-reduced-motion (accessibilite, obligatoire)
 *  - viewport tactile (mobile/tablet : le scroll natif est plus fluide la-bas)
 *
 * A wrapper dans App.tsx au-dessus de <BrowserRouter>.
 */
import { useEffect } from "react";
import Lenis from "lenis";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    // Skip mobile + reduced-motion : scroll natif >>> lenis sur ces contextes
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (reduceMotion || isTouch) return;

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      // touchMultiplier desactive de toute facon par hover:none au-dessus
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
