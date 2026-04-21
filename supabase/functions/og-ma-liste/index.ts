// Edge function: og-ma-liste
// Generates a 1200×630 OG image for /ma-liste/{slug} using Satori + Resvg.
// Cached 24h via Cache-Control header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import satori from "https://esm.sh/satori@0.10.13";
import { Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import initWasm from "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm?module";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

let resvgReady: Promise<void> | null = null;
async function ensureResvg() {
  if (!resvgReady) {
    // @ts-expect-error wasm module type
    resvgReady = (Resvg as { initWasm: (m: unknown) => Promise<void> }).initWasm(initWasm);
  }
  return resvgReady;
}

// Cache fonts in module scope
let fontCache: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  // Inter Bold from Google Fonts
  const fontRes = await fetch(
    "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
  );
  if (!fontRes.ok) throw new Error(`font fetch failed ${fontRes.status}`);
  fontCache = await fontRes.arrayBuffer();
  return fontCache;
}

interface XISlot {
  position: string;
  player_slug: string | null;
  player_name: string | null;
}

interface BenchEntry {
  player_slug: string;
  player_name: string;
  position: string;
}

interface UserListRow {
  slug: string;
  pseudo: string | null;
  formation: string;
  starting_xi: XISlot[];
  bench: BenchEntry[];
  avg_age: number | null;
  radar_count: number;
  total_market_value_eur: number | null;
}

const lastName = (name: string | null) =>
  (name?.split(" ").pop() ?? "").toUpperCase();

const formatValue = (eur: number) => {
  if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)}Mds €`;
  if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)}M €`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)}K €`;
  return `${eur} €`;
};

function buildSvgTree(list: UserListRow) {
  const xiNames = (list.starting_xi ?? [])
    .map((s) => lastName(s.player_name))
    .filter(Boolean)
    .slice(0, 11);
  const benchNames = (list.bench ?? [])
    .map((b) => lastName(b.player_name))
    .filter(Boolean)
    .slice(0, 15);

  const stats = [
    { label: "ÂGE MOYEN", value: String(list.avg_age ?? "—") },
    {
      label: "VALEUR",
      value: list.total_market_value_eur
        ? formatValue(list.total_market_value_eur)
        : "—",
    },
    { label: "RADAR", value: String(list.radar_count ?? 0) },
    { label: "FORMATION", value: list.formation },
  ];

  return {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        background: "#0A0A0A",
        color: "#fff",
        fontFamily: "Inter",
      },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: {
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 40px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                  },
                  children: "LÉOPARDS RADAR",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    background: "#FFC107",
                    color: "#0A0A0A",
                    padding: "6px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    borderRadius: 999,
                  },
                  children: "MA LISTE · MONDIAL 2026",
                },
              },
            ],
          },
        },
        // Body
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              display: "flex",
              padding: "32px 40px",
              gap: 32,
            },
            children: [
              // LEFT
              {
                type: "div",
                props: {
                  style: {
                    width: 480,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: 44,
                                fontWeight: 700,
                                lineHeight: 1.1,
                                fontStyle: "italic",
                              },
                              children: "Ma sélection des 26",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                marginTop: 12,
                                fontSize: 16,
                                color: "#9A9A9A",
                              },
                              children: list.pseudo
                                ? `Formation ${list.formation} · ${list.pseudo}`
                                : `Formation ${list.formation}`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 16,
                        },
                        children: stats.map((s) => ({
                          type: "div",
                          props: {
                            style: {
                              width: 200,
                              display: "flex",
                              flexDirection: "column",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: { fontSize: 28, fontWeight: 700 },
                                  children: s.value,
                                },
                              },
                              {
                                type: "div",
                                props: {
                                  style: {
                                    fontSize: 10,
                                    color: "#9A9A9A",
                                    letterSpacing: "0.2em",
                                    marginTop: 2,
                                  },
                                  children: s.label,
                                },
                              },
                            ],
                          },
                        })),
                      },
                    },
                  ],
                },
              },
              // RIGHT
              {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 11,
                          color: "#FFC107",
                          letterSpacing: "0.25em",
                        },
                        children: "XI TITULAIRE",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        },
                        children: xiNames.map((n) => ({
                          type: "div",
                          props: {
                            style: {
                              padding: "6px 10px",
                              background: "rgba(0,166,81,0.2)",
                              border: "1px solid #00A651",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                            },
                            children: n,
                          },
                        })),
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 11,
                          color: "#FFC107",
                          letterSpacing: "0.25em",
                          marginTop: 8,
                        },
                        children: "BANC · 15",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                        },
                        children: benchNames.map((n) => ({
                          type: "div",
                          props: {
                            style: {
                              padding: "4px 8px",
                              background: "rgba(255,255,255,0.06)",
                              borderRadius: 4,
                              fontSize: 10,
                              color: "#fff",
                            },
                            children: n,
                          },
                        })),
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Footer
        {
          type: "div",
          props: {
            style: {
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 40px",
              fontSize: 11,
              color: "#9A9A9A",
              letterSpacing: "0.15em",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            },
            children: [
              {
                type: "div",
                props: { children: "🇨🇩 leopardsradar.com" },
              },
              {
                type: "div",
                props: { children: `/ma-liste/${list.slug}` },
              },
            ],
          },
        },
      ],
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "missing slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("user_lists")
      .select(
        "slug, pseudo, formation, starting_xi, bench, avg_age, radar_count, total_market_value_eur",
      )
      .eq("slug", slug)
      .eq("is_submitted", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fontData = await loadFont();
    const tree = buildSvgTree(data as UserListRow);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(tree as any, {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontData, weight: 400, style: "normal" },
        { name: "Inter", data: fontData, weight: 700, style: "normal" },
      ],
    });

    await ensureResvg();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resvg = new (Resvg as any)(svg, {
      fitTo: { mode: "width", value: 1200 },
    });
    const png = resvg.render().asPng();

    return new Response(png, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("og-ma-liste error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
