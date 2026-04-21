// Edge Function: batch-migrate-photos
// Inline scrape + upload (no fan-out HTTP calls to other edge functions to avoid rate limits).
// Processes up to MAX_PER_RUN players per invocation. Call multiple times to drain the queue.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const ACCEPT_LANG = "fr-FR,fr;q=0.9,en;q=0.8";

const MAX_PER_RUN = 80;
const CONCURRENCY = 6;

interface PlayerRow {
  id: number;
  name: string;
  slug: string;
  transfermarkt_id: string | null;
  image_url: string | null;
}

function extractImageFromHtml(html: string): string | null {
  const m1 = html.match(
    /<img[^>]+class="[^"]*data-header__profile-image[^"]*"[^>]*src="([^"]+)"/i,
  );
  if (m1?.[1]) return m1[1];
  const m2 = html.match(
    /<img[^>]+src="([^"]+)"[^>]+class="[^"]*data-header__profile-image[^"]*"/i,
  );
  if (m2?.[1]) return m2[1];
  const og = html.match(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
  );
  if (og?.[1]) return og[1];
  return null;
}

async function fetchAvatarPng(name: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name,
      )}&size=400&background=00A651&color=ffffff&bold=true&format=png`,
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function processPlayer(
  player: PlayerRow,
  supabase: ReturnType<typeof createClient>,
): Promise<{
  slug: string;
  success: boolean;
  used_fallback?: boolean;
  reason?: string;
}> {
  let bytes: ArrayBuffer | null = null;
  let usedFallback = false;

  if (player.transfermarkt_id) {
    const tmUrl = `https://www.transfermarkt.com/a/profil/spieler/${player.transfermarkt_id}`;
    try {
      const r = await fetch(tmUrl, {
        headers: {
          "User-Agent": UA,
          "Accept-Language": ACCEPT_LANG,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });
      if (r.ok) {
        const html = await r.text();
        const imgUrl = extractImageFromHtml(html);
        if (imgUrl) {
          const ir = await fetch(imgUrl, {
            headers: {
              "User-Agent": UA,
              "Accept-Language": ACCEPT_LANG,
              Referer: "https://www.transfermarkt.com/",
            },
          });
          if (ir.ok) bytes = await ir.arrayBuffer();
        }
      }
    } catch (_e) {
      /* fallback below */
    }
  }

  if (!bytes) {
    bytes = await fetchAvatarPng(player.name);
    usedFallback = true;
  }
  if (!bytes) return { slug: player.slug, success: false, reason: "no image" };

  const ext = usedFallback ? "png" : "jpg";
  const ct = usedFallback ? "image/png" : "image/jpeg";
  const path = `portraits/${player.slug}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("player-photos")
    .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "604800" });
  if (upErr)
    return { slug: player.slug, success: false, reason: `upload: ${upErr.message}` };

  const { data: pub } = supabase.storage
    .from("player-photos")
    .getPublicUrl(path);

  const { error: updErr } = await supabase
    .from("players")
    .update({ image_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", player.id);
  if (updErr)
    return { slug: player.slug, success: false, reason: `db: ${updErr.message}` };

  return { slug: player.slug, success: true, used_fallback: usedFallback };
}

async function runPool<T, R>(
  items: T[],
  worker: (it: T) => Promise<R>,
  size: number,
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const runners = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // --- AuthN/AuthZ: require an authenticated admin caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: players, error } = await supabase
      .from("players")
      .select("id, slug, name, transfermarkt_id, image_url")
      .or("image_url.is.null,image_url.ilike.%transfermarkt%")
      .order("id", { ascending: true })
      .limit(MAX_PER_RUN);

    if (error) throw error;
    const list = (players ?? []) as PlayerRow[];

    const results = await runPool(list, (p) => processPlayer(p, supabase), CONCURRENCY);

    let success = 0;
    let failed = 0;
    let fallback = 0;
    const errs: { slug: string; reason?: string }[] = [];
    for (const r of results) {
      if (r.success) {
        success++;
        if (r.used_fallback) fallback++;
      } else {
        failed++;
        errs.push({ slug: r.slug, reason: r.reason });
      }
    }

    return new Response(
      JSON.stringify({
        processed: list.length,
        success,
        failed,
        used_fallback: fallback,
        errors: errs.slice(0, 30),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("batch-migrate-photos error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
