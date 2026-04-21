import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { usePlayers } from "@/hooks/usePlayers";
import { formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";

type PosKey = "Goalkeeper" | "Defender" | "Midfield" | "Attack";

const BENCH_QUOTAS: Record<PosKey, number> = {
  Goalkeeper: 2,
  Defender: 5,
  Midfield: 4,
  Attack: 4,
};

const POS_SHORT: Record<PosKey, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Attack: "ATT",
};

const POS_LABEL: Record<PosKey, string> = {
  Goalkeeper: "Gardiens",
  Defender: "Défenseurs",
  Midfield: "Milieux",
  Attack: "Attaquants",
};

const POS_ORDER: PosKey[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];

export function BenchBuilder() {
  const bench = useMaListeStore((s) => s.bench);
  const addToBench = useMaListeStore((s) => s.addToBench);
  const removeFromBench = useMaListeStore((s) => s.removeFromBench);
  const getAvailablePlayers = useMaListeStore((s) => s.getAvailablePlayers);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const nextStep = useMaListeStore((s) => s.nextStep);

  const { players: allPlayers, loading } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
  });

  const available = useMemo(
    () => (allPlayers ? getAvailablePlayers(allPlayers) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPlayers, bench, getAvailablePlayers],
  );

  // Group available + already-on-bench players by position
  const grouped = useMemo(() => {
    const out: Record<PosKey, DBPlayer[]> = {
      Goalkeeper: [],
      Defender: [],
      Midfield: [],
      Attack: [],
    };
    const all = [...available, ...bench];
    for (const p of all) {
      const pos = (p.position as PosKey) ?? null;
      if (pos && out[pos]) out[pos].push(p);
    }
    for (const k of POS_ORDER) {
      out[k].sort((a, b) => {
        if (a.player_category !== b.player_category)
          return a.player_category === "roster" ? -1 : 1;
        return (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0);
      });
    }
    return out;
  }, [available, bench]);

  const benchCounts = useMemo(() => {
    const c: Record<PosKey, number> = {
      Goalkeeper: 0,
      Defender: 0,
      Midfield: 0,
      Attack: 0,
    };
    for (const p of bench) {
      const pos = p.position as PosKey;
      if (c[pos] != null) c[pos]++;
    }
    return c;
  }, [bench]);

  const isOnBench = (slug: string) => bench.some((p) => p.slug === slug);

  const togglePlayer = (player: DBPlayer) => {
    if (isOnBench(player.slug)) {
      removeFromBench(player.slug);
      return;
    }
    const pos = player.position as PosKey;
    const quota = BENCH_QUOTAS[pos] ?? 0;
    if (benchCounts[pos] >= quota) return;
    if (bench.length >= 15) return;
    addToBench(player);
  };

  const allQuotasMet = POS_ORDER.every(
    (pos) => benchCounts[pos] === BENCH_QUOTAS[pos],
  );
  const complete = bench.length === 15 && allQuotasMet;

  const [openSection, setOpenSection] = useState<PosKey>("Goalkeeper");

  return (
    <section className="container-site max-w-4xl py-12 md:py-16">
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
            15 joueurs : 2 GK, 5 DEF, 4 MIL, 4 ATT.
          </p>
        </div>

        {/* Sticky progress strip */}
        <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-y border-border -mx-4 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Banc · {bench.length}/15
            </span>
            <div className="flex gap-2">
              {POS_ORDER.map((pos) => {
                const c = benchCounts[pos];
                const q = BENCH_QUOTAS[pos];
                const ok = c === q;
                return (
                  <span
                    key={pos}
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded",
                      ok
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/10 text-muted",
                    )}
                  >
                    {POS_SHORT[pos]} {c}/{q}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${(bench.length / 15) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 4 grouped sections */}
        <div className="space-y-3">
          {POS_ORDER.map((pos) => {
            const list = grouped[pos];
            const c = benchCounts[pos];
            const q = BENCH_QUOTAS[pos];
            const isOpen = openSection === pos;
            return (
              <div
                key={pos}
                className="rounded-card border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenSection(isOpen ? ("" as PosKey) : pos)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-bold",
                        c === q
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/10 text-muted",
                      )}
                    >
                      {c === q ? <Check className="h-4 w-4" /> : c}
                    </span>
                    <div>
                      <h3 className="font-serif text-xl text-foreground">
                        {POS_LABEL[pos]}
                      </h3>
                      <p className="text-xs text-muted">
                        Choisis {q} joueurs · {c}/{q} sélectionnés
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                    {isOpen ? "—" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-3 max-h-[420px] overflow-y-auto">
                    {loading && (
                      <p className="text-sm text-muted text-center py-8">
                        Chargement…
                      </p>
                    )}
                    {!loading && list.length === 0 && (
                      <p className="text-sm text-muted text-center py-8">
                        Aucun joueur disponible à ce poste.
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {list.map((player) => {
                        const checked = isOnBench(player.slug);
                        const quotaFull = c >= q && !checked;
                        return (
                          <li key={player.slug}>
                            <button
                              onClick={() => togglePlayer(player)}
                              disabled={quotaFull}
                              className={cn(
                                "w-full flex items-center gap-3 p-2.5 rounded-md border transition-all text-left",
                                checked
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-background hover:border-primary/50",
                                quotaFull && "opacity-40 cursor-not-allowed",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-5 w-5 rounded border flex items-center justify-center shrink-0",
                                  checked
                                    ? "bg-primary border-primary"
                                    : "border-muted/40",
                                )}
                              >
                                {checked && (
                                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                )}
                              </span>
                              <PlayerAvatar
                                name={player.name}
                                src={player.image_url}
                                className="h-9 w-9 rounded-full shrink-0"
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
                                  {player.current_club ?? "—"}
                                  {player.market_value_eur
                                    ? ` · ${formatMarketValue(player.market_value_eur)}`
                                    : ""}
                                  {player.caps_rdc
                                    ? ` · ${player.caps_rdc} caps`
                                    : ""}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          {!complete && bench.length > 0 && (
            <p className="inline-flex items-center gap-2 text-xs text-muted">
              <AlertCircle className="h-3.5 w-3.5" />
              {15 - bench.length} joueurs manquants
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
              : `Banc · ${bench.length}/15`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
