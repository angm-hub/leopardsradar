import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer } from "@/types/dbPlayer";
import type { Formation } from "@/types/maListe";

interface SubmitListParams {
  sessionId: string;
  formation: Formation;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer;
  email?: string | null;
  pseudo?: string | null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

const randomSuffix = () => Math.random().toString(36).slice(2, 6);

const buildSlug = (pseudo?: string | null) => {
  const base = pseudo ? slugify(pseudo) : "liste";
  return `${base || "liste"}-${randomSuffix()}`;
};

export async function submitUserList(params: SubmitListParams) {
  const xiPlayers = Object.values(params.startingXI).filter(
    (p): p is DBPlayer => p !== null,
  );
  const allPlayers = [...xiPlayers, ...params.bench];

  const radarCount = allPlayers.filter(
    (p) => p.player_category === "radar",
  ).length;
  const rosterCount = allPlayers.filter(
    (p) => p.player_category === "roster",
  ).length;

  const ages = allPlayers.map((p) => p.age ?? 0).filter((a) => a > 0);
  const avgAge =
    ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

  const totalMarketValue = allPlayers.reduce(
    (sum, p) => sum + (p.market_value_eur ?? 0),
    0,
  );

  const startingXIPayload = Object.entries(params.startingXI).map(
    ([position, player]) => ({
      position,
      player_slug: player?.slug ?? null,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    }),
  );

  const benchPayload = params.bench.map((p) => ({
    player_slug: p.slug,
    player_name: p.name,
    player_id: p.id,
    position: p.position,
  }));

  // Try to insert with a unique slug (retry up to 3 times on collision)
  let slug = buildSlug(params.pseudo);
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_lists")
      .insert({
        session_id: params.sessionId,
        email: params.email ?? null,
        pseudo: params.pseudo ?? null,
        slug,
        formation: params.formation,
        starting_xi: startingXIPayload,
        bench: benchPayload,
        captain_id: params.captain.id,
        radar_count: radarCount,
        roster_count: rosterCount,
        avg_age: Number(avgAge.toFixed(1)),
        total_market_value_eur: totalMarketValue,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        locale: typeof navigator !== "undefined" ? navigator.language : "fr",
        referrer: typeof document !== "undefined" ? document.referrer : null,
        is_submitted: true,
      })
      .select()
      .single();

    if (!error) return { ...data, slug } as { id: string; slug: string };
    lastError = error;
    // 23505 = unique violation → retry with new suffix
    if ((error as { code?: string }).code === "23505") {
      slug = buildSlug(params.pseudo);
      continue;
    }
    break;
  }
  console.error("[submitUserList]", lastError);
  throw lastError;
}

export async function fetchListBySlug(slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_lists")
    .select("*")
    .eq("slug", slug)
    .eq("is_submitted", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getListInsights() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_lists")
    .select("formation, radar_count, avg_age, total_market_value_eur, captain_id")
    .eq("is_submitted", true);

  if (error || !data || data.length === 0) return null;

  const totalLists = data.length;
  const formationCounts: Record<string, number> = {};
  for (const l of data) {
    formationCounts[l.formation] = (formationCounts[l.formation] ?? 0) + 1;
  }

  return {
    totalLists,
    formationBreakdown: Object.entries(formationCounts)
      .map(([formation, count]) => ({
        formation,
        count,
        percentage: (count / totalLists) * 100,
      }))
      .sort((a, b) => b.count - a.count),
    avgRadarPerList:
      data.reduce((sum: number, l: { radar_count: number }) => sum + (l.radar_count ?? 0), 0) /
      totalLists,
    avgAgeAcrossLists:
      data.reduce((sum: number, l: { avg_age: number }) => sum + Number(l.avg_age ?? 0), 0) /
      totalLists,
  };
}

// Stub for prompt 4
export async function getTopPickedPlayers() {
  return [];
}

  const xiPlayers = Object.values(params.startingXI).filter(
    (p): p is DBPlayer => p !== null,
  );
  const allPlayers = [...xiPlayers, ...params.bench];

  const radarCount = allPlayers.filter(
    (p) => p.player_category === "radar",
  ).length;
  const rosterCount = allPlayers.filter(
    (p) => p.player_category === "roster",
  ).length;

  const ages = allPlayers.map((p) => p.age ?? 0).filter((a) => a > 0);
  const avgAge =
    ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

  const totalMarketValue = allPlayers.reduce(
    (sum, p) => sum + (p.market_value_eur ?? 0),
    0,
  );

  const startingXIPayload = Object.entries(params.startingXI).map(
    ([position, player]) => ({
      position,
      player_slug: player?.slug ?? null,
      player_name: player?.name ?? null,
      player_id: player?.id ?? null,
    }),
  );

  const benchPayload = params.bench.map((p) => ({
    player_slug: p.slug,
    player_name: p.name,
    player_id: p.id,
    position: p.position,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_lists")
    .insert({
      session_id: params.sessionId,
      email: params.email ?? null,
      formation: params.formation,
      starting_xi: startingXIPayload,
      bench: benchPayload,
      captain_id: params.captain.id,
      radar_count: radarCount,
      roster_count: rosterCount,
      avg_age: Number(avgAge.toFixed(1)),
      total_market_value_eur: totalMarketValue,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      locale:
        typeof navigator !== "undefined" ? navigator.language : "fr",
      referrer:
        typeof document !== "undefined" ? document.referrer : null,
      is_submitted: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[submitUserList]", error);
    throw error;
  }
  return data;
}

export async function getListInsights() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_lists")
    .select("formation, radar_count, avg_age, total_market_value_eur, captain_id")
    .eq("is_submitted", true);

  if (error || !data || data.length === 0) return null;

  const totalLists = data.length;
  const formationCounts: Record<string, number> = {};
  for (const l of data) {
    formationCounts[l.formation] = (formationCounts[l.formation] ?? 0) + 1;
  }

  return {
    totalLists,
    formationBreakdown: Object.entries(formationCounts)
      .map(([formation, count]) => ({
        formation,
        count,
        percentage: (count / totalLists) * 100,
      }))
      .sort((a, b) => b.count - a.count),
    avgRadarPerList:
      data.reduce((sum: number, l: { radar_count: number }) => sum + (l.radar_count ?? 0), 0) /
      totalLists,
    avgAgeAcrossLists:
      data.reduce((sum: number, l: { avg_age: number }) => sum + Number(l.avg_age ?? 0), 0) /
      totalLists,
  };
}

// Stub for prompt 4
export async function getTopPickedPlayers() {
  return [];
}
