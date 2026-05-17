/**
 * AtlasMap — vue "Atlas mondial" du Radar, construite mai 2026.
 *
 * Carte OpenStreetMap interactive via react-leaflet.
 * Markers = agrégats par pays de naissance/nationalité secondaire.
 * Pas de clé API. Gratuit. Tiles OSM standard.
 *
 * Architecture :
 *   - MapContainer (react-leaflet) avec tiles OSM
 *   - CircleMarkers par pays (radius ∝ count, couleur ∝ tier dominant)
 *   - Popup au click = liste des 6 premiers joueurs + lien fiche
 *   - Sidebar panneau flottant à gauche avec stats live
 *
 * Performance :
 *   - Import dynamique (lazy) depuis Radar.tsx via React.lazy
 *   - Tiles OSM standard avec attribution minimale
 *   - CircleMarker (SVG natif Leaflet) plutôt que Marker custom HTML (plus léger)
 *
 * Note CSS : leaflet nécessite son propre CSS. Import dans ce fichier
 * uniquement (tree-shaking Vite le code-split automatiquement).
 */

import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { formatMarketValue, flagFor } from "@/lib/playerHelpers";
import type { DBPlayer } from "@/types/dbPlayer";

// ── Coordonnées par pays ──────────────────────────────────────────────────────
// Coordonnées approximatives des capitales pour le placement des markers.
// Couverture : tous les pays présents dans le vivier RDC diaspora.

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "DR Congo": [-4.3, 15.3],
  "Congo": [-4.3, 15.3],
  "France": [46.2, 2.2],
  "Belgium": [50.8, 4.5],
  "Belgique": [50.8, 4.5],
  "England": [52.4, -1.9],
  "Angleterre": [52.4, -1.9],
  "Scotland": [56.5, -4.2],
  "Wales": [52.1, -3.8],
  "Spain": [40.4, -3.7],
  "Espagne": [40.4, -3.7],
  "Portugal": [38.7, -9.1],
  "Switzerland": [46.9, 7.5],
  "Suisse": [46.9, 7.5],
  "Netherlands": [52.1, 5.3],
  "Pays-Bas": [52.1, 5.3],
  "Germany": [51.2, 10.4],
  "Allemagne": [51.2, 10.4],
  "Italy": [41.9, 12.5],
  "Italie": [41.9, 12.5],
  "Greece": [39.1, 21.8],
  "Grèce": [39.1, 21.8],
  "Turkey": [38.9, 35.2],
  "Turquie": [38.9, 35.2],
  "Russia": [61.5, 90.4],
  "Poland": [51.9, 19.1],
  "Denmark": [56.3, 9.5],
  "Sweden": [62.2, 17.6],
  "Norway": [60.5, 8.5],
  "Austria": [47.5, 14.6],
  "Romania": [45.9, 24.9],
  "USA": [37.1, -95.7],
  "United States": [37.1, -95.7],
  "Canada": [56.1, -106.3],
  "Brazil": [-14.2, -51.9],
  "Brésil": [-14.2, -51.9],
  "Argentina": [-38.4, -63.6],
  "Morocco": [31.8, -7.1],
  "Maroc": [31.8, -7.1],
  "Tunisia": [33.9, 9.5],
  "Algeria": [28.0, 2.6],
  "Egypt": [26.8, 30.8],
  "Cameroon": [3.8, 11.5],
  "Cameroun": [3.8, 11.5],
  "Senegal": [14.5, -14.5],
  "Sénégal": [14.5, -14.5],
  "Ivory Coast": [7.5, -5.5],
  "Côte d'Ivoire": [7.5, -5.5],
  "Ghana": [7.9, -1.0],
  "Nigeria": [9.1, 8.7],
  "Mali": [17.6, -4.0],
  "Angola": [-11.2, 17.9],
  "Zambia": [-13.1, 27.8],
  "South Africa": [-30.6, 22.9],
  "Kenya": [0.0, 37.9],
  "Saudi Arabia": [23.9, 45.1],
  "Australia": [-25.3, 133.8],
  "Japan": [36.2, 138.3],
  "South Korea": [35.9, 127.8],
  "Israel": [31.0, 34.9],
  "Qatar": [25.4, 51.2],
  "UAE": [23.4, 53.8],
  "Autre": [0, 20],
};

// ── Couleur marker ─────────────────────────────────────────────────────────────

function getMarkerColor(players: DBPlayer[]): { fill: string; stroke: string } {
  const hasTier1 = players.some((p) => p.tier === "tier1");
  const topValue = players[0]?.market_value_eur ?? 0;

  if (topValue >= 30_000_000 || (hasTier1 && players.length >= 3)) {
    return { fill: "#00a651", stroke: "#86efac" };
  }
  if (hasTier1 || topValue >= 10_000_000) {
    return { fill: "#fcd116", stroke: "#fef08a" };
  }
  if (players.length >= 15) {
    return { fill: "#6366f1", stroke: "#a5b4fc" };
  }
  return { fill: "#3f3f46", stroke: "#71717a" };
}

// ── Radius marker ─────────────────────────────────────────────────────────────

function getMarkerRadius(count: number, maxCount: number): number {
  const MIN_R = 6;
  const MAX_R = 28;
  const ratio = Math.sqrt(count / Math.max(maxCount, 1));
  return MIN_R + (MAX_R - MIN_R) * ratio;
}

