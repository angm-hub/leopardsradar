/**
 * HeritageSection — extension Heritage du brand book Premium v2 sur /a-propos.
 *
 * Deux blocs cinématographiques :
 *
 *   1. Tribute 1974 — atmos-zaire (cobalt + accent star) avec "1974." massif
 *      en jaune torche, contexte premier sub-saharien en Coupe du Monde,
 *      et stats glass cards "22 Léopards alors" / "1075 Léopards aujourd'hui".
 *      Source : artboard 014 du brand book.
 *
 *   2. Magazine spread "Pourquoi nous regardons comme l'okapi" — gauche
 *      atmos-torch avec silhouette okapi, droite cobalt night avec drop cap
 *      éditorial 4 paragraphes. Manifeste de la posture (observer plutôt
 *      qu'attaquer). Source : artboard 018 du brand book.
 *
 * Plein largeur (rompt le container max-w-3xl de About.tsx) pour donner
 * le poids cinéma que la page mérite sur ce moment éditorial.
 */

import { OkapiSilhouette } from "@/components/ui/Silhouettes";
import { LRMark } from "@/components/ui/Wordmark";

// ─── Bloc 1 — Tribut 1974 Zaïre ─────────────────────────────────────────────

function Tribute1974() {
  return (
    <section
      aria-labelledby="heritage-1974"
      className="relative overflow-hidden border-y border-border/40"
    >
      {/* Atmosphère Zaïre : cobalt + Star yellow accent */}
      <div aria-hidden className="absolute inset-0 atmos-zaire" />

      {/* Grain heavy — texture cinématique forte */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.32]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette cinéma */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, transparent 30%, rgba(5,11,26,0.6) 100%)",
        }}
      />

      <div className="container-site relative z-10 py-20 md:py-28">
        <div className="flex flex-col items-start gap-3">
          <span className="label-mono text-torch/85">014 — Heritage</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-torch/30 bg-torch/10 px-3 py-1 label-mono-sm text-torch">
            <span
              className="h-1.5 w-1.5 rounded-full bg-torch"
              aria-hidden
            />
            Zaïre · World Cup 1974
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr] md:items-end md:gap-16">
          <div>
            <div
              className="display-heading text-7xl text-torch md:text-[10rem]"
              style={{ lineHeight: 0.85 }}
            >
              1974.
            </div>
            <h2
              id="heritage-1974"
              className="display-heading mt-6 text-3xl text-foreground md:mt-8 md:text-5xl"
            >
              The first sub-Saharan side<br />
              at a World Cup.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/65 md:text-lg">
              Le Zaïre arrive en Allemagne avec ses Léopards et un drapeau
              vert frappé du flambeau de l'authenticité. Cinquante ans plus
              tard, l'héritage continue. Léopards Radar prolonge ce regard.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass rounded-card p-5">
              <span className="label-mono-sm text-foreground/55">Squad</span>
              <div className="display-heading mt-2 text-3xl text-foreground md:text-4xl">
                22 Léopards.
              </div>
              <p className="label-mono-sm mt-3 text-foreground/55">
                NDAYE · KAZADI · MWEPU · KEMBO · KIDUMU
              </p>
            </div>
            <div className="glass rounded-card p-5">
              <span className="label-mono-sm text-foreground/55">
                50 years later
              </span>
              <div className="display-heading mt-2 text-3xl text-primary md:text-4xl">
                1 075 Léopards.
              </div>
              <p className="label-mono-sm mt-3 text-foreground/55">
                Dix-neuf ligues · un seul radar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bloc 2 — Magazine spread Okapi ─────────────────────────────────────────

function OkapiManifesto() {
  return (
    <section
      aria-labelledby="heritage-okapi"
      className="relative overflow-hidden"
    >
      <div className="container-site py-20 md:py-28">
        <div className="flex flex-col items-start gap-3">
          <span className="label-mono text-cobalt-mist">018 — Editorial</span>
          <h2
            id="heritage-okapi"
            className="display-heading text-3xl text-foreground md:text-5xl"
          >
            Pourquoi nous regardons{" "}
            <span className="italic text-cobalt-mist">comme l'okapi.</span>
          </h2>
        </div>

        {/* Spread 2 colonnes, type magazine */}
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-border/60 bg-border/40 md:mt-14 md:grid-cols-2">
          {/* Page gauche — atmos-torch + silhouette okapi */}
          <div className="relative overflow-hidden bg-cobalt-deep">
            <div aria-hidden className="absolute inset-0 atmos-torch opacity-90" />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.32]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(5,11,26,0.7) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between p-8 md:p-10">
              <div className="flex items-start justify-between">
                <LRMark size={18} color="#ECE8DD" />
                <span className="label-mono-sm text-foreground/55">
                  VOL. 01 · ISSUE 04 · KIN—PAR
                </span>
              </div>

              {/* Silhouette okapi en filigrane */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-50 md:right-12">
                <OkapiSilhouette size={180} color="#F5EDD6" />
              </div>

              <div>
                <span className="label-mono-sm text-foreground/55">
                  FEATURE
                </span>
                <div className="display-heading mt-2 text-4xl text-foreground md:text-5xl">
                  The other<br />
                  <span className="italic text-bone-ivory">emblem.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page droite — copy avec drop cap */}
          <div className="bg-cobalt-night p-8 md:p-10">
            <div className="flex items-center justify-between">
              <span className="label-mono-sm text-foreground/55">
                P. 04 — 011
              </span>
              <span className="label-mono-sm text-foreground/55">
                BY · LR EDITORIAL
              </span>
            </div>

            <h3 className="display-heading mt-6 text-2xl text-foreground md:text-3xl">
              Pourquoi nous regardons{" "}
              <span className="italic text-cobalt-mist">comme l'okapi.</span>
            </h3>

            {/* Texte 2 colonnes type magazine, drop cap initial */}
            <div className="mt-6 columns-1 gap-6 text-[13px] leading-[1.65] text-foreground/65 md:columns-2 md:text-sm">
              <p className="m-0">
                <span
                  className="display-heading float-left mr-2 mt-1 text-5xl text-torch md:text-6xl"
                  style={{ lineHeight: 0.85 }}
                >
                  L
                </span>
                orsqu'on parle des Léopards, on parle d'attaque, de vitesse,
                de saut. C'est juste. Mais ce n'est qu'une moitié du regard
                congolais.
              </p>
              <p className="mt-3">
                L'autre moitié est celle de l'okapi. Un animal forestier,
                discret, qui voit avant d'être vu. Endémique au nord-est du
                pays. Découvert tardivement par la science, en 1901.
              </p>
              <p className="mt-3">
                Là où le léopard chasse, l'okapi observe. Là où le débat
                s'enflamme, la donnée patiente. Léopards Radar travaille
                dans la deuxième logique.
              </p>
              <p className="mt-3">
                Cinquante ans après la sélection de 1974, le suivi du vivier
                congolais mérite mieux qu'un fil d'actualité. Il mérite une
                grille de lecture stable, une méthode partagée, un radar.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
              <span className="label-mono-sm text-foreground/55">
                Posture éditoriale · Manifeste
              </span>
              <LRMark size={20} color="#F5C518" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section principale ─────────────────────────────────────────────────────

export function HeritageSection() {
  return (
    <>
      <Tribute1974 />
      <OkapiManifesto />
    </>
  );
}

export default HeritageSection;
