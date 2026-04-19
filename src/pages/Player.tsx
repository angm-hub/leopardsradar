import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { StatBlock } from "@/components/ui/StatBlock";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { usePlayer } from "@/hooks/usePlayer";
import { useDominantColor } from "@/hooks/useDominantColor";
import { cn } from "@/lib/utils";
import {
  POSITION_LABEL,
  POSITION_BADGE,
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

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { player, loading } = usePlayer(slug);

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

  const seasonEmpty =
    !player.season_games &&
    !player.season_goals &&
    !player.season_assists &&
    !player.season_minutes &&
    !player.season_rating;

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
                <h1 className="font-serif text-5xl md:text-7xl font-semibold leading-[1.05] text-balance text-foreground">
                  {player.name}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {player.position ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider",
                        POSITION_BADGE[player.position],
                      )}
                    >
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

                <p className="text-sm text-muted-light">
                  <span className="text-muted">Valeur marchande · </span>
                  <span className="text-foreground">
                    {formatMarketValue(player.market_value_eur)}
                  </span>
                </p>

                <div className="flex flex-wrap gap-3">
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
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" /> Partager
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INFOS */}
        <section className="container-site py-16">
          <h2 className="font-serif text-3xl text-foreground">Infos.</h2>
          <dl className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
            {[
              ["Date de naissance", formatDate(player.date_of_birth)],
              ["Lieu de naissance", player.place_of_birth ?? "—"],
              ["Pays de naissance", player.country_of_birth ?? "—"],
              ["Taille", player.height_cm ? `${player.height_cm} cm` : "—"],
              [
                "Pied fort",
                player.foot
                  ? player.foot === "left"
                    ? "Gauche"
                    : player.foot === "right"
                      ? "Droit"
                      : "Ambidextre"
                  : "—",
              ],
              ["Agent", player.agent ?? "—"],
              ["Fin de contrat", formatDate(player.contract_expires)],
              ["Prêté par", player.on_loan_from ?? "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted">{label}</dt>
                <dd className="mt-1 text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* SÉLECTION */}
        <section className="container-site py-16 border-t border-border">
          <h2 className="font-serif text-3xl text-foreground">En sélection RDC.</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-card border border-border bg-card p-8">
              <StatBlock label="Sélections (caps)" value={player.caps_rdc} />
            </div>
            <div className="rounded-card border border-border bg-card p-8 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Statut d'éligibilité</span>
              <div className="mt-2">
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
              {player.eligibility_note ? (
                <p className="mt-4 text-foreground/80 leading-relaxed">{player.eligibility_note}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* STATS SAISON */}
        <section className="container-site py-16 border-t border-border">
          <h2 className="font-serif text-3xl text-foreground">Saison 2025/26 — Club.</h2>
          {seasonEmpty ? (
            <p className="mt-6 text-muted italic">Pas encore disponible.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Matchs", value: player.season_games },
                { label: "Buts", value: player.season_goals },
                { label: "Passes décisives", value: player.season_assists },
                {
                  label: "Note moyenne",
                  value: player.season_rating ? player.season_rating.toFixed(2) : "—",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-card border border-border bg-card p-8">
                  <StatBlock label={s.label} value={s.value} />
                </div>
              ))}
            </div>
          )}
        </section>

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