// ── Interface principale ───────────────────────────────────────────────────────

interface AtlasMapProps {
  players: DBPlayer[];
}

interface CountryMarker {
  country: string;
  coords: [number, number];
  players: DBPlayer[];
  count: number;
}

export function AtlasMap({ players }: AtlasMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const markers = useMemo((): CountryMarker[] => {
    const map = new Map<string, DBPlayer[]>();

    players.forEach((p) => {
      const country =
        p.country_of_birth ||
        p.other_nationalities.find((n) => n !== "DR Congo") ||
        "Autre";

      const existing = map.get(country) ?? [];
      existing.push(p);
      map.set(country, existing);
    });

    return Array.from(map.entries())
      .map(([country, ps]) => ({
        country,
        coords: COUNTRY_COORDS[country] ?? COUNTRY_COORDS["Autre"],
        players: [...ps].sort(
          (a, b) => (b.market_value_eur ?? 0) - (a.market_value_eur ?? 0),
        ),
        count: ps.length,
      }))
      .filter((m) => m.coords !== undefined);
  }, [players]);

  const maxCount = useMemo(
    () => Math.max(...markers.map((m) => m.count), 1),
    [markers],
  );

  const totalValue = useMemo(
    () => players.reduce((s, p) => s + (p.market_value_eur ?? 0), 0),
    [players],
  );

  const formatValueShort = (eur: number) => {
    if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)} Md€`;
    if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)} M€`;
    return `${Math.round(eur / 1_000)} k€`;
  };

  return (
    <div className="relative w-full">
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
            Vue · Atlas mondial
          </p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            La carte de la diaspora
          </h2>
          <p className="mt-2 text-sm text-muted-light max-w-xl">
            Pays de naissance ou de nationalité secondaire des joueurs éligibles RDC.
            Cliquer sur un marker pour voir les joueurs.
          </p>
        </div>
        <div className="flex items-stretch gap-4 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Pays
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {markers.length}
            </p>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Joueurs
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {players.length}
            </p>
          </div>
          <div className="w-px bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
              Valeur
            </p>
            <p className="mt-1 font-serif text-2xl text-foreground leading-none">
              {formatValueShort(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="w-full overflow-hidden rounded-card border border-border/60" style={{ height: 520 }}>
        <MapContainer
          center={[30, 15]}
          zoom={2}
          minZoom={1}
          maxZoom={8}
          scrollWheelZoom
          className="h-full w-full"
          style={{ background: "#0a0a0b" }}
        >
          {/* Tiles CartoDB Dark Matter — plus sobre visuellement */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />

          {markers.map((marker) => {
            const color = getMarkerColor(marker.players);
            const radius = getMarkerRadius(marker.count, maxCount);
            const isHovered = hoveredCountry === marker.country;

            return (
              <CircleMarker
                key={marker.country}
                center={marker.coords}
                radius={isHovered ? radius + 4 : radius}
                pathOptions={{
                  fillColor: color.fill,
                  fillOpacity: 0.75,
                  color: color.stroke,
                  weight: isHovered ? 2.5 : 1.5,
                }}
                eventHandlers={{
                  mouseover: () => setHoveredCountry(marker.country),
                  mouseout: () => setHoveredCountry(null),
                }}
              >
                <Popup
                  className="atlas-popup"
                  maxWidth={280}
                >
                  <div className="p-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{flagFor(marker.country)}</span>
                      <div>
                        <p className="font-medium text-sm">{marker.country}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          {marker.count} joueur{marker.count > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {marker.players.slice(0, 6).map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <a
                            href={`/player/${p.slug}`}
                            className="text-xs text-white hover:text-green-400 truncate transition-colors"
                          >
                            {p.name}
                          </a>
                          {p.market_value_eur && p.market_value_eur > 0 ? (
                            <span className="text-[10px] font-mono text-gray-400 shrink-0">
                              {formatMarketValue(p.market_value_eur)}
                            </span>
                          ) : null}
                        </div>
                      ))}
                      {marker.count > 6 ? (
                        <p className="text-[10px] text-gray-500 text-center pt-1">
                          +{marker.count - 6} autres joueurs
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-light">
        <AtlasLegendItem color="#00a651" label="Top 5 européen" />
        <AtlasLegendItem color="#fcd116" label="Tier 1 / top valeur" />
        <AtlasLegendItem color="#6366f1" label="Forte diaspora" />
        <AtlasLegendItem color="#3f3f46" label="Autre" />
        <span className="font-mono text-muted">· Taille = nombre de joueurs</span>
      </div>
    </div>
  );
}

function AtlasLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// Style CSS injecté pour le popup Leaflet — override du thème dark
// (le CSS Leaflet injecte des styles blancs par défaut)
const atlasPopupStyle = `
.atlas-popup .leaflet-popup-content-wrapper {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  color: #f4f4f5;
}
.atlas-popup .leaflet-popup-tip {
  background: #18181b;
}
.atlas-popup .leaflet-popup-content {
  margin: 12px 14px;
}
.leaflet-container {
  font-family: 'Geist', sans-serif;
}
`;

// Injecter le style une seule fois
if (typeof document !== "undefined") {
  const id = "atlas-popup-style";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = atlasPopupStyle;
    document.head.appendChild(style);
  }
}
