// Edge Function: migrate-player-photo
// Scrapes a player's portrait from Transfermarkt, uploads it to Supabase Storage,
// and updates the players.image_url column.
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

interface ReqBody {
  player_id?: number;
  transfermarkt_id?: string;
}

interface PlayerRow {
  id: number;
  name: string;
  slug: string;
  transfermarkt_id: string | null;
  image_url: string | null;
}

function extractImageFromHtml(html: string): string | null {
  // 1. Profile image class
  const profileMatch = html.match(
    /<img[^>]+class="[^"]*data-header__profile-image[^"]*"[^>]*src="([^"]+)"/i,
  );
  if (profileMatch?.[1]) return profileMatch[1];

  // 1b. Same with src before class
  const profileMatch2 = html.match(
    /<img[^>]+src="([^"]+)"[^>]+class="[^"]*data-header__profile-image[^"]*"/i,
  );
  if (profileMatch2?.[1]) return profileMatch2[1];

  // 2. og:image meta
  const og = html.match(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
  );
  if (og?.[1]) return og[1];

  // 3. twitter:image
  const tw = html.match(
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
  );
  if (tw?.[1]) return tw[1];

  return null;
}

async function fetchAvatarFallback(name: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name,
    )}&size=400&background=00A651&color=ffffff&bold=true&format=png`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    if (!body.player_id && !body.transfermarkt_id) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: "missing player_id or transfermarkt_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch player
    let query = supabase
      .from("players")
      .select("id, name, slug, transfermarkt_id, image_url")
      .limit(1);
    if (body.player_id) query = query.eq("id", body.player_id);
    else query = query.eq("transfermarkt_id", body.transfermarkt_id);

    const { data: players, error: pErr } = await query;
    if (pErr) throw pErr;
    const player = players?.[0] as PlayerRow | undefined;
    if (!player) {
      return new Response(
        JSON.stringify({ success: false, reason: "player not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let imageBytes: ArrayBuffer | null = null;
    let sourceTried = "none";
    let usedFallback = false;

    // Try to scrape Transfermarkt — canonical URL is /spieler-slug/profil/spieler/{id}
    // but TM accepts /a/profil/spieler/{id} as a redirect. Use that as a stable form.
    if (player.transfermarkt_id) {
      const tmUrl = `https://www.transfermarkt.com/a/profil/spieler/${player.transfermarkt_id}`;
      sourceTried = tmUrl;
      try {
        const htmlRes = await fetch(tmUrl, {
          headers: {
            "User-Agent": UA,
            "Accept-Language": ACCEPT_LANG,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const imgUrl = extractImageFromHtml(html);
          if (imgUrl) {
            const imgRes = await fetch(imgUrl, {
              headers: {
                "User-Agent": UA,
                "Accept-Language": ACCEPT_LANG,
                Referer: "https://www.transfermarkt.com/",
              },
            });
            if (imgRes.ok) {
              imageBytes = await imgRes.arrayBuffer();
            } else {
              console.log(
                `[${player.slug}] image fetch failed: ${imgRes.status}`,
              );
            }
          } else {
            console.log(`[${player.slug}] no image url found in html`);
          }
        } else {
          console.log(`[${player.slug}] tm html ${htmlRes.status}`);
        }
      } catch (e) {
        console.log(`[${player.slug}] scrape error:`, (e as Error).message);
      }
    }

    // Fallback: ui-avatars
    if (!imageBytes) {
      imageBytes = await fetchAvatarFallback(player.name);
      usedFallback = true;
    }

    if (!imageBytes) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: "no image available",
          source: sourceTried,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const path = `portraits/${player.slug}.${usedFallback ? "png" : "jpg"}`;
    const contentType = usedFallback ? "image/png" : "image/jpeg";

    const { error: upErr } = await supabase.storage
      .from("player-photos")
      .upload(path, imageBytes, {
        contentType,
        upsert: true,
        cacheControl: "604800",
      });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from("player-photos")
      .getPublicUrl(path);

    const newUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("players")
      .update({ image_url: newUrl, updated_at: new Date().toISOString() })
      .eq("id", player.id);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        success: true,
        new_url: newUrl,
        used_fallback: usedFallback,
        slug: player.slug,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("migrate-player-photo error:", msg);
    return new Response(
      JSON.stringify({ success: false, reason: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
