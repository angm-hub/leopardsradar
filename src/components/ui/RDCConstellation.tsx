/**
 * RDCConstellation — fond de hero signature Léopards Radar
 *
 * SVG plein écran représentant un treillis géographique : 14 points
 * correspondant aux grandes villes RDC (coordonnées normalisées 0-100),
 * reliés à leurs voisins les plus proches par des lignes très subtiles.
 *
 * WHY ce choix plutôt que l'aurora générique :
 * L'aurora WebGL fonctionnait mais sonnait "SaaS starter" — le même shader
 * qu'on voit dans mille Lovable/Vercel apps. La constellation ancre le visuel
 * dans le territoire RDC sans que le visiteur ait besoin de lire un label.
 * C'est une signature éditoriale, pas un effet.
 *
 * Implémentation volontairement légère (SVG pur, pas de canvas) :
 * — zéro dépendance
 * — pas de coût GPU
 * — reduced-motion respecté (pas d'animation, juste le dessin statique)
 */

import { useReducedMotion } from "framer-motion";

// ─── Données géographiques ────────────────────────────────────────────────────
// Coordonnées normalisées (cx, cy en % de la viewBox 0-100).
// Projection approximative : longitude → x, latitude inversée → y
// pour que le nord du pays soit en haut du SVG.
// Source de référence : capitales et grandes villes de la RDC.

interface GeoPoint {
  id: string;
  label: string;
  cx: number; // 0-100
  cy: number; // 0-100
}

const POINTS: GeoPoint[] = [
  { id: "kin", label: "Kinshasa",     cx: 17,  cy: 72 },
  { id: "lsh", label: "Lubumbashi",   cx: 72,  cy: 88 },
  { id: "mbu", label: "Mbuji-Mayi",   cx: 60,  cy: 65 },
  { id: "gom", label: "Goma",         cx: 78,  cy: 35 },
  { id: "kis", label: "Kisangani",    cx: 62,  cy: 32 },
  { id: "kan", label: "Kananga",      cx: 50,  cy: 67 },
  { id: "buk", label: "Bukavu",       cx: 80,  cy: 48 },
  { id: "mat", label: "Matadi",       cx: 10,  cy: 78 },
  { id: "boma", label: "Boma",        cx: 8,   cy: 80 },
  { id: "gbado", label: "Gbadolite",  cx: 48,  cy: 12 },
  { id: "bun", label: "Bunia",        cx: 80,  cy: 22 },
  { id: "mban", label: "Mbandaka",    cx: 35,  cy: 38 },
  { id: "kol", label: "Kolwezi",      cx: 60,  cy: 82 },
  { id: "kab", label: "Kalemie",      cx: 82,  cy: 58 },
];

// ─── Calcul des connexions (plus proches voisins, max 2 par point) ───────────

function dist(a: GeoPoint, b: GeoPoint): number {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy);
}

/** Calcule les paires de points à relier.
 *  Chaque point est connecté à ses 2 voisins les plus proches.
 *  On déduplique les paires pour éviter de tracer la même ligne deux fois.
 */
function buildEdges(points: GeoPoint[]): [string, string][] {
  const edgeSet = new Set<string>();
  const edges: [string, string][] = [];

  for (const p of points) {
    const sorted = points
      .filter((q) => q.id !== p.id)
      .sort((a, b) => dist(p, a) - dist(p, b))
      .slice(0, 2); // max 2 connexions par nœud

    for (const neighbor of sorted) {
      // Clé canonique pour la déduplication
      const key =
        p.id < neighbor.id ? `${p.id}__${neighbor.id}` : `${neighbor.id}__${p.id}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([p.id, neighbor.id]);
      }
    }
  }

  return edges;
}

const EDGES = buildEdges(POINTS);
const POINT_MAP = new Map(POINTS.map((p) => [p.id, p]));

// ─── Couleur signature ────────────────────────────────────────────────────────
const GREEN = "#00A651";

// ─── Composant ────────────────────────────────────────────────────────────────

export function RDCConstellation() {
  const reducedMotion = useReducedMotion();

  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      {/* Lignes entre voisins — très subtiles, presque imperceptibles */}
      <g stroke={GREEN} strokeWidth="0.3" opacity="0.08" strokeLinecap="round">
        {EDGES.map(([aId, bId]) => {
          const a = POINT_MAP.get(aId)!;
          const b = POINT_MAP.get(bId)!;
          return (
            <line
              key={`${aId}-${bId}`}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
            />
          );
        })}
      </g>

      {/* Halos + points — un groupe par nœud pour le stagger d'animation */}
      {POINTS.map((p, i) => {
        // Délai de stagger : réparti uniformément sur 3 s
        const delayS = ((i * 3) / POINTS.length).toFixed(2);

        return (
          <g key={p.id}>
            {/* Halo doux — pulse sauf si reduced-motion */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r="3"
              fill={GREEN}
              opacity="0.12"
            >
              {!reducedMotion && (
                <animate
                  attributeName="opacity"
                  values="0.08;0.22;0.08"
                  dur="3s"
                  begin={`${delayS}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                />
              )}
            </circle>

            {/* Point central — fixe, pas d'animation */}
            <circle
              cx={p.cx}
              cy={p.cy}
              r="1.5"
              fill={GREEN}
              opacity="0.6"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default RDCConstellation;
