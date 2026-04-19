import { Crosshair } from "lucide-react";

interface RadarMockPlayer {
  name: string;
  role: string;
  narrative: string;
  photoUrl: string;
  flag: string;
}

const MOCK: RadarMockPlayer[] = [
  {
    name: "Rayan Cherki",
    role: "AM · Lyon",
    narrative:
      "Mère congolaise. A déjà évoqué un intérêt pour les Léopards en interview.",
    photoUrl:
      "https://images.unsplash.com/photo-1502767089025-6572583495b9?w=200&q=80",
    flag: "🇫🇷",
  },
  {
    name: "Noah Mbamba",
    role: "CM · Leverkusen",
    narrative:
      "Né en Belgique, racines kinoises. Éligible via grand-père maternel.",
    photoUrl:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80",
    flag: "🇧🇪",
  },
  {
    name: "Désiré Doué",
    role: "FW · PSG",
    narrative:
      "Famille originaire de Mbuji-Mayi. Convoité aussi par la Côte d'Ivoire.",
    photoUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
    flag: "🇫🇷",
  },
];

export function RadarPagePreview() {
  return (
    <div className="relative w-full bg-background text-foreground">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary mb-2">
          <Crosshair className="h-3 w-3" />
          Scouting · Diaspora
        </div>
        <h3 className="font-serif text-3xl font-semibold leading-none">
          Le Radar.
        </h3>
        <p className="mt-2 text-xs text-muted max-w-sm">
          27 profils suivis. Mise à jour chaque dimanche.
        </p>
      </div>

      {/* Cards */}
      <div className="px-6 py-6 flex flex-col gap-3">
        {MOCK.map((p) => (
          <div
            key={p.name}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
              <img
                src={p.photoUrl}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-sm font-semibold truncate">
                  {p.name}
                </span>
                <span className="text-[10px] leading-none">{p.flag}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-primary/80 mt-0.5">
                {p.role}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted line-clamp-2">
                {p.narrative}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edge fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background/80 to-transparent"
      />
    </div>
  );
}

export default RadarPagePreview;
