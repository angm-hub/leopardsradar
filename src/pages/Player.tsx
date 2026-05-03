import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Twitter,
  MessageCircle,
  Link2,
  Check,
  ListPlus,
  ArrowRightLeft,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { StatBlock } from "@/components/ui/StatBlock";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  PlayerEligibilityQuote,
  buildPlayerEligibilityLine,
} from "@/components/player/PlayerWhySection";
import { PlayerIdentityCards } from "@/components/player/PlayerIdentityCards";
import { PlayerCareerCard } from "@/components/player/PlayerCareerCard";
import { PlayerStatProfile } from "@/components/player/PlayerStatProfile";
import { RelatedPlayers } from "@/components/player/RelatedPlayers";
import { usePlayer } from "@/hooks/usePlayer";
import { useDominantColor } from "@/hooks/useDominantColor";
import { cn } from "@/lib/utils";
import {
  POSITION_LABEL,
  POSITION_BADGE,
  POSITION_DOT,
  flagFor,
  formatMarketValue,
  ELIGIBILITY_BADGE,
  eligibilityLabel,
} from "@/lib/playerHelpers";

const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
        <h1 className="font-serif text-5xl text-foreground">Joueur introuvable.</h1>
        <p className="mt-4 text-muted">Ce profil n'existe pas (encore).</p>
        <Link to="/roster" className="mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-hover">
          <ArrowLeft className="h-4 w-4" /> Retour au Roster
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site pt-32 pb-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          <div
            className="aspect-[3/4] w-full rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer md:col-span-2"
            style={{ backgroundSize: "200% 100%" }}
          />
          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="h-16 w-3/4 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
            <div className="h-6 w-1/2 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { player, loading } = usePlayer(slug);
  const [copied, setCopied] = useState(false);

  const dominant = useDominantColor(player?.image_url ?? undefined);
  const [r, g, b] = dominant ?? [60, 60, 70];
  const heroGradient = `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.42) 0%, rgba(${r}, ${g}, ${b}, 0.18) 45%, #0A0A0B 100%)`;
  const photoShadow = dominant
    ? `0 20px 80px rgba(${r}, ${g}, ${b}, 0.35), 0 8px 24px rgba(0,0,0,0.5)`
    : `0 20px 80px rgba(0,0,0,0.5)`;

  if (loading) return <PlayerSkeleton />;
  if (!player) return <NotFound />;

  const isRoster = player.player_category === "roster";
  const rootHref = isRoster ? "/roster" : "/radar";
  const rootLabel = isRoster ? "Roster" : "Radar";

  const categoryKicker =
    player.player_category === "roster"
      ? "Roster · Sélection"
      : player.player_category === "heritage"
        ? "Héritage RDC"
        : `Radar · ${player.tier === "tier1" ? "Tier 1" : player.tier === "tier2" ? "Tier 2" : "Tier libre"}`;

  const seasonEmpty =
    !player.season_games &&
    !player.season_goals &&
    !player.season_assists &&
    !player.season_minutes &&
    !player.season_rating;

  const handleShare = (channel: "twitter" | "whatsapp" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${player.name} — ${player.current_club ?? "profil RDC"} sur Léopards Radar`;
    if (channel === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else if (channel === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else if (channel === "copy") {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-background">
          <motion.div
            key={dominant ? `${r}-${g}-${b}` : "fallback"}
            aria-hidden
            className="absolute inset-0"
            style={{ background: heroGradient }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: `url("${NOISE_SVG}")`, opacity: 0.03 }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"
          />

          <div className="container-site relative z-10 pt-28 pb-20">
            <nav className="mb-8 text-sm text-muted">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2 opacity-50">/</span>
              <Link to={rootHref} className="hover:text-foreground">{rootLabel}</Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-foreground/80">{player.name}</span>
            </nav>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
              {/* LEFT — photo */}
              <div className="md:col-span-2">
                <PlayerAvatar
                  name={player.name}
                  src={player.image_url}
                  className="aspect-[3/4] w-full rounded-card transition-shadow duration-700"
                  initialsClassName="text-9xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none -mt-[100%] aspect-[3/4] w-full rounded-card"
                  style={{ boxShadow: photoShadow }}
                />
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-6 md:col-span-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
                  {categoryKicker}
                </p>
                <h1 className="-mt-3 font-serif text-5xl md:text-7xl font-semibold leading-[1.05] text-balance text-foreground">
                  {player.name}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {player.position ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs uppercase tracking-wider",
                        POSITION_BADGE[player.position],
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[player.position])}
                      />
                      {POSITION_LABEL[player.position]}
                    </span>
                  ) : null}
                  {player.foot ? (
                    <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm">
                      Pied {player.foot === "left" ? "gauche" : player.foot === "right" ? "droit" : "ambidextre"}
                    </span>
                  ) : null}
                  {player.age ? (
                    <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm">
                      {player.age} ans
                    </span>
                  ) : null}
                  {player.height_cm ? (
                    <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm">
                      {player.height_cm} cm
                    </span>
                  ) : null}
                </div>

                {player.current_club ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-semibold text-foreground">{player.current_club}</span>
                    {player.contract_expires ? (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-sm text-muted">
                          Contrat jusqu'en {new Date(player.contract_expires).getFullYear()}
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {player.nationalities.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {player.nationalities.map((nat) => (
                      <span key={nat} className="inline-flex items-center gap-1.5 text-sm text-muted-light">
                        <span className="text-2xl leading-none">{flagFor(nat)}</span>
                        {nat}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Hero stats — 3 hard numbers in the fold so the visitor
                    sees the substance before scrolling. */}
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-border bg-border">
                  <FoldStat
                    label="Caps RDC"
                    value={player.caps_rdc ?? 0}
                  />
                  <FoldStat
                    label="Valeur marché"
                    value={formatMarketValue(player.market_value_eur)}
                    muted={!player.market_value_eur}
                  />
                  <FoldStat
                    label="Buts saison"
                    value={player.season_goals ?? "—"}
                    muted={!player.season_goals}
                  />
                </div>

                {/* Editorial pull quote — moved up from below the hero so
                    the "why this player" answer is visible in the fold. */}
                <PlayerEligibilityQuote
                  text={buildPlayerEligibilityLine({
                    eligibilityNote: player.eligibility_note,
                    eligibilityStatus: player.eligibility_status,
                    category: player.player_category,
                    capsRdc: player.caps_rdc,
                  })}
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to="/ma-liste">
                    <Button size="sm">
                      <ListPlus className="h-4 w-4" /> Ajouter à ma liste
                    </Button>
                  </Link>
                  <Link to={`/compare?p1=${player.slug}`}>
                    <Button variant="outline" size="sm" type="button">
                      <ArrowRightLeft className="h-4 w-4" /> Comparer
                    </Button>
                  </Link>
                  {player.transfermarkt_id ? (
                    <a
                      href={`https://www.transfermarkt.com/profil/spieler/${player.transfermarkt_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" type="button">
                        <ExternalLink className="h-4 w-4" /> Transfermarkt
                      </Button>
                    </a>
                  ) : null}
                  <span className="mx-1 hidden sm:inline-block self-center h-5 w-px bg-border" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("twitter")}
                    aria-label="Partager sur Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("whatsapp")}
                    aria-label="Partager sur WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("copy")}
                    aria-label="Copier le lien"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROFIL STATISTIQUE — hexagon 6 axes (4 universels + 2 par poste) */}
        <PlayerStatProfile player={player} />

        {/* IDENTITÉ + CARRIÈRE — pull quote retirée, remontée dans le fold */}
        <section className="container-site py-12 border-t border-border">
          <h2 className="font-serif text-3xl text-foreground mb-6">Identité.</h2>
          <PlayerIdentityCards
            dateOfBirth={player.date_of_birth}
            placeOfBirth={player.place_of_birth}
            countryOfBirth={player.country_of_birth}
            foot={player.foot}
            heightCm={player.height_cm}
          />
          <div className="mt-6">
            <PlayerCareerCard
              currentClub={player.current_club}
              contractExpires={player.contract_expires}
              agent={player.agent}
              onLoanFrom={player.on_loan_from}
            />
          </div>
        </section>

        {/* SÉLECTION RDC (note retirée — remontée dans PlayerWhySection) */}
        <section className="container-site py-12 border-t border-border">
          <h2 className="font-serif text-3xl text-foreground">En sélection RDC.</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="rounded-card border border-border bg-card p-6 md:p-8">
              <StatBlock label="Sélections (caps)" value={player.caps_rdc} />
            </div>
            <div className="rounded-card border border-border bg-card p-6 md:p-8 md:col-span-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted font-mono">
                Statut d'éligibilité
              </span>
              <div className="mt-2.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider",
                    ELIGIBILITY_BADGE[player.eligibility_status ?? "unknown"] ??
                      ELIGIBILITY_BADGE.unknown,
                  )}
                >
                  {eligibilityLabel(player.eligibility_status)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SAISON */}
        <section className="container-site py-12 border-t border-border">
          <h2 className="font-serif text-3xl text-foreground">
            Saison 2025/26 — Club.
          </h2>
          {seasonEmpty ? (
            <div className="mt-6 rounded-card border border-dashed border-border bg-card/30 p-8 text-center">
              <p className="text-muted-light text-sm">
                Statistiques de saison non encore disponibles pour ce profil.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Matchs", value: player.season_games },
                { label: "Buts", value: player.season_goals },
                { label: "Passes décisives", value: player.season_assists },
                {
                  label: "Note moyenne",
                  value: player.season_rating
                    ? player.season_rating.toFixed(2)
                    : "—",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-card border border-border bg-card p-6 md:p-8"
                >
                  <StatBlock label={s.label} value={s.value} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* E — PLUS DE LÉOPARDS : 4 joueurs du même poste */}
        <RelatedPlayers
          position={player.position}
          excludeSlug={player.slug}
        />

        <div className="container-site py-12">
          <Link
            to={rootHref}
            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au {rootLabel}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Inline mini-stat used in the player fold. 3 hard numbers side-by-side
 * give the visitor immediate substance. Uses a 1px-gap grid trick to draw
 * dividers without extra borders.
 */
function FoldStat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div className="bg-card px-3 py-3 sm:px-4">
      <div
        className={cn(
          "font-serif text-2xl md:text-3xl leading-none",
          muted ? "text-muted-light italic" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
    </div>
  );
}

