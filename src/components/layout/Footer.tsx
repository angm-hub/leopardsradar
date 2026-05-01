import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Roster", href: "/roster" },
  { label: "Radar", href: "/radar" },
  { label: "Best XI", href: "/best-xi" },
  { label: "Newsletter", href: "/#newsletter" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-20">
      <div className="container-site">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Col 1 — brand */}
          <div className="flex flex-col gap-5">
            <span className="font-serif uppercase text-lg tracking-[0.08em] text-foreground">
              Léopards Radar
            </span>
            <p className="text-sm text-muted-light max-w-xs leading-relaxed">
              Les yeux sur tous les Léopards.
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Navigation</h3>
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

          {/* Col 3 — Legal */}
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
          </div>

          {/* Col 4 — Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Contact</h3>
            <a
              href="mailto:contact@leopardsradar.com"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              contact@leopardsradar.com
            </a>
            <p className="text-sm text-muted-light leading-relaxed">
              Tu es journaliste ou scout ? Écris-nous.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-8 mt-12">
          <p className="text-center text-sm text-muted">
            © 2026 Léopards Radar. Construit avec passion depuis Paris.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
