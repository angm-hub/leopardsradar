import { Twitter, Instagram, Music2 } from "lucide-react";

const NAV_LINKS = [
  { label: "Roster", href: "#roster" },
  { label: "Radar", href: "#radar" },
  { label: "Best XI", href: "#best-xi" },
  { label: "Newsletter", href: "#newsletter" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "#mentions" },
  { label: "RGPD", href: "#rgpd" },
  { label: "CGU", href: "#cgu" },
];

const SOCIALS = [
  { label: "X (Twitter)", href: "https://x.com", Icon: Twitter },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com", Icon: Music2 },
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
            <div className="flex items-center gap-3 mt-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border text-muted-light hover:text-foreground hover:border-border-hover transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Navigation */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">Navigation</h3>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-light hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
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
                  <a
                    href={link.href}
                    className="text-sm text-muted-light hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
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
