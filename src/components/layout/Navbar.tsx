import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/ButtonPrimitive";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Roster", href: "/roster" },
  { label: "Radar", href: "/radar" },
  { label: "Best XI", href: "/best-xi" },
  { label: "À propos", href: "/about" },
  { label: "Newsletter", href: "/newsletter" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-lg border-b border-border"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-site flex h-16 items-center justify-between">
        <Link
          to="/"
          className="font-serif uppercase text-lg tracking-[0.08em] text-foreground"
        >
          Léopards Radar
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "text-sm transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-foreground/70",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link to="/newsletter">
            <Button variant="primary" size="sm">
              S'abonner
            </Button>
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
            <span className="font-serif uppercase text-base tracking-[0.08em] text-foreground">
              Menu
            </span>
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
                className="text-base text-foreground/85 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link to="/newsletter" onClick={() => setOpen(false)} className="mt-auto">
            <Button variant="primary" size="md" className="w-full">
              S'abonner
            </Button>
          </Link>
        </aside>
      </div>
    </header>
  );
}

export default Navbar;
