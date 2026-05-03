import { useEffect, useState } from "react";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyProgress {
  player_id: number;
  iso_year: number;
  iso_week: number;
  snapshot_date: string;
  has_previous: boolean;
  delta_goals: number | null;
  delta_assists: number | null;
  delta_games: number | null;
  delta_minutes: number | null;
  delta_value_eur: number | null;
  current_goals: number;
  current_assists: number;
  current_games: number;
}

/**
 * "Cette semaine" — bloc de progression du joueur entre deux snapshots
 * dimanche. Section discrète sur la fiche, juste après le hero, qui
 * matérialise la cadence éditoriale promise sur la home.
 *
 * Trois états :
 *   - Pas encore de snapshot historique (just bootstrap) → bloc explicite
 *     qui annonce que les deltas arrivent à la prochaine édition
 *   - Aucun changement entre les 2 dernières semaines → "Semaine calme"
 *   - Au moins un delta > 0 → mise en scène factuelle des progressions
 *
 * Voix anonyme, factuelle, pas d'avis. La data se montre, le visiteur juge.
 */
export function PlayerWeeklyProgress({ slug }: { slug: string }) {
  const [progress, setProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc(
          "get_player_weekly_progress",
          { player_slug: slug },
        );
        if (error) throw error;
        if (cancelled) return;
        setProgress(data?.[0] ?? null);
      } catch (e) {
        console.error("[PlayerWeeklyProgress]", e);
        if (!cancelled) setProgress(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return null;
  if (!progress) return null;

  const formattedDate = new Date(progress.snapshot_date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Premier snapshot : on annonce la cadence à venir, sans faux contenu
  if (!progress.has_previous) {
    return (
      <section className="container-site py-8 border-t border-border/50">
        <div className="flex items-start gap-3 max-w-2xl">
          <Calendar className="h-4 w-4 mt-1 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Cette semaine · Snapshot du {formattedDate}
            </p>
            <p className="mt-2 text-sm text-foreground/80 max-w-xl leading-relaxed">
              Premier snapshot enregistré. Les variations semaine après semaine
              apparaîtront à partir du <strong className="text-foreground">prochain
              dimanche</strong> — buts, passes décisives et valeur marché
              comparés à la semaine d'avant.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const noChange =
    (progress.delta_goals ?? 0) === 0 &&
    (progress.delta_assists ?? 0) === 0 &&
    (progress.delta_games ?? 0) === 0 &&
    (progress.delta_value_eur ?? 0) === 0;

  if (noChange) {
    return (
      <section className="container-site py-8 border-t border-border/50">
        <div className="flex items-start gap-3 max-w-2xl">
          <Minus className="h-4 w-4 mt-1 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Cette semaine · {formattedDate}
            </p>
            <p className="mt-2 text-sm text-foreground/80">
              Semaine calme. Aucune variation enregistrée depuis le dernier
              snapshot.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-site py-8 border-t border-border/50">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary/85 mb-4">
        Cette semaine · {formattedDate}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
        <DeltaTile label="Buts" value={progress.delta_goals} suffix="" />
        <DeltaTile label="Passes décisives" value={progress.delta_assists} suffix="" />
        <DeltaTile label="Matchs" value={progress.delta_games} suffix="" />
        <DeltaTile label="Valeur marché" value={progress.delta_value_eur} kind="euro" />
      </div>
    </section>
  );
}

function DeltaTile({
  label,
  value,
  suffix = "",
  kind = "int",
}: {
  label: string;
  value: number | null;
  suffix?: string;
  kind?: "int" | "euro";
}) {
  if (value === null) {
    return (
      <div className="rounded-card border border-border/60 bg-card/40 p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </div>
        <div className="mt-2 font-serif text-2xl text-muted">—</div>
      </div>
    );
  }

  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  const color = positive ? "text-success" : negative ? "text-alert" : "text-muted";

  let display: string;
  if (kind === "euro") {
    if (value === 0) display = "—";
    else if (Math.abs(value) >= 1_000_000)
      display =
        (value > 0 ? "+" : "−") +
        (Math.abs(value) / 1_000_000).toFixed(1).replace(/\.0$/, "") +
        " M €";
    else if (Math.abs(value) >= 1_000)
      display = (value > 0 ? "+" : "−") + Math.round(Math.abs(value) / 1_000) + " K €";
    else display = (value > 0 ? "+" : "−") + Math.abs(value) + " €";
  } else {
    display = value === 0 ? "—" : `${value > 0 ? "+" : ""}${value}${suffix}`;
  }

  return (
    <div className="rounded-card border border-border/60 bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className={`mt-2 inline-flex items-center gap-1.5 font-serif text-2xl ${color}`}>
        {value !== 0 ? <Icon className="h-4 w-4" aria-hidden /> : null}
        {display}
      </div>
    </div>
  );
}

export default PlayerWeeklyProgress;
