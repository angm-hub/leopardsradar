import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  flagFor,
  nationalityFr,
  formatMarketValueCompact,
} from "@/lib/playerHelpers";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

/**
 * RosterCardFC — carte joueur inspirée des cartes de jeu (FUT / FC26),
 * repensée pour une UX SaaS : lisibilité instantanée, DA cobalt sobre,
 * accessible, pas d'effet criard.
 *
 * Anatomie (lecture en 0,5 s, façon carte de jeu) :
 *   - haut-gauche : cluster NOTE (indice Léopards) + code de poste + tier,
 *   - haut-droit  : drapeaux nationalité,
 *   - héro        : photo plein cadre,
 *   - bas         : club, nom, et un strip de 3 stats (G+A · Sél · Valeur).
 *
 * Le cadre encode le tier (rareté) : tier 1 = liseré or + halo discret,
 * tier 2 = liseré cobalt, sinon neutre. Jamais de holographie clinquante —
 * l'intensité sert la hiérarchie, pas le bruit.
 */

const POS_CODE: Record<DBPosition, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Attack: "ATT",
};

function TierFrame(tier: DBPlayer["tier"]): string {
  if (tier === "tier1")
    return "border-primary/45 shadow-[0_0_0_0.5px_rgba(245,197,24,0.22),0_16px_40px_-18px_rgba(245,197,24,0.20)]";
  if (tier === "tier2") return "border-cobalt-500/40";
  return "border-border";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-sm font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
    </div>
  );
}

export function RosterCardFC({ player }: { player: DBPlayer }) {
  const rating = player.score_leopards ?? player.level_score ?? null;
  const ratingShown = rating != null ? Math.round(rating) : null;
  const pos = player.position;
  const posCode = pos ? POS_CODE[pos] : null;

  const ga = (player.season_goals ?? 0) + (player.season_assists ?? 0);
  const caps = player.caps_rdc ?? 0;
  const value =
    player.market_value_eur && player.market_value_eur > 0
      ? formatMarketValueCompact(player.market_value_eur)
      : "—";

  const tierLabel =
    player.tier === "tier1" ? "Tier 1" : player.tier === "tier2" ? "Tier 2" : null;

  // L'indice Léopards est un percentile réel (0-100) : la moitié du roster est
  // sous 40. Plutôt que d'afficher un « 7 » géant qui lit « note pourrie », on
  // encode la valeur en couleur — les tops poppent en or, les moyens restent
  // neutres, les bas restent discrets. Honnête (vrai chiffre) et hiérarchisé.
  const ratingClass =
    ratingShown == null
      ? ""
      : ratingShown >= 70
        ? "text-primary"
        : ratingShown >= 45
          ? "text-foreground"
          : "text-foreground/55";

  return (
    <Link
      to={`/player/${player.slug}`}
      className={cn(
        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-[16px] border bg-card transition-all duration-300",
        TierFrame(player.tier),
        "hover:-translate-y-0.5 hover:border-primary/60",
        "hover:shadow-[0_0_0_0.5px_rgba(245,197,24,0.40),0_22px_50px_-20px_rgba(245,197,24,0.28)]",
      )}
    >
      <PlayerAvatar
        name={player.name}
        src={player.image_url}
        srcAlt={player.image_url_alt}
        className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        initialsClassName="text-6xl"
      />

      {/* Scrims : lisibilité du cluster haut et du bloc bas sur photo chargée. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-background/75 via-background/25 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-background via-background/85 to-transparent"
      />

      {/* Cluster note + poste + tier (signature carte de jeu) */}
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start leading-none">
        {ratingShown != null ? (
          <span
            title="Indice Léopards (percentile par poste)"
            className={cn(
              "font-serif text-3xl font-semibold tabular-nums md:text-4xl",
              ratingClass,
            )}
          >
            {ratingShown}
          </span>
        ) : posCode ? (
          <span className="font-serif text-2xl font-semibold text-foreground/70">
            {posCode}
          </span>
        ) : null}
        {posCode ? (
          <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {posCode}
          </span>
        ) : null}
        {tierLabel ? (
          <span className="mt-1.5 rounded-sm bg-primary/15 px-1 py-px font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-primary/90">
            {tierLabel}
          </span>
        ) : null}
      </div>

      {/* Drapeaux */}
      {player.nationalities.length > 0 ? (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-full border border-border/40 bg-background/45 px-1.5 py-1 backdrop-blur-md">
          {player.nationalities.slice(0, 3).map((n) => (
            <span key={n} className="text-sm leading-none" title={nationalityFr(n)}>
              {flagFor(n)}
            </span>
          ))}
        </div>
      ) : null}

      {/* Bloc bas : club, nom, face-stats */}
      <div className="relative z-10 mt-auto p-3.5">
        {player.current_club ? (
          <p className="truncate text-[11px] text-foreground/60">
            {player.current_club}
          </p>
        ) : null}
        <h3 className="mt-0.5 line-clamp-2 font-serif text-base font-semibold leading-tight text-foreground md:text-lg">
          {player.name}
        </h3>
        <div className="mt-2 grid grid-cols-3 gap-1 border-t border-white/[0.06] pt-2">
          <Stat value={String(ga)} label="G+A" />
          <Stat value={String(caps)} label="Sél" />
          <Stat value={value} label="Valeur" />
        </div>
      </div>
    </Link>
  );
}

export default RosterCardFC;
