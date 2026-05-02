import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Roster", href: "/roster" },
  { label: "Radar", href: "/radar" },
  { label: "Best XI", href: "/best-xi" },
  { label: "Histoires", href: "/histoires" },
  { label: "Ma Liste", href: "/ma-liste" },
];

const METHOD_LINKS = [
  { label: "À propos", href: "/a-propos" },
  { label: "Newsletter", href: "/newsletter" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
];

// Last data update timestamp. Bump when the dataset is refreshed.
const LAST_UPDATED = "Dimanche 19 avril 2026";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16 md:py-20">
      <div className="container-site">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Col 1 — brand + last update signal (lg:col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <span className="font-serif uppercase text-lg tracking-[0.08em] text-foreground">
              Léopards Radar
            </span>
            <p className="text-sm text-muted-light max-w-xs leading-relaxed">
              Le radar éditorial des Léopards. Roster RDC + diaspora éligible —
              suivi, sourcé, mis à jour chaque dimanche.
            </p>
            <div className="mt-2 flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span>Dernière mise à jour · {LAST_UPDATED}</span>
            </div>
          </div>

          {/* Col 2 — Sections principales */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Sections</h3>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-light hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Méthodologie / À propos */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Méthode</h3>
            <ul className="flex flex-col gap-3">
              {METHOD_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-light hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:contact@leopardsradar.com?subject=Donnée à corriger"
                  className="text-sm text-muted-light hover:text-foreground transition-colors"
                >
                  Signaler une erreur
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@leopardsradar.com?subject=Source / piste"
                  className="text-sm text-muted-light hover:text-foreground transition-colors"
                >
                  Proposer une source
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4 — Légal + Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Légal</h3>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-light hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="mailto:contact@leopardsradar.com"
              className="mt-3 text-sm text-foreground hover:text-primary transition-colors break-all"
            >
              contact@leopardsradar.com
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © 2026 Léopards Radar. Construit avec passion depuis Paris.
          </p>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted">
            Édition continue · v1
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
