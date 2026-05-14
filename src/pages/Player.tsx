import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Twitter,
  MessageCircle,
  Link2,
  Check,
  ListPlus,
  ListChecks,
  ArrowRightLeft,
} from "lucide-react";
import { useMaListeStore } from "@/store/maListeStore";
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
import { PlayerEligibilityBlock } from "@/components/player/PlayerEligibilityBlock";
import { PlayerPressMentions } from "@/components/player/PlayerPressMentions";
import { PlayerStatProfile } from "@/components/player/PlayerStatProfile";
import { PlayerWeeklyProgress } from "@/components/player/PlayerWeeklyProgress";
import { PlayerScrollNav } from "@/components/player/PlayerScrollNav";
import { PlayerValueSparkline } from "@/components/player/PlayerValueSparkline";
import { RelatedPlayers } from "@/components/player/RelatedPlayers";
import { usePlayer } from "@/hooks/usePlayer";
import { useDominantColor } from "@/hooks/useDominantColor";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
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
  // Soft-404 SEO trap fix : explicit title + noindex so Google doesn't
  // index "Joueur introuvable" pages as valid content. Without this,
  // every typo'd URL becomes an indexed "thin page" hurting overall SEO.
  useDocumentMeta({
    title: "Joueur introuvable",
    description:
      "Ce profil n'existe pas dans Léopards Radar. Parcourez le Roster ou le Radar pour trouver un joueur.",
    noindex: true,
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
          404 · Profil introuvable
        </p>
        <h1 className="font-serif text-5xl text-foreground">Joueur introuvable.</h1>
        <p className="mt-4 max-w-md text-muted">
          Ce profil n'existe pas (encore) dans notre radar. Si tu cherchais un
          binational récemment dévoilé, on l'ajoute peut-être bientôt — propose-le.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/roster"
            className="inline-flex items-center gap-2 rounded-md bg-card border border-border px-5 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
          >
            Parcourir le Roster
          </Link>
          <Link
            to="/radar"
            className="inline-flex items-center gap-2 rounded-md bg-card border border-border px-5 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
          >
            Explorer le Radar
          </Link>
          <a
            href="mailto:contact@leopardsradar.com?subject=Joueur à ajouter"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-background hover:bg-primary-hover transition-colors"
          >
            Proposer un joueur
          </a>
        </div>
        <Link to="/" className="mt-12 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
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
  const { player, bases, selections, loading } = usePlayer(slug);
  const [copied, setCopied] = useState(false);
  const addToBench = useMaListeStore((s) => s.addToBench);
  // IMPORTANT : returning a fresh array/object from a zustand selector at
  // every render triggers React error #185 (max update depth) because the
  // store thinks state changed every render. We compute primitive booleans
  // directly inside the selector so the reference is stable across renders
  // when the actual data hasn't changed.
  const playerSlug = player?.slug;
  const isInList = useMaListeStore((s) => {
    if (!playerSlug) return false;
    if (s.bench.some((p) => p.slug === playerSlug)) return true;
    for (const slot of Object.values(s.startingXI)) {
      if (slot?.slug === playerSlug) return true;
    }
    return false;
  });

  const dominant = useDominantColor(player?.image_url ?? undefined);
  const [r, g, b] = dominant ?? [60, 60, 70];
  const heroGradient = `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.42) 0%, rgba(${r}, ${g}, ${b}, 0.18) 45%, #0A0A0B 100%)`;
  const photoShadow = dominant
    ? `0 20px 80px rgba(${r}, ${g}, ${b}, 0.35), 0 8px 24px rgba(0,0,0,0.5)`
    : `0 20px 80px rgba(0,0,0,0.5)`;

  // Update tab title + OG meta when the player is loaded. Hook is called
  // unconditionally (per Rules of Hooks) ; falls back to site defaults
  // when player is still loading or null.
  useDocumentMeta(
    player
      ? {
          title: player.name,
          description: buildPlayerMetaDescription(player),
          image: player.image_url ?? undefined,
        }
      : { title: "Profil joueur" },
  );

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

  // "Page-cimetière" detector : when 4+ identity fields are null AND the
  // season is empty, the page would otherwise render 6 stat axes at "—",
  // an identity grid full of "—" and an empty season block. We collapse
  // all that into a single editorial block that explains why and points
  // to the eligibility section (which is the actual story of the profile).
  const identityEmptyCount = [
    player.date_of_birth,
    player.place_of_birth,
    player.foot,
    player.height_cm,
    player.current_club,
  ].filter((v) => !v).length;
  const isProfileSparse = identityEmptyCount >= 4 && seasonEmpty;

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

  // Sticky anchor nav (lg+ uniquement). Items conditionnels selon ce qui est
  // réellement rendu pour ce profil — un profil sparse n'a pas de stats, donc
  // pas d'ancre stats. Évite les ancres dead-link.
  const navItems = [
    { id: "hero", label: "Profil" },
    !isProfileSparse && { id: "stats", label: "Statistiques" },
    !isProfileSparse && { id: "identite", label: "Identité" },
    { id: "fifa", label: "FIFA" },
    !isProfileSparse && { id: "saison", label: "Saison" },
    { id: "presse", label: "Presse" },
    { id: "similaires", label: "Similaires" },
  ].filter((it): it is { id: string; label: string } => Boolean(it));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PlayerScrollNav items={navItems} />

      <main>
        {/* HERO */}
        <section id="hero" className="relative overflow-hidden bg-background">
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
              {/* LEFT — photo
                  Mobile : ratio 4/5 (un peu plus haut que carré) capé à 55vh
                  pour que le nom + position restent dans la fold sur iPhone.
                  Desktop : ratio 3/4 inchangé. */}
              <div className="md:col-span-2">
                <div className="relative w-full overflow-hidden rounded-card">
                  <div className="aspect-[4/5] md:aspect-[3/4] max-h-[55vh] md:max-h-none w-full">
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      srcAlt={player.image_url_alt}
                      className="h-full w-full transition-shadow duration-700"
                      initialsClassName="text-9xl"
                    />
                  </div>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-card"
                    style={{ boxShadow: photoShadow }}
                  />
                </div>
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

                {/* Pull quote retiré du hero compact — il vit maintenant en
                    section dédiée juste après le hero (variant="full") pour
                    plus d'impact visuel. Voir bloc "POURQUOI" ci-dessous. */}

                <div className="flex flex-wrap gap-2 pt-1">
                  {player.computed_eligibility_status === "INELIGIBLE" ? (
                    // FIFA cap-tied : pas dans la liste des 26 RDC possible.
                    // On remplace le CTA par un état informatif clair.
                    <Button size="sm" variant="outline" disabled type="button">
                      <ListPlus className="h-4 w-4 opacity-50" /> Cap-tied — non éligible
                    </Button>
                  ) : isInList ? (
                    // Already in the local Ma Liste session : link to it
                    // instead of re-adding (idempotent UX, avoid duplicate toast).
                    <Link to="/ma-liste">
                      <Button size="sm" variant="outline" type="button">
                        <ListChecks className="h-4 w-4" /> Déjà dans ma liste
                      </Button>
                    </Link>
                  ) : (
                    // Real action : add the player to the local bench (zustand
                    // persist) + sonner toast with link to /ma-liste. The
                    // POTENTIALLY warning becomes part of the toast copy.
                    <Button
                      size="sm"
                      variant={
                        player.computed_eligibility_status === "POTENTIALLY"
                          ? "outline"
                          : "default"
                      }
                      type="button"
                      onClick={() => {
                        addToBench(player);
                        toast.success(
                          player.computed_eligibility_status === "POTENTIALLY"
                            ? `${player.name} ajouté — profil à instruire avant Mondial.`
                            : `${player.name} ajouté à ta liste.`,
                          {
                            action: {
                              label: "Voir ma liste",
                              onClick: () => {
                                window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/ma-liste`;
                              },
                            },
                          },
                        );
                      }}
                    >
                      <ListPlus className="h-4 w-4" />
                      {player.computed_eligibility_status === "POTENTIALLY"
                        ? "Ajouter (à instruire)"
                        : "Ajouter à ma liste"}
                    </Button>
                  )}
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

        {/* POURQUOI — pull quote éditorial gros format. Donne le "pourquoi je
            lis cette fiche" en un coup d'œil avant les sections data détaillées.
            La sparkline 12 mois est désactivée tant que `player_stats_weekly`
            n'a pas assez d'historique (≥ 6 snapshots) — cf. PlayerValueSparkline. */}
        <section className="container-site py-12 md:py-16 border-t border-border/40">
          <PlayerEligibilityQuote
            variant="full"
            className="max-w-3xl"
            text={buildPlayerEligibilityLine({
              eligibilityNote: player.eligibility_note,
              eligibilityStatus: player.eligibility_status,
              category: player.player_category,
              capsRdc: player.caps_rdc,
            })}
          />
        </section>

        {/* CETTE SEMAINE — delta vs snapshot dimanche précédent. Matérialise
            la cadence éditoriale promise (mise à jour chaque dimanche). */}
        <PlayerWeeklyProgress slug={player.slug} />

        {/* PROFIL STATISTIQUE — hexagon 6 axes (4 universels + 2 par poste).
            Caché sur les profils "sparse" (binational invisible récemment
            découvert) : afficher 6 axes à "—" donne l'impression d'un
            produit incomplet. À la place, on remonte le statut éligibilité
            qui est l'angle éditorial pertinent pour ce type de profil.
            id="stats" : ancre pour la sticky nav PlayerScrollNav. */}
        {!isProfileSparse && (
          <div id="stats" className="scroll-mt-24">
            <PlayerStatProfile player={player} />
          </div>
        )}

        {isProfileSparse ? (
          <section id="identite" className="container-site py-12 border-t border-border scroll-mt-24">
            <div className="rounded-card border border-dashed border-border bg-card/40 p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">
                Profil en cours d'enrichissement
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-tight mb-4">
                {player.name} vient d'entrer dans notre radar.
              </h2>
              <p className="text-muted-light leading-relaxed max-w-2xl">
                Détecté via la chaîne d'enrichissement (Wikidata, sélections jeunes
                EU, patronymes bantu vérifiés via Wikipédia). Date de naissance,
                club, taille et statistiques saison sont en cours de collecte —
                on enrichit ces profils chaque dimanche.
              </p>
              <p className="text-muted text-sm mt-6">
                L'angle éditorial du jour est plus bas <span aria-hidden>↓</span> :
                base juridique RDC identifiée, fenêtre de switch FIFA, procédure
                FECOFA.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`mailto:contact@leopardsradar.com?subject=Compl%C3%A9ter le profil de ${encodeURIComponent(player.name)}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                >
                  Proposer une source pour ce profil
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section id="identite" className="container-site py-12 border-t border-border scroll-mt-24">
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
        )}

        {/* STATUT ÉLIGIBILITÉ FIFA — bloc enrichi avec bases juridiques,
            verrous, fenêtre switch FIFA, procédure FECOFA, sources.
            id="fifa" : ancre sticky nav. */}
        <div id="fifa" className="scroll-mt-24">
          <PlayerEligibilityBlock
            player={player}
            bases={bases}
            selections={selections}
          />
        </div>

        {/* CITÉ DANS LA PRESSE — items press_items tagués player_id =
            ce joueur. Auto-hidden si zéro mention pour éviter un bloc
            triste sur les profils peu couverts.
            id="presse" : ancre sticky nav. */}
        <div id="presse" className="scroll-mt-24">
          <PlayerPressMentions playerId={player.id} />
        </div>

        {/* STATS SAISON — sur les profils sparse, on saute cette section
            (déjà couverte par le bloc éditorial plus haut). */}
        {!isProfileSparse && (
        <section id="saison" className="container-site py-12 border-t border-border scroll-mt-24">
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
        )}

        {/* E — PLUS DE LÉOPARDS : 4 joueurs du même poste.
            id="similaires" : ancre sticky nav. */}
        <div id="similaires" className="scroll-mt-24">
          <RelatedPlayers
            position={player.position}
            excludeSlug={player.slug}
          />
        </div>

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
 * Build the OG/twitter description shown when a player URL is shared.
 *
 * Format : "<position> · <club> · <caps> caps RDC · <market value>".
 * Skips fields when missing — keeps it under 160 chars even with long
 * club names. The leading "Léopards Radar — " prefix is added by the
 * meta hook elsewhere, this is just the differentiating payload.
 */
function buildPlayerMetaDescription(p: import("@/types/dbPlayer").DBPlayer): string {
  const bits: string[] = [];
  if (p.position) bits.push(POSITION_LABEL[p.position]);
  if (p.current_club) bits.push(p.current_club);
  if (p.caps_rdc > 0) bits.push(`${p.caps_rdc} cap${p.caps_rdc > 1 ? "s" : ""} RDC`);
  if (p.market_value_eur && p.market_value_eur > 0) bits.push(formatMarketValue(p.market_value_eur));
  return bits.length > 0 ? bits.join(" · ") : `Profil ${p.name} sur Léopards Radar`;
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

