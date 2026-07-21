import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Globe2,
  ShieldCheck,
  RefreshCw,
  Users,
  Building2,
  Landmark,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * Page Pro — la couche revenu B2B (Club / Agence / Fédération).
 *
 * Séparée de la home fan (audience) : ici on ne parle qu'au décideur.
 * On ne vend pas la data (commodité), on vend le jugement : le Verdict
 * Léopards, l'éligibilité RDC établie à la main. Leçon Gradient Sports.
 *
 * Sèche, démo produit en haut, preuve dure chiffrée, moat éligibilité
 * vs Wyscout/SciSports, tarifs assumés, CTA « Demander une démo ».
 */

const DEMO_MAILTO =
  "mailto:alexandre@withkaira.com?subject=Démo%20Léopards%20Radar%20Pro";
const RADAR_IMG = `${import.meta.env.BASE_URL}pro-radar.webp`;

const MOAT = [
  {
    icon: Globe2,
    title: "La diaspora binationale",
    body: (
      <>
        France 339, Belgique 165, et le reste du monde.{" "}
        <strong className="text-foreground">
          Les binationaux que les bases mondiales ne taggent pas congolais, on
          les a.
        </strong>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "L'éligibilité, calculée",
    body: (
      <>
        Capé ou pas, jusqu'à quand il reste basculable.{" "}
        <strong className="text-foreground">
          Une catégorie qu'aucune plateforme mondiale ne vous donne.
        </strong>
      </>
    ),
  },
  {
    icon: RefreshCw,
    title: "Tout le vivier, vérifié",
    body: (
      <>
        Pas un échantillon, pas un flux automatique non contrôlé.{" "}
        <strong className="text-foreground">
          1 465 profils passés à la main, recoupés et datés.
        </strong>
      </>
    ),
  },
];

const PERSONAS = [
  {
    icon: Building2,
    tag: "Club · recrutement",
    title: "Les connaître avant de les voir jouer",
    body: (
      <>
        Tout le vivier congolais et binational à portée : vous savez qui vaut le
        déplacement{" "}
        <strong className="text-foreground">avant même d'allumer un match</strong>.
        Les bons profils repérés tôt, des semaines de scouting en moins.
      </>
    ),
  },
  {
    icon: Users,
    tag: "Agence · placement",
    title: "Tout savoir avant d'approcher",
    body: (
      <>
        Le maximum d'infos sur un joueur (niveau, parcours, statut, valeur) réuni{" "}
        <strong className="text-foreground">avant le premier contact</strong>.
        Vous arrivez préparé face au joueur ou à sa famille.
      </>
    ),
  },
  {
    icon: Landmark,
    tag: "Fédération · sélection",
    title: "Repérer les éligibles au plus tôt",
    body: (
      <>
        La liste des éligibles à jour, avec le statut FIFA de chacun.{" "}
        <strong className="text-foreground">
          Identifiez le talent binational avant qu'un autre pays ne le verrouille
        </strong>
        , et préparez chaque fenêtre.
      </>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "On scanne tout le vivier",
    body: "Chaque joueur né en RDC ou d'origine congolaise, du championnat local aux académies européennes. Personne n'est oublié.",
  },
  {
    n: "02",
    title: "On applique la règle FIFA",
    body: "Sélections jouées, catégories de caps, fenêtre de bascule. Les règles d'éligibilité appliquées joueur par joueur, recoupées entre plusieurs sources.",
  },
  {
    n: "03",
    title: "Un humain vérifie et date",
    body: "Chaque verdict est contrôlé à la main et daté. Pas de flux automatique non vérifié, jamais un chiffre de mémoire.",
  },
];

const STATS = [
  { v: "1 465", l: "Profils vérifiés un par un" },
  { v: "1 312", l: "Éligibles RDC identifiés" },
  { v: "809", l: "Clubs couverts" },
  { v: "22", l: "Pays suivis" },
];

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-hover px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary";

export default function Pro() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Léopards Radar Pro | L'intelligence data du football congolais";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <header className="relative overflow-hidden atmos-dawn grain grain-soft">
          <div className="container-site relative z-10 pt-32 pb-16 text-center">
            <p className="label-mono text-primary">
              Intelligence data · football congolais
            </p>
            <h1 className="mt-5 display-heading text-display-lg md:text-display-xl text-foreground text-balance">
              Ne ratez plus un joueur
              <br className="hidden sm:block" /> éligible à la{" "}
              <span className="text-primary">RDC.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-light">
              On ne vous donne pas une base de données de plus. On vous donne{" "}
              <strong className="text-foreground">le Verdict Léopards</strong> :
              niveau, statut FIFA et éligibilité de chaque joueur congolais et
              binational, réunis et vérifiés à la main.{" "}
              <strong className="text-foreground">
                Connaissez-les avant même de les voir jouer
              </strong>
              , et gagnez des semaines de repérage.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={DEMO_MAILTO} className={btnPrimary}>
                Demander une démo <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/radar" className={btnGhost}>
                Voir le radar en action
              </Link>
            </div>
            <p className="mx-auto mt-7 max-w-xl label-mono-sm text-muted normal-case tracking-[0.02em] leading-relaxed">
              Wyscout et SciSports voient le monde en surface.
              <br />
              Nous voyons le Congo en profondeur, avec l'éligibilité que
              personne d'autre ne calcule.
            </p>
          </div>

          {/* Démo produit : capture du radar */}
          <div className="container-site relative z-10 pb-16">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-card border border-border surface-1">
              <div className="flex h-8 items-center gap-1.5 border-b border-border bg-card px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E0564B]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E6B33E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#5BC46A]" />
              </div>
              <img
                src={RADAR_IMG}
                alt="Le radar Léopards : liste filtrable du vivier congolais et fiche joueur avec statut FIFA et éligibilité"
                loading="lazy"
                className="block w-full"
              />
            </div>
          </div>
        </header>

        {/* ── PREUVE DURE ──────────────────────────────────────── */}
        <section className="border-y border-border bg-card/40">
          <div className="container-site py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.l}>
                  <div className="display-heading text-4xl md:text-5xl text-foreground tabular-nums">
                    {s.v}
                  </div>
                  <div className="mt-2 label-mono-sm text-muted leading-snug">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-border pt-6 text-sm leading-relaxed text-muted">
              <strong className="text-foreground">
                Sources croisées, jamais de mémoire.
              </strong>{" "}
              Éligibilité FIFA calculée profil par profil. À jour chaque
              dimanche.
            </div>
          </div>
        </section>

        {/* ── MOAT ─────────────────────────────────────────────── */}
        <section className="container-site py-20">
          <p className="label-mono text-primary">
            Ce que vous ne trouvez nulle part ailleurs
          </p>
          <h2 className="mt-3 display-heading text-3xl md:text-4xl text-foreground text-balance">
            Un pays à fond, là où les autres survolent le monde.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {MOAT.map(({ icon: Icon, title, body }) => (
              <div key={title} className="surface-1 p-7">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-muted">
            <strong className="text-foreground">
              Wyscout vous donne le monde en surface. SciSports facture 10 à 25
              k€/an pour l'Europe.
            </strong>{" "}
            Nous, le vivier congolais et binational en profondeur, avec le seul
            indicateur qui vous fait gagner un joueur : l'éligibilité.
          </p>
        </section>

        <div className="container-site">
          <div className="hairline-x" />
        </div>

        {/* ── POUR QUI ─────────────────────────────────────────── */}
        <section className="container-site py-20">
          <p className="label-mono text-primary">Pour qui</p>
          <h2 className="mt-3 display-heading text-3xl md:text-4xl text-foreground">
            Trois métiers, une même longueur d'avance.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PERSONAS.map(({ icon: Icon, tag, title, body }) => (
              <div key={tag} className="surface-1 p-7">
                <div className="mb-4 flex items-center gap-2.5 text-primary">
                  <Icon className="h-4 w-4" />
                  <span className="label-mono-sm">{tag}</span>
                </div>
                <h3 className="text-lg font-medium tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── NOTRE MÉTHODE + VERDICT ──────────────────────────── */}
        <section className="container-site py-20">
          <p className="label-mono text-primary">Notre méthode</p>
          <h2 className="mt-3 display-heading text-3xl md:text-4xl text-foreground">
            Pas juste de la data.
            <br />
            Un verdict.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="surface-1 p-7">
                <div className="label-mono-sm text-primary">{s.n}</div>
                <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* Sceau Verdict Léopards */}
          <div className="mx-auto mt-8 max-w-xl surface-glow p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="label-mono-sm text-primary">Verdict Léopards</span>
              <span className="flex items-center gap-1.5 label-mono-sm text-muted">
                <Check className="h-3.5 w-3.5 text-primary" /> vérifié à la main
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg font-medium tracking-tight text-foreground">
                Senny Mayulu · PSG
              </span>
              <span className="rounded-full border border-primary/40 bg-primary/12 px-3 py-1.5 label-mono-sm text-[#FFD860]">
                Éligible · fenêtre ouverte
              </span>
            </div>
            <div className="mt-4 border-t border-border pt-3 label-mono-sm text-muted normal-case tracking-[0.03em]">
              Statut FIFA établi à la main · recoupé entre les sources · daté
              20/07
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-muted">
            Le résultat :{" "}
            <strong className="text-foreground">le Verdict Léopards</strong>, un
            signal d'éligibilité que vous ne trouvez nulle part ailleurs. C'est
            ça qu'on vend, pas une base de données de plus.
          </p>
        </section>

        {/* ── TARIFS ───────────────────────────────────────────── */}
        <section className="container-site py-20">
          <p className="label-mono text-primary">Tarifs</p>
          <h2 className="mt-3 display-heading text-3xl md:text-4xl text-foreground">
            Deux façons de travailler avec nous.
          </h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="surface-glow p-8 flex flex-col">
              <div className="label-mono-sm text-primary">
                Licence data · annuelle
              </div>
              <h3 className="mt-3 text-xl font-medium tracking-tight text-foreground">
                Accès plateforme
              </h3>
              <div className="mt-1 text-sm text-muted">
                à partir de{" "}
                <strong className="text-foreground">2 400 € / an</strong>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Le radar complet pour votre cellule : 1 465 fiches, filtres, carte mondiale",
                  "Statut FIFA et éligibilité sur chaque joueur",
                  "Exports, comparaison, alertes profils",
                  "Mise à jour hebdomadaire, accès multi-utilisateurs",
                ].map((li) => (
                  <li key={li} className="flex gap-2.5 text-sm text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
              <a href={DEMO_MAILTO} className={`${btnPrimary} mt-6 w-full`}>
                Demander une démo
              </a>
            </div>

            <div className="surface-1 p-8 flex flex-col">
              <div className="label-mono-sm text-muted">Rapports sur mesure</div>
              <h3 className="mt-3 text-xl font-medium tracking-tight text-foreground">
                À la demande
              </h3>
              <div className="mt-1 text-sm text-muted">
                à partir de{" "}
                <strong className="text-foreground">490 € le dossier</strong>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Dossier joueur complet : data croisée, matchs inclus",
                  "Rapport de sélection avant une fenêtre internationale",
                  "Cartographie d'un poste ou d'une génération",
                  "Livré sous quelques jours, accompagnement dédié",
                ].map((li) => (
                  <li key={li} className="flex gap-2.5 text-sm text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
              <a href={DEMO_MAILTO} className={`${btnGhost} mt-6 w-full`}>
                Nous contacter
              </a>
            </div>
          </div>
          <p className="mt-6 text-center label-mono-sm text-muted normal-case tracking-[0.04em]">
            Tarif exact sur démo, selon le périmètre et le nombre
            d'utilisateurs.
          </p>
        </section>

        {/* ── CTA FINALE ───────────────────────────────────────── */}
        <section className="relative overflow-hidden atmos-dawn grain grain-soft">
          <div className="container-site relative z-10 py-24 text-center">
            <p className="label-mono text-primary">
              Prêt à ne plus rater personne ?
            </p>
            <h2 className="mt-4 display-heading text-3xl md:text-display-lg text-foreground">
              Voyez le radar sur <span className="text-primary">vos besoins.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-light">
              Une démo de 20 minutes, sur les profils qui vous intéressent. On
              vous montre le vivier, l'éligibilité, et ce que vous rateriez sans
              nous.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={DEMO_MAILTO} className={btnPrimary}>
                Demander une démo <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/" className={btnGhost}>
                Version fan
              </Link>
            </div>
            <p className="mt-6 label-mono-sm text-muted normal-case tracking-[0.05em]">
              Réponse sous 48h · sans engagement
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
