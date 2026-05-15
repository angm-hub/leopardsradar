import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/ButtonPrimitive";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { LRWordmark, LRMark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/utils";

const NAV_LINKS: Array<{ label: string; href: string; badge?: string }> = [
  { label: "Roster", href: "/roster" },
  { label: "Radar", href: "/radar" },
  { label: "Best XI", href: "/best-xi" },
  { label: "Revue de presse", href: "/revue-de-presse", badge: "NOUVEAU" },
  { label: "Histoires", href: "/histoires" },
  { label: "Ma Liste", href: "/ma-liste" },
  { label: "À propos", href: "/a-propos" },
  // "Newsletter" retiré du nav — bouton sticky "S'ABONNER" + section
  // dédiée sur la home sont déjà 2 entrées vers le même tunnel.
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      style={{ top: "var(--promo-banner-h, 0px)" }}
      className={cn(
        "fixed inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-lg border-b border-border"
          : "bg-background/60 backdrop-blur-md border-b border-transparent",
      )}
    >
      <div className="container-site flex h-16 items-center justify-between">
        <Link
          to="/"
          aria-label="Léopards Radar — Accueil"
          className="text-foreground transition-opacity hover:opacity-90"
        >
          {/* Mobile : mark seul (gain horizontal). Desktop : lockup complet. */}
          <span className="sm:hidden">
            <LRMark size={28} color="currentColor" ariaLabel="Léopards Radar" />
          </span>
          <span className="hidden sm:inline-flex">
            <LRWordmark size={20} color="currentColor" />
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "relative inline-flex items-center gap-1.5 text-sm transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-foreground/70",
                )
              }
            >
              {link.label}
              {link.badge ? (
                <span className="rounded-sm bg-primary text-primary-foreground px-1.5 py-px text-[9px] font-bold uppercase tracking-wider leading-none">
                  {link.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Ouvrir la recherche (⌘K)"
            className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border-hover transition-colors"
          >
            <span aria-hidden>⌘</span>
            <span>K</span>
          </button>
          <Link
            to="/newsletter"
            className="inline-flex items-center gap-1.5 rounded-button border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em] text-primary hover:bg-primary/10 transition-colors"
          >
            S'abonner
          </Link>
        </div>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="md:hidden text-foreground p-2 -mr-2"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-72 max-w-[80%] bg-card border-l border-border",
            "flex flex-col p-6 gap-8 transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <LRWordmark size={16} color="currentColor" />
            <button
              type="button"
              aria-label="Fermer le menu"
              className="text-foreground p-1"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-base text-foreground/85 hover:text-foreground transition-colors"
              >
                {link.label}
                {link.badge ? (
                  <span className="rounded-sm bg-primary text-primary-foreground px-1.5 py-px text-[9px] font-bold uppercase tracking-wider leading-none">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <Link
            to="/newsletter"
            onClick={() => setOpen(false)}
            className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-button border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-mono uppercase tracking-[0.15em] text-primary"
          >
            S'abonner
          </Link>
        </aside>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

export default Navbar;
