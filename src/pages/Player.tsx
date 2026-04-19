import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { StatBlock } from "@/components/ui/StatBlock";
import { PlayerCard } from "@/components/home/PlayerCard";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayers } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";

const RECENT_FORM = [
  { result: "W", date: "12 avr.", opp: "OL", score: "2-1", rating: 7.8, mins: 90 },
  { result: "D", date: "06 avr.", opp: "PSG", score: "1-1", rating: 7.1, mins: 90 },
  { result: "W", date: "30 mars", opp: "Marseille", score: "3-0", rating: 8.4, mins: 88 },
  { result: "L", date: "16 mars", opp: "Monaco", score: "0-2", rating: 6.2, mins: 90 },
  { result: "W", date: "09 mars", opp: "Rennes", score: "2-1", rating: 7.5, mins: 90 },
] as const;

const RESULT_STYLE: Record<string, string> = {
  W: "bg-success/15 text-success border-success/30",
  D: "bg-muted/15 text-muted-light border-border",
  L: "bg-alert/15 text-alert border-alert/30",
};

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
            <div className="h-6 w-1/3 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
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
  const { players: similar } = usePlayers({
    position: player?.position,
    limit: 6,
  });

  if (loading) return <PlayerSkeleton />;
  if (!player) return <NotFound />;

  const similarFiltered = similar.filter((p) => p.slug !== player.slug).slice(0, 5);

  const isRadar = player.category === "Radar";
  const rootHref = isRadar ? "/radar" : "/roster";
  const rootLabel = isRadar ? "Radar" : "Roster";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${player.photoUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) brightness(0.3)",
              transform: "scale(1.15)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

          <div className="container-site relative z-10 pt-28 pb-20">
            <nav className="mb-8 text-sm text-muted">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2 opacity-50">/</span>
              <Link to={rootHref} className="hover:text-foreground">{rootLabel}</Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-foreground/80">{player.name}</span>
            </nav>

            {isRadar ? (
              <div className="mb-12">
                <div className="flex items-center gap-3 rounded-card bg-primary px-6 py-4 font-semibold text-primary-foreground">
                  <Zap className="h-5 w-5" />
                  RADAR — Potentiellement éligible Léopards
                </div>
                <div className="mt-4 rounded-card border-l-2 border-primary bg-primary/10 px-6 py-4">
                  <p className="font-serif text-lg italic text-foreground/90 leading-relaxed">
                    {player.radarReason}
                  </p>
                  {player.radarSources?.length ? (
                    <p className="mt-4 text-sm text-muted">
                      <span className="text-foreground/70">Sources :</span>{" "}
                      {player.radarSources.map((s, i) => (
                        <span key={s.url + i}>
                          {i > 0 ? <span className="mx-2 opacity-50">·</span> : null}
                          <a href={s.url} className="text-primary hover:underline">
                            {s.title}
                          </a>
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs italic text-muted">
                    Éligibilité finale soumise aux règles FIFA Art. 5-8. Nous ne sommes pas la FECOFA.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
              {/* LEFT */}
              <div className="md:col-span-2">
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="aspect-[3/4] w-full rounded-card object-cover shadow-2xl shadow-primary/10"
                />
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-6 md:col-span-3">
                <h1 className="font-serif text-5xl md:text-7xl font-semibold leading-[1.05] text-balance text-foreground">
                  {player.name}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {[
                    player.positionLabel,
                    player.foot ? `Pied ${player.foot}` : null,
                    `${player.age} ans`,
                    player.heightCm ? `${player.heightCm}cm` : null,
                  ]
                    .filter(Boolean)
                    .map((t) => (
                      <span
                        key={t as string}
                        className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm"
                      >
                        {t}
                      </span>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <img
                    src={player.clubLogoUrl}
                    alt={player.club}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="text-lg font-semibold text-foreground">{player.club}</span>
                  {player.contractUntil ? (
                    <>
                      <span className="text-muted">·</span>
                      <span className="text-sm text-muted">
                        Contrat jusqu'en {player.contractUntil}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-4xl leading-none" aria-label={player.nationalitySport}>
                    🇨🇩
                  </span>
                  <span className="text-sm text-muted">{player.nationalitySport}</span>
                </div>

                <div className="rounded-card border border-border bg-card/60 p-6 backdrop-blur-sm max-w-sm">
                  <StatBlock
                    label="Valeur marchande"
                    value={player.marketValueDisplay}
                    change="+12% sur 6 mois"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" /> Transfermarkt
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" /> Partager
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEASON STATS */}
        <section className="container-site py-24">
          <h2 className="font-serif text-4xl text-foreground">Saison 2025/26 — Club.</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { label: "Matchs joués", value: player.stats.matches },
              { label: "Buts", value: player.stats.goals },
              { label: "Passes décisives", value: player.stats.assists },
              { label: "Minutes jouées", value: player.stats.minutes },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-card border border-border bg-card p-8"
              >
                <StatBlock label={s.label} value={s.value} />
              </div>
            ))}
          </div>
        </section>

        {/* RECENT FORM */}
        <section className="container-site py-24">
          <h2 className="font-serif text-4xl text-foreground">Forme récente.</h2>
          <div className="mt-10 rounded-card border border-border bg-card p-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {RECENT_FORM.map((m, i) => (
                <div
                  key={i}
                  className="flex min-w-[140px] flex-col gap-2 rounded-card border border-border/60 bg-background/40 p-4"
                >
                  <span
                    className={cn(
                      "inline-flex w-7 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold",
                      RESULT_STYLE[m.result],
                    )}
                  >
                    {m.result}
                  </span>
                  <span className="text-xs text-muted">{m.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-sm bg-border" />
                    <span className="text-sm text-foreground/80">{m.opp}</span>
                  </div>
                  <span className="font-mono text-xl text-foreground">{m.score}</span>
                  <span className="font-mono text-3xl font-bold text-primary">
                    {m.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted">{m.mins}'</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NATIONAL TEAM */}
        <section className="container-site py-24">
          <h2 className="font-serif text-4xl text-foreground">En sélection RDC.</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { label: "Sélections", value: player.capsRdc },
              { label: "Buts", value: player.goalsRdc },
              { label: "Première cap", value: "Sept. 2019" },
              { label: "Dernière convocation", value: "Mars 2026" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-card border border-border bg-card p-8"
              >
                <StatBlock label={s.label} value={s.value} />
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-card border border-border bg-card p-8">
            <p className="font-serif text-lg leading-[1.7] text-foreground/85">
              Son rôle avec les Léopards : pièce centrale du dispositif de Sébastien Desabre,
              {" "}{player.name.split(" ")[0]} apporte équilibre, leadership et une lecture du jeu rare.
              Sa polyvalence en fait un atout précieux pour les rendez-vous internationaux.
            </p>
          </div>
        </section>

        {/* EDITORIAL */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="mb-8 font-serif text-4xl text-foreground">Pourquoi il compte.</h2>
            <div className="space-y-6 font-serif text-xl leading-[1.7] text-foreground/90 text-left">
              {player.bio ? (
                <p>{player.bio}</p>
              ) : (
                <p className="text-muted italic">Biographie éditoriale à venir.</p>
              )}
            </div>
          </div>
        </section>

        {/* SIMILAR */}
        {similarFiltered.length ? (
          <section className="container-site py-24">
            <h2 className="font-serif text-4xl text-foreground">Dans la même équipe.</h2>
            <div className="mt-10 flex gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-5">
              {similarFiltered.map((p) => (
                <div key={p.slug} className="min-w-[220px] md:min-w-0">
                  <PlayerCard player={p} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
