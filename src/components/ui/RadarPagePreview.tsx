import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { flagFor, formatMarketValue } from "@/lib/playerHelpers";

interface RadarTeaserPlayer {
  name: string;
  slug: string;
  current_club: string | null;
  position: string | null;
  market_value_eur: number | null;
  image_url: string | null;
  age: number | null;
  nationalities: string[];
  other_nationalities: string[];
}

function normalizeJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function RadarPagePreview() {
  const [players, setPlayers] = useState<RadarTeaserPlayer[]>([]);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [topRes, countRes] = await Promise.all([
        supabase
          .from("players")
          .select(
            "name, slug, current_club, position, market_value_eur, image_url, age, nationalities, other_nationalities",
          )
          .in("player_category", ["radar", "heritage"])
          .eq("tier", "tier1")
          .neq("eligibility_status", "ineligible")
          .gt("market_value_eur", 0)
          .order("market_value_eur", { ascending: false, nullsFirst: false })
          .limit(3),
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .in("player_category", ["radar", "heritage"])
          .eq("tier", "tier1")
          .neq("eligibility_status", "ineligible"),
      ]);

      if (cancelled) return;
      if (topRes.data) {
        setPlayers(
          topRes.data.map((p) => ({
            ...p,
            nationalities: normalizeJsonbArray(p.nationalities),
            other_nationalities: normalizeJsonbArray(p.other_nationalities),
          })) as RadarTeaserPlayer[],
        );
      }
      if (typeof countRes.count === "number") setCount(countRes.count);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {count !== null ? `${count} profils suivis.` : "Profils suivis."} Mise à jour chaque dimanche.
        </p>
      </div>

      {/* Cards */}
      <div className="px-6 py-6 flex flex-col gap-3">
        {players.map((p) => {
          const flags = [...p.nationalities, ...p.other_nationalities].slice(0, 3);
          return (
            <Link
              key={p.slug}
              to={`/player/${p.slug}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 hover:border-border-hover transition-colors"
            >
              <PlayerAvatar
                name={p.name}
                src={p.image_url}
                className="h-12 w-12 shrink-0 rounded-lg border border-border"
                initialsClassName="text-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-sm font-semibold truncate">
                    {p.name}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] leading-none">
                    {flags.map((f) => (
                      <span key={f} title={f}>{flagFor(f)}</span>
                    ))}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-primary/80 mt-0.5 truncate">
                  {p.position ? `${p.position}` : ""}
                  {p.position && p.current_club ? " · " : ""}
                  {p.current_club ?? ""}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted">
                  {formatMarketValue(p.market_value_eur)}
                  {p.age ? ` · ${p.age} ans` : ""}
                </p>
              </div>
            </Link>
          );
        })}
        {players.length === 0 && (
          <p className="text-xs text-muted">Profils à venir.</p>
        )}
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
