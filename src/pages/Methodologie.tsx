import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Mail,
  ExternalLink,
  BarChart2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * Page Méthodologie — la transparence comme avantage compétitif.
 *
 * Une page que Transfermarkt ne fait pas. On dit d'où viennent les
 * données, comment on les calcule, ce qu'on n'a pas, et comment
 * signaler une erreur. C'est ce qui distingue une référence d'un
 * agrégat.
 *
 * Structure : 6 blocs verticaux, lecture en 2 minutes max.
 */
export default function Methodologie() {
  useEffect(() => {
    document.title = "Méthodologie | Léopards Radar";
    return () => {
      document.title = "Léopards Radar";
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <header className="container-site pt-32 pb-10">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Méthodologie</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Méthodologie.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            Comment on collecte les données, comment on les calcule, ce qu'on
            n'a pas. Transparence par défaut.
          </p>
        </header>

        {/* Pacte — éditorial avant le technique. Voix anonyme, factuelle,
            proche du manifeste de marque sans signature personnelle. */}
        <section className="container-site max-w-3xl pb-10">
          <blockquote className="border-l-2 border-primary/60 pl-6 py-2 max-w-2xl">
            <p className="font-serif italic text-xl md:text-2xl leading-relaxed text-foreground/90">
              "Préférer un tiret à un zéro qui ment. Publier une seule fois
              par semaine plutôt qu'aboyer en continu."
            </p>
            <footer className="mt-4 text-[11px] font-mono uppercase tracking-[0.22em] text-muted">
              Pacte éditorial · Léopards Radar
            </footer>
          </blockquote>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-foreground/75">
            Cette page documente <strong className="text-foreground">tout</strong>{" "}
            ce qui apparaît ailleurs sur le site : d'où viennent les chiffres,
            comment ils sont pondérés, ce qui manque encore, et comment
            signaler une erreur. C'est volontairement plus long qu'un
            disclaimer — c'est ce qui sépare une référence d'un agrégat
            anonyme.
          </p>
        </section>

        {/* TOC discrète */}
        <div className="border-y border-border bg-background/85 backdrop-blur-sm">
          <div className="container-site flex flex-wrap gap-x-6 gap-y-2 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
            <a href="#sources" className="hover:text-foreground transition-colors">
              01 · Sources
            </a>
            <a href="#frequence" className="hover:text-foreground transition-colors">
              02 · Fréquence
            </a>
            <a href="#hexagone" className="hover:text-foreground transition-colors">
              03 · Hexagone
            </a>
            <a href="#niveau" className="hover:text-foreground transition-colors">
              04 · Niveau de jeu
            </a>
            <a href="#eligibilite" className="hover:text-foreground transition-colors">
              05 · Éligibilité
            </a>
            <a href="#glossaire" className="hover:text-foreground transition-colors">
              06 · Glossaire
            </a>
            <a href="#corrections" className="hover:text-foreground transition-colors">
              07 · Corrections
            </a>
          </div>
        </div>

        <div className="container-site py-14 md:py-20 max-w-3xl space-y-16">
          {/* 01 — Sources */}
          <section id="sources" className="scroll-mt-24">
            <Kicker icon={<Database className="h-3 w-3" />}>01 · Sources</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              D'où viennent les données.
            </h2>
            <Prose>
              <p>
                Le profil de chaque joueur s'appuie sur quatre sources, dans
                l'ordre de priorité suivant :
              </p>
              <ol>
                <li>
                  <strong>Transfermarkt</strong> — état civil, club actuel, valeur
                  marchande, contrat, agent, photo. C'est notre source maître pour
                  tout ce qui touche à la carte d'identité du joueur.
                </li>
                <li>
                  <strong>football-data.org</strong> — statistiques de saison
                  (matchs, buts, passes décisives, minutes) pour les joueurs
                  évoluant dans les 12 compétitions majeures couvertes par
                  l'API : Premier League, LaLiga, Bundesliga, Serie A, Ligue 1,
                  Champions League, Eredivisie, Primeira Liga, Championship,
                  Brasileirão, Mondial, Euro.
                </li>
                <li>
                  <strong>Fédération RDC + sources locales</strong> — sélections
                  officielles, palmarès, déclarations publiques d'éligibilité.
                </li>
                <li>
                  <strong>Curating manuel</strong> — pour les joueurs hors
                  périmètre des trois sources ci-dessus (Linafoot, championnats
                  africains autres que les sud-africain et nord-africain
                  premières divisions, jeunes catégories), nous saisissons
                  manuellement les données après vérification croisée.
                </li>
              </ol>
              <p>
                Quand une donnée est manquante, nous affichons{" "}
                <code>—</code> plutôt qu'un zéro. C'est moins joli, mais c'est
                honnête.
              </p>
            </Prose>
          </section>

          {/* 02 — Fréquence */}
          <section id="frequence" className="scroll-mt-24">
            <Kicker icon={<RefreshCw className="h-3 w-3" />}>02 · Fréquence</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Mise à jour : chaque dimanche.
            </h2>
            <Prose>
              <p>
                Le radar publie une édition par semaine, le dimanche soir
                (heure de Paris). Cette édition consolide :
              </p>
              <ul>
                <li>les statistiques saison de la semaine écoulée pour les joueurs trackés ;</li>
                <li>les changements de club, de contrat, de valeur marchande détectés ;</li>
                <li>les nouveaux profils qui entrent dans le radar ;</li>
                <li>les Best XI hebdomadaires.</li>
              </ul>
              <p>
                Entre deux éditions, le site reste en consultation. Aucune
                statistique n'est modifiée à la volée — la stabilité des
                données prime sur la fraîcheur.
              </p>
              <h3>Pipeline automatique</h3>
              <p>
                Une fonction serveur (Supabase Edge Function{" "}
                <code>update-player-stats</code>) interroge l'API publique{" "}
                <code>football-data.org</code> chaque dimanche pour récupérer
                les statistiques des meilleurs buteurs des dix compétitions
                couvertes (Premier League, LaLiga, Bundesliga, Serie A,
                Ligue 1, Eredivisie, Primeira Liga, Championship, Brasileirão
                Série A, UEFA Champions League). Les profils Léopards qui
                apparaissent dans ces classements voient leurs champs
                <code> goals </code>, <code> assists </code> et
                <code> matchs joués </code> mis à jour automatiquement. Le
                reste — minutes exactes, statistiques défensives, gardiens —
                reste manuel ou à venir avec une intégration ultérieure.
              </p>
            </Prose>
          </section>

          {/* 03 — Hexagone */}
          <section id="hexagone" className="scroll-mt-24">
            <Kicker icon={<ScanSearch className="h-3 w-3" />}>03 · Hexagone</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Comment se calcule le profil statistique.
            </h2>
            <Prose>
              <p>
                Chaque hexagone affiche six axes notés sur 100. Quatre sont
                universels (mêmes formules pour tous les postes), deux varient
                selon le poste pour ancrer la silhouette au rôle.
              </p>

              <h3>Les 4 axes universels</h3>
              <dl>
                <Dl
                  label="Volume"
                  formula="minutes jouées / 3 420 (saison pleine)"
                  rationale="3 420 = 38 matchs × 90 minutes. Un joueur qui dépasse 90 % a joué l'intégralité d'une saison de top 5 européen."
                />
                <Dl
                  label="Régularité"
                  formula="minutes / matchs joués, ramené sur 90"
                  rationale="Approximation du statut titulaire. Un titulaire moyen d'un grand championnat tourne entre 75 et 90 min/match."
                />
                <Dl
                  label="Niveau championnat"
                  formula="tier UEFA du club actuel"
                  rationale="100 = top 5 EU (PL, LaLiga, Bundesliga, Serie A, Ligue 1) · 70 = sous-élite (Eredivisie, Primeira Liga, Pro League, Süper Lig, Championship, MLS) · 45 = autres championnats reconnus."
                />
                <Dl
                  label="Léopards"
                  formula="caps RDC / (âge − 16), normalisé"
                  rationale="3 sélections par année d'éligibilité senior = 100. Mesure l'investissement RDC, pas la simple présence."
                />
              </dl>

              <h3>Les 2 axes par poste</h3>
              <p className="text-sm">
                Voir les recettes complètes dans le code source — fichier{" "}
                <code>src/lib/playerScores.ts</code>. Brièvement :
              </p>
              <ul>
                <li>
                  <strong>Attaquant</strong> — Finition (buts/90, cible 1.0) +
                  Création (passes décisives/90, cible 0.4)
                </li>
                <li>
                  <strong>Milieu</strong> — Création (passes décisives/90, cible
                  0.4) + Activité (tackles + interceptions/90, à venir)
                </li>
                <li>
                  <strong>Défenseur</strong> — Solidité (buts contre/90 inversé,
                  à venir) + Construction (passes complétées %, à venir)
                </li>
                <li>
                  <strong>Gardien</strong> — Clean sheets % + Buts encaissés/90
                  inversé (les deux à venir avec la prochaine intégration de
                  données)
                </li>
              </ul>
              <p>
                Quand un axe attend une donnée que nous n'avons pas encore,
                il s'affiche <code>—</code> et le polygone se replie au centre
                pour cet axe. L'indice central (moyenne) ne s'affiche que si
                au moins quatre axes sur six sont disponibles, sinon il serait
                trompeur.
              </p>
            </Prose>
          </section>

          {/* 04 — Niveau de jeu */}
          <section id="niveau" className="scroll-mt-24">
            <Kicker icon={<BarChart2 className="h-3 w-3" />}>04 · Niveau de jeu</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Comment se calcule le niveau de jeu.
            </h2>
            <Prose>
              <p>
                Chaque joueur reçoit un <strong>score composite de 0 à 100</strong> qui
                reflète son niveau de jeu réel — pas une note éditoriale subjective.
                Ce score est <strong>public</strong> : il apparaît sur la fiche de chaque
                joueur, sur les cards du Roster et du Radar, et se met à jour
                automatiquement chaque nuit.
              </p>

              <h3>Les 4 facteurs pondérés</h3>
              <p>
                Le score est la somme de quatre composantes indépendantes :
              </p>
            </Prose>

            {/* Tableau des 4 facteurs — inline pour contrôle exact du style */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted w-[35%]">Facteur</th>
                    <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted w-[15%]">Poids</th>
                    <th className="py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Logique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-3 pr-4 text-foreground font-semibold align-top">Tier UEFA du club actuel</td>
                    <td className="py-3 pr-4 font-mono text-primary align-top">40 pts</td>
                    <td className="py-3 text-foreground/75 text-sm align-top">
                      CL (groupes) = 40 · Europa = 25 · Top 5 nat. = 18 · Top 10 = 10 · Linafoot/autres = 5 · Hors ligue connue = 0.
                      Si la FK club n'est pas encore renseignée, une heuristique sur la valeur marchande assure la continuité.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-foreground font-semibold align-top">Valeur marchande</td>
                    <td className="py-3 pr-4 font-mono text-primary align-top">30 pts</td>
                    <td className="py-3 text-foreground/75 text-sm align-top">
                      Échelle logarithmique (base 10) entre 100 k€ et 1 Md€ pour comprimer l'écart
                      entre Wissa (30 M€) et un espoir Linafoot (100 k€). Source : Transfermarkt.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-foreground font-semibold align-top">Sélections A senior RDC</td>
                    <td className="py-3 pr-4 font-mono text-primary align-top">20 pts</td>
                    <td className="py-3 text-foreground/75 text-sm align-top">
                      2 pts par sélection officielle ou amicale avec la fédération COD, capé à 20 pts
                      (10 sélections = score max). Mesure l'engagement international, pas juste la présence.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-foreground font-semibold align-top">Minutes jouées (saison en cours)</td>
                    <td className="py-3 pr-4 font-mono text-primary align-top">10 pts</td>
                    <td className="py-3 text-foreground/75 text-sm align-top">
                      Capé à 1 500 minutes pour 10 pts max. Un titulaire sur ≈17 matchs complets
                      atteint le plafond. Mesure la présence réelle sur le terrain cette saison.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Prose>
              <h3>Les 5 bandes de niveau</h3>
              <p>Le score se traduit en une bande publique affichée sur chaque profil :</p>
            </Prose>

            {/* Tableau des bandes */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted w-[20%]">Bande</th>
                    <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted w-[20%]">Score</th>
                    <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted w-[25%]">Profil type</th>
                    <th className="py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Exemples roster RDC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-primary align-top">Elite</td>
                    <td className="py-3 pr-4 font-mono text-foreground/80 align-top">80 – 100</td>
                    <td className="py-3 pr-4 text-foreground/75 align-top">Titulaire régulier dans les plus grandes compétitions européennes avec expérience en sélection</td>
                    <td className="py-3 text-foreground/75 align-top">Wissa, Lukebakio</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-success align-top">High</td>
                    <td className="py-3 pr-4 font-mono text-foreground/80 align-top">60 – 79</td>
                    <td className="py-3 pr-4 text-foreground/75 align-top">Rotation fiable dans un top 5 européen ou titulaire dans un championnat de premier plan</td>
                    <td className="py-3 text-foreground/75 align-top">Mukau, Wan-Bissaka</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-success/70 align-top">Mid</td>
                    <td className="py-3 pr-4 font-mono text-foreground/80 align-top">40 – 59</td>
                    <td className="py-3 pr-4 text-foreground/75 align-top">Actif dans un championnat européen du top 10 ou équivalent africain de haut niveau</td>
                    <td className="py-3 text-foreground/75 align-top">Sadiki, Stroeykens</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-muted-light align-top">Developing</td>
                    <td className="py-3 pr-4 font-mono text-foreground/80 align-top">20 – 39</td>
                    <td className="py-3 pr-4 text-foreground/75 align-top">Jeune en progression dans un championnat de niveau 2 ou 3 — profil à suivre</td>
                    <td className="py-3 text-foreground/75 align-top">Engwanda, Mavissa</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold text-muted align-top">Watch</td>
                    <td className="py-3 pr-4 font-mono text-foreground/80 align-top">0 – 19</td>
                    <td className="py-3 pr-4 text-foreground/75 align-top">Profil identifié via vivier Linafoot ou diaspora, pas encore exposé au football européen professionnel</td>
                    <td className="py-3 text-foreground/75 align-top">Vivier Linafoot non encore exposé</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Prose>
              <h3>Fréquence de mise à jour</h3>
              <p>
                Le score est recalculé <strong>automatiquement chaque nuit à 03h00 UTC</strong>{" "}
                par un job GitHub Actions (<code>refresh-levels.yml</code>).
                Il est aussi mis à jour <strong>immédiatement</strong> par un trigger Postgres
                dès qu'un des trois facteurs change en base : valeur marchande, club actuel,
                ou minutes jouées. Le calcul ne porte que sur les joueurs dont le score a
                effectivement changé.
              </p>
              <p>
                Pour la transparence complète, le code de la migration et de la vue
                de calcul est disponible sur GitHub :{" "}
                <a
                  href="https://github.com/leopardsradar/leopardsradar/blob/main/scripts/migrations/2026_05_15_player_level_band.sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  scripts/migrations/2026_05_15_player_level_band.sql
                </a>
                .
              </p>
            </Prose>
          </section>

          {/* 05 — Éligibilité */}
          <section id="eligibilite" className="scroll-mt-24">
            <Kicker icon={<ShieldCheck className="h-3 w-3" />}>05 · Éligibilité</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Statuts d'éligibilité aux Léopards.
            </h2>
            <Prose>
              <dl>
                <Dl
                  label="Sélectionné"
                  formula="Membre du roster Léopards"
                  rationale="A déjà disputé au moins un match officiel A avec la RDC."
                />
                <Dl
                  label="Éligible"
                  formula="Pas encore appelé en A, mais éligible juridiquement"
                  rationale="Nationalité RDC ou parent direct né en RDC, sans verrou senior d'une autre nation."
                />
                <Dl
                  label="Potentiellement éligible"
                  formula="Liens familiaux établis, statut juridique à confirmer"
                  rationale="Profil radar en cours d'instruction. Nous documentons l'ascendance puis basculons en Éligible une fois la chaîne établie."
                />
                <Dl
                  label="Inéligible"
                  formula="Verrou A officiel pour une autre nation"
                  rationale="Le joueur a disputé un match A officiel pour une autre fédération et ne peut plus changer (sauf cas FIFA très rares de switch)."
                />
              </dl>
            </Prose>
          </section>

          {/* 06 — Glossaire */}
          <section id="glossaire" className="scroll-mt-24">
            <Kicker icon={<Database className="h-3 w-3" />}>06 · Glossaire</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Glossaire.
            </h2>
            <Prose>
              <dl>
                <Dl label="Caps RDC" formula="" rationale="Nombre de matchs A officiels disputés avec la RDC depuis le début de la carrière." />
                <Dl label="Diaspora" formula="" rationale="Joueur né hors RDC mais éligible via ascendance directe (parent ou grand-parent congolais)." />
                <Dl label="Tier 1 / Tier 2 (Radar)" formula="" rationale="Classement interne des profils radar par priorité d'approche. Tier 1 = joueur prêt à appeler, Tier 2 = à suivre dans la durée." />
                <Dl label="Valeur marchande" formula="" rationale="Estimation publique Transfermarkt en euros. Indicative — peut varier de 30 à 50 % par rapport aux montants effectifs de transfert." />
                <Dl label="Best XI Diaspora" formula="" rationale="Composition idéale hebdomadaire du onze RDC roster + diaspora éligible confondus, à formation choisie." />
                <Dl label="Indice (centre de l'hexagone)" formula="" rationale="Moyenne arithmétique des six axes du profil statistique. N'apparaît que si au moins quatre axes sont disponibles." />
              </dl>
            </Prose>
          </section>

          {/* 07 — Corrections */}
          <section id="corrections" className="scroll-mt-24">
            <Kicker icon={<Mail className="h-3 w-3" />}>07 · Corrections</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Une donnée à corriger ?
            </h2>
            <Prose>
              <p>
                Tu vois une statistique fausse, un statut d'éligibilité
                discutable, un club qui ne correspond plus, une photo périmée,
                une nationalité oubliée, un Léopard absent du radar ? Écris-nous,
                on traite chaque signalement à l'édition suivante.
              </p>
              <div className="not-prose mt-6 flex flex-wrap gap-3">
                <a
                  href="mailto:alexandre@withkaira.com?subject=Correction%20de%20donn%C3%A9e"
                  className="inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  <Mail className="h-4 w-4" />
                  Signaler une correction
                </a>
                <a
                  href="https://www.football-data.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-button border border-border px-4 py-2 text-sm text-muted-light transition-colors hover:text-foreground hover:border-border-hover"
                >
                  <ExternalLink className="h-4 w-4" />
                  football-data.org
                </a>
                <a
                  href="https://www.transfermarkt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-button border border-border px-4 py-2 text-sm text-muted-light transition-colors hover:text-foreground hover:border-border-hover"
                >
                  <ExternalLink className="h-4 w-4" />
                  Transfermarkt
                </a>
              </div>
            </Prose>
          </section>

          {/* Document vivant — referme la page sur le pacte de continuité,
              sans signature personnelle. */}
          <section className="border-t border-border pt-12">
            <Kicker icon={<Mail className="h-3 w-3" />}>Une dernière chose</Kicker>
            <h2 className="mt-3 display-heading text-3xl text-foreground">
              Cette page n'est jamais finie.
            </h2>
            <Prose>
              <p>
                Chaque correction reçue est intégrée à l'édition suivante,
                chaque source manquante est documentée ici, chaque axe en
                attente de donnée est listé. Ce qui n'est pas écrit n'est
                pas vrai — une affirmation non sourcée ailleurs sur le site
                est un bug, pas un parti pris.
              </p>
              <p>
                Pour signaler une erreur, proposer une source ou suggérer un
                joueur :{" "}
                <a
                  href="mailto:alexandre@withkaira.com"
                  className="text-primary hover:text-primary-hover underline underline-offset-4"
                >
                  alexandre@withkaira.com
                </a>
                .
              </p>
            </Prose>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ---------- Local helpers ----------

function Kicker({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/85">
      {icon}
      {children}
    </span>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  // Local prose styling — DM Sans body, Fraunces sub-headings, generous
  // line-height. Avoids the @tailwindcss/typography dependency.
  return (
    <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground/80 [&>h3]:font-serif [&>h3]:text-xl [&>h3]:text-foreground [&>h3]:mt-7 [&>h3]:mb-2 [&>p]:max-w-prose [&>ul]:max-w-prose [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mt-1 [&>ol]:max-w-prose [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:mt-1 [&>p>code]:px-1 [&>p>code]:py-0.5 [&>p>code]:rounded [&>p>code]:bg-card [&>p>code]:font-mono [&>p>code]:text-[12px] [&>p>code]:text-foreground [&>p>strong]:text-foreground [&>p>strong]:font-semibold [&>ul>li>strong]:text-foreground [&>ol>li>strong]:text-foreground [&>p>li>code]:font-mono">
      {children}
    </div>
  );
}

function Dl({
  label,
  formula,
  rationale,
}: {
  label: string;
  formula: string;
  rationale: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-6 gap-y-1 py-3 border-b border-border/50 last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd className="text-sm text-foreground/85">
        {formula ? (
          <p className="font-mono text-[12px] text-primary/85">{formula}</p>
        ) : null}
        <p className={formula ? "mt-1" : ""}>{rationale}</p>
      </dd>
    </div>
  );
}
