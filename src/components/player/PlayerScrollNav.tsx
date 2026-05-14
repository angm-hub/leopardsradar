import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky anchor nav fixée à gauche de la fiche joueur.
 * Pattern inspiré du ScrollLegend (21st.dev) mais réécrit dans la DA Léopards.
 *
 * Comportement :
 *  - Une ligne horizontale par section : courte au repos, plus longue + verte
 *    sur la section active. Le label ne s'affiche qu'au hover de la nav (le
 *    composant garde ses ~40 px de gauche en permanence sans bruit visuel).
 *  - L'IntersectionObserver détecte la section visible plutôt que de se baser
 *    sur scrollY > offsetTop (plus fiable avec les marges variables).
 *  - Cachée sous lg (sur mobile/tablette le scroll suffit, pas la place).
 *  - Hidden si reduce-motion, no-pointer ou si le visiteur a déjà scrollé sous
 *    la 4e section (la nav devient redondante avec le footer proche).
 */
interface PlayerScrollNavItem {
  /** id de la section dans le DOM — doit matcher un id="..." côté Player.tsx */
  id: string;
  /** Label court — affiché uniquement au hover */
  label: string;
}

interface PlayerScrollNavProps {
  items: PlayerScrollNavItem[];
}

export function PlayerScrollNav({ items }: PlayerScrollNavProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    // Threshold faible pour détecter dès qu'une section entre dans le viewport
    // par le haut. rootMargin négatif en haut pour que la section "active" soit
    // celle qu'on est vraiment en train de lire, pas celle qui pointe le bout
    // du nez.
    const observer = new IntersectionObserver(
      (entries) => {
        // On sélectionne la première section visible dans l'ordre du DOM
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // 96 px d'offset pour passer sous la navbar fixe (h-16) + le promo-banner
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Sections de la fiche joueur"
      className={cn(
        "fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ul className="flex flex-col gap-3.5">
        {items.map((it) => {
          const isActive = activeId === it.id;
          return (
            <li key={it.id} className="group relative">
              <button
                type="button"
                onClick={() => scrollTo(it.id)}
                aria-label={`Aller à la section ${it.label}`}
                aria-current={isActive ? "true" : undefined}
                className="flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-px transition-all duration-300 ease-out",
                    isActive
                      ? "w-8 bg-primary"
                      : "w-4 bg-muted/60 group-hover:w-6 group-hover:bg-foreground/70",
                  )}
                />
                <span
                  className={cn(
                    "ml-3 text-[11px] font-mono uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-light",
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-1 pointer-events-none",
                  )}
                >
                  {it.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default PlayerScrollNav;
