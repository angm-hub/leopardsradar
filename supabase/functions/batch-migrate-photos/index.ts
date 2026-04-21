// Edge Function: batch-migrate-photos
// Iterates over players whose photos are missing or hosted on Transfermarkt
// and calls migrate-player-photo for each in batches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 10;
const PAUSE_MS = 2000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MigrateResult {
  slug: string;
  success: boolean;
  reason?: string;
  used_fallback?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find players to migrate: null OR transfermarkt-hosted URL
    const { data: players, error } = await supabase
      .from("players")
      .select("id, slug, name, transfermarkt_id, image_url")
      .or("image_url.is.null,image_url.ilike.%transfermarkt%")
      .order("id", { ascending: true });

    if (error) throw error;
    const list = players ?? [];
    console.log(`[batch] ${list.length} players to migrate`);

    const results: MigrateResult[] = [];
    let success = 0;
    let failed = 0;
    let fallback = 0;

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const chunk = list.slice(i, i + BATCH_SIZE);
      console.log(
        `[batch] processing ${i + 1}-${i + chunk.length} / ${list.length}`,
      );

      const settled = await Promise.allSettled(
        chunk.map(async (p) => {
          const res = await fetch(
            `${supabaseUrl}/functions/v1/migrate-player-photo`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({ player_id: p.id }),
            },
          );
          const json = await res.json().catch(() => ({}));
          return {
            slug: p.slug,
            success: !!json.success,
            reason: json.reason,
            used_fallback: json.used_fallback,
          } as MigrateResult;
        }),
      );

      for (const s of settled) {
        if (s.status === "fulfilled") {
          results.push(s.value);
          if (s.value.success) {
            success++;
            if (s.value.used_fallback) fallback++;
          } else {
            failed++;
          }
        } else {
          failed++;
          results.push({
            slug: "unknown",
            success: false,
            reason: String(s.reason),
          });
        }
      }

      if (i + BATCH_SIZE < list.length) {
        await sleep(PAUSE_MS);
      }
    }

    const errors = results
      .filter((r) => !r.success)
      .slice(0, 50)
      .map((r) => ({ slug: r.slug, reason: r.reason }));

    return new Response(
      JSON.stringify({
        processed: list.length,
        success,
        failed,
        used_fallback: fallback,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("batch-migrate-photos error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
