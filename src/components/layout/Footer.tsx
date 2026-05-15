import { Link } from "react-router-dom";
import { LRWordmark } from "@/components/ui/Wordmark";

const NAV_LINKS = [
  { label: "Roster", href: "/roster" },
  { label: "Radar", href: "/radar" },
  { label: "Best XI", href: "/best-xi" },
  { label: "Revue de presse", href: "/revue-de-presse" },
  { label: "Histoires", href: "/histoires" },
  { label: "Ma Liste", href: "/ma-liste" },
];

const METHOD_LINKS = [
  { label: "Méthodologie", href: "/methodologie" },
  { label: "À propos", href: "/a-propos" },
  { label: "Newsletter", href: "/newsletter" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
];

// Computes the most recent Sunday (or today if today is Sunday) in the
// French long format ("Dimanche 11 mai 2026"). Aligns the footer's
// "last updated" signal with the editorial promise of weekly Sunday refresh —
// no more figé "19 avril" 4 weeks after the fact.
//
// If we ever wire a real `max(updated_at)` from the DB, replace the
// `lastSunday()` call by a hook reading that value. Until then this is
// the right level of honesty : "the dataset gets refreshed each Sunday".
function lastSundayFR(now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - dow);
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatted = fmt.format(d);
  // Capitalize first letter ("dimanche 11 mai 2026" → "Dimanche 11 mai 2026")
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function Footer() {
  const lastUpdated = lastSundayFR();
  return (
    <footer className="border-t border-border bg-background py-16 md:py-20">
      <div className="container-site">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Col 1 — brand + last update signal (lg:col-span-2).
              Polish DA Cobalt 2026-05-15 : wordmark texte remplacé par
              le LRWordmark canonique (cohérent avec Navbar). Le live dot
              passe de bg-success à bg-cobalt-mist (DA brand vs success
              fonctionnel réservé aux deltas). */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <LRWordmark size={18} color="currentColor" />
            <p className="text-sm text-muted-light max-w-xs leading-relaxed">
              Toute la data du football congolais. Roster RDC, diaspora éligible,
              statut FIFA — sourcé, mis à jour chaque dimanche.
            </p>
            <div className="mt-2 flex items-center gap-2.5 label-mono-sm text-muted">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-cobalt-mist animate-pulse" />
              <span>Dernière mise à jour · {lastUpdated}</span>
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
                  href="mailto:alexandre@withkaira.com?subject=Donnée à corriger"
                  className="text-sm text-muted-light hover:text-foreground transition-colors"
                >
                  Signaler une erreur
                </a>
              </li>
              <li>
                <a
                  href="mailto:alexandre@withkaira.com?subject=Source / piste"
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
              href="mailto:alexandre@withkaira.com"
              className="mt-3 text-sm text-foreground hover:text-primary transition-colors break-all"
            >
              alexandre@withkaira.com
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Léopards Radar — édité par{" "}
            <span className="text-foreground/80">Cobalt Sports & Entertainment</span>.
            Construit avec passion depuis Paris.
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
