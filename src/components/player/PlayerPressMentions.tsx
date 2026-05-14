import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PressReviewCard } from "@/components/press/PressReviewCard";
import type { DBPressItem } from "@/types/pressItem";

/**
 * Section affichée sur une fiche joueur quand au moins un press_item
 * a été tagué `player_id = ce joueur`. Sinon elle ne rend rien — on
 * n'affiche pas un bloc vide "Aucune mention" qui dégrade le profil.
 *
 * Limité à 6 items max (les 6 plus récents). Pour la liste complète,
 * la page /revue-de-presse propose un filtre par joueur (TBD Sprint 4).
 */
export function PlayerPressMentions({ playerId }: { playerId: number }) {
  const [items, setItems] = useState<DBPressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("press_items")
          .select("*")
          .eq("player_id", playerId)
          .order("published_at", { ascending: false })
          .limit(6);
        if (error) throw error;
        if (!cancelled) setItems((data as DBPressItem[]) ?? []);
      } catch (e) {
        console.warn("[PlayerPressMentions]", e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="container-site py-12 border-t border-border">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-serif text-3xl text-foreground">
          Cité dans la presse.
        </h2>
        <span className="text-xs font-mono uppercase tracking-wider text-muted">
          {items.length} {items.length > 1 ? "mentions" : "mention"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <PressReviewCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
