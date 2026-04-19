import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { usePlayers } from "@/hooks/usePlayers";
import { formatMarketValue, POSITION_LABEL } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

type PosKey = "Goalkeeper" | "Defender" | "Midfield" | "Attack";

const BENCH_MINS: Record<PosKey, number> = {
  Goalkeeper: 2,
  Defender: 3,
  Midfield: 2,
  Attack: 1,
};

const POS_SHORT: Record<PosKey, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Attack: "ATT",
};

const POS_ORDER: PosKey[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];

export function BenchBuilder() {
  const bench = useMaListeStore((s) => s.bench);
  const addToBench = useMaListeStore((s) => s.addToBench);
  const removeFromBench = useMaListeStore((s) => s.removeFromBench);
  const getAvailablePlayers = useMaListeStore((s) => s.getAvailablePlayers);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const nextStep = useMaListeStore((s) => s.nextStep);
  const isBenchComplete = useMaListeStore((s) => s.isBenchComplete);

  const { players: allPlayers, loading } = usePlayers({
    categories: ["roster", "radar"],
    limit: 1000,
  });

  const [filter, setFilter] = useState<"all" | PosKey>("all");

  const available = useMemo(
    () => (allPlayers ? getAvailablePlayers(allPlayers) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPlayers, bench, getAvailablePlayers],
  );

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? available
        : available.filter((p) => p.position === filter);
    return [...list].sort((a, b) => {
      if (a.player_category !== b.player_category) {
        return a.player_category === "roster" ? -1 : 1;
      }
      return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
    });
  }, [available, filter]);

  const benchCounts = useMemo(() => {
    const counts: Record<PosKey, number> = {
      Goalkeeper: 0,
      Defender: 0,
      Midfield: 0,
      Attack: 0,
    };
    for (const p of bench) {
      if (p.position) counts[p.position as PosKey]++;
    }
    return counts;
  }, [bench]);

  const minsOK = POS_ORDER.every((pos) => benchCounts[pos] >= BENCH_MINS[pos]);
  const complete = isBenchComplete();

  return (
    <section className="container-site max-w-6xl py-12 md:py-16">
      <div className="space-y-10">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousStep}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-1 w-8 rounded-full bg-primary" />
            ))}
            <span className="h-1 w-8 rounded-full bg-border" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            4/5 · LE BANC
          </span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Compose ton banc.
          </h1>
          <p className="mt-3 text-muted-light">
            15 joueurs sur le banc. Min 2 GK, 3 DEF, 2 MID, 1 ATT.
          </p>
        </div>

        {/* Position quotas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POS_ORDER.map((pos) => {
            const count = benchCounts[pos];
            const min = BENCH_MINS[pos];
            const isOK = count >= min;
            return (
              <div
                key={pos}
                className={cn(
                  "rounded-card border p-4 flex items-center justify-between",
                  isOK
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    {POS_SHORT[pos]}
                  </p>
                  <p className="mt-1 font-serif text-2xl text-foreground">
                    {count}
                    <span className="text-muted text-base">/{min}</span>
                  </p>
                </div>
                {isOK && (
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Joueurs sur le banc
            </span>
            <span className="font-serif text-lg text-foreground">
              {bench.length} <span className="text-muted text-sm">/ 15</span>
            </span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${(bench.length / 15) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT: current bench */}
          <div className="rounded-card border border-border bg-card p-5">
            <h3 className="font-serif text-xl text-foreground mb-4">
              Ton banc ({bench.length})
            </h3>
            {bench.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">
                Aucun joueur sélectionné. Choisis dans la liste à droite.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {bench.map((player) => (
                  <li
                    key={player.slug}
                    className="flex items-center gap-3 p-2 rounded bg-background border border-border"
                  >
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className="h-10 w-10 rounded-full shrink-0"
                      initialsClassName="text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {player.name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {player.position
                          ? POSITION_LABEL[player.position as DBPosition]
                          : "—"}{" "}
                        · {player.current_club ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromBench(player.slug)}
                      className="text-xs text-alert hover:text-alert/80 uppercase tracking-wider"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT: available */}
          <div className="rounded-card border border-border bg-card p-5">
            <h3 className="font-serif text-xl text-foreground mb-4">
              Joueurs disponibles
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(["all", ...POS_ORDER] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted hover:text-foreground",
                  )}
                >
                  {f === "all" ? "Tous" : POS_SHORT[f]}
                </button>
              ))}
            </div>
            <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {loading && (
                <li className="text-sm text-muted text-center py-8">
                  Chargement…
                </li>
              )}
              {!loading && filtered.length === 0 && (
                <li className="text-sm text-muted text-center py-8">
                  Aucun joueur disponible.
                </li>
              )}
              {filtered.map((player) => (
                <li key={player.slug}>
                  <button
                    onClick={() => addToBench(player)}
                    disabled={bench.length >= 15}
                    className="w-full flex items-center gap-3 p-2 rounded bg-background border border-border hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className="h-10 w-10 rounded-full shrink-0"
                      initialsClassName="text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate flex items-center gap-2">
                        <span className="truncate">{player.name}</span>
                        {player.player_category === "radar" && (
                          <span className="text-[9px] uppercase tracking-wider text-primary border border-primary/30 rounded px-1 py-0.5 shrink-0">
                            Radar
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {player.position
                          ? POSITION_LABEL[player.position as DBPosition]
                          : "—"}{" "}
                        · {player.current_club ?? "—"}
                        {player.market_value_eur
                          ? ` · ${formatMarketValue(player.market_value_eur)}`
                          : ""}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          {!minsOK && bench.length > 0 && (
            <p className="inline-flex items-center gap-2 text-xs text-alert">
              <AlertCircle className="h-3.5 w-3.5" />
              Minimums par poste non respectés
            </p>
          )}
          <Button
            size="lg"
            disabled={!complete}
            onClick={nextStep}
            className="gap-2"
          >
            {complete
              ? "Choisir mon capitaine"
              : `${15 - bench.length} joueurs manquants`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
