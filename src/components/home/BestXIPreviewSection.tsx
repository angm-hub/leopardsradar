import { Link } from "react-router-dom";
import SectionWithMockup from "./SectionWithMockup";
import BrowserFrame from "@/components/ui/BrowserFrame";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useBestXI } from "@/hooks/useBestXI";

function BestXIList() {
  const { data, loading } = useBestXI();

  if (loading) {
    return (
      <div className="bg-background p-6 space-y-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-background p-10 text-center">
        <p className="font-serif text-xl text-foreground">
          Première composition à venir
        </p>
        <p className="mt-2 text-sm text-muted">
          Le Best XI Diaspora arrive bientôt.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary">
          Best XI · {data.formation}
        </p>
        <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight">
          {data.title}
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {data.slots.map((slot, idx) => {
          const p = data.playersById[slot.player_id];
          if (!p) return null;
          return (
            <li key={`${slot.position}-${idx}`}>
              <Link
                to={`/player/${p.slug}`}
                className="flex items-center gap-3 px-6 py-2.5 hover:bg-card transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary w-10 shrink-0">
                  {slot.position}
                </span>
                <PlayerAvatar
                  name={p.name}
                  src={p.image_url}
                  className="h-9 w-9 shrink-0 rounded-full border border-border"
                  initialsClassName="text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm font-semibold truncate">
                    {p.name}
                  </p>
                  {p.current_club && (
                    <p className="text-[11px] text-muted truncate">
                      {p.current_club}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BestXIPreviewSection() {
  return (
    <div className="relative">
      <ResidualGradient position="top-bottom" />
      <SectionWithMockup
        className="bg-card/30"
        reverseLayout
        badge="BEST XI DIASPORA"
        title={<>Notre composition rêvée, chaque semaine.</>}
        description="Si on alignait le meilleur XI possible des Léopards en 2026, roster actuel + diaspora éligible confondus, ça donnerait quoi ? On fait l'exercice tous les vendredis."
        ctaLabel="Voir toutes les compositions"
        ctaHref="/best-xi"
        secondaryImageSrc="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80"
        primaryNode={
          <BrowserFrame url="leopardsradar.com/best-xi">
            <BestXIList />
          </BrowserFrame>
        }
      />
    </div>
  );
}

export default BestXIPreviewSection;
