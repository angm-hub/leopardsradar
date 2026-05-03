import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/playerHelpers";

interface PlayerAvatarProps {
  name: string;
  /** Source primaire — image_url de la base. */
  src?: string | null;
  /** Source secondaire — image_url_alt. Tentée automatiquement si src 404/error. */
  srcAlt?: string | null;
  className?: string;
  /** Quand true (défaut), image fills the wrapper avec object-cover. */
  cover?: boolean;
  /** Override pour la taille des initiales du fallback. */
  initialsClassName?: string;
  /** Style inline (e.g. fixed width/height pour export). */
  style?: React.CSSProperties;
}

/**
 * Stratégie en 3 niveaux :
 *
 *   1. <img src={src}> — la photo officielle (Wikipedia thumb, club, etc.)
 *   2. Si onError, on bascule sur <img src={srcAlt}> (autre source Wikimedia
 *      ou Wikidata récupérée par le backfill multi-sources)
 *   3. Si srcAlt fail aussi, on tombe sur l'avatar initials premium :
 *      gradient signature LR vert + monogram en serif éditorial
 *
 * Cette chaîne corrige le cas où Wikimedia rate-limit le hotlink
 * occasionnellement (403) ou où la photo a été supprimée. L'utilisateur
 * voit toujours quelque chose de cohérent visuellement.
 *
 * Quand src change (navigation entre fiches), on reset les états error
 * pour que la nouvelle src soit re-tentée correctement.
 */
export function PlayerAvatar({
  name,
  src,
  srcAlt,
  className,
  cover = true,
  initialsClassName,
  style,
}: PlayerAvatarProps) {
  // Étape 0 = src primaire, 1 = src alt, 2 = initials fallback
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  // Reset stage quand on change de joueur. Sans ça, si le précédent joueur
  // avait fail au stage 2, le nouveau joueur reste bloqué sur initials.
  useEffect(() => {
    setStage(src ? 0 : srcAlt ? 1 : 2);
  }, [src, srcAlt]);

  const currentSrc = stage === 0 ? src : stage === 1 ? srcAlt : null;
  const showImage = !!currentSrc && stage < 2;

  const initials = initialsFromName(name);

  // Gradient signature dérivé du nom — chaque joueur a SA teinte stable
  // (hash du nom modulo 360°) au lieu d'un avatar identique pour tous.
  // Centré sur les verts/teal/jaune-olivâtre pour rester dans la palette
  // RDC (vert national #00A651) sans trop dériver.
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    // Range 100-180° → vert tendre → vert profond → teal. Pas de rouge ni
    // de bleu pour rester cohérent avec la marque.
    return 100 + (h % 80);
  }, [name]);

  const gradient = useMemo(
    () =>
      `linear-gradient(135deg, hsl(${hue} 32% 18%) 0%, hsl(${hue} 38% 12%) 50%, hsl(${hue} 30% 8%) 100%)`,
    [hue],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center",
        className,
      )}
      style={{
        ...(showImage ? {} : { background: gradient }),
        ...style,
      }}
      aria-label={name}
    >
      {showImage ? (
        <img
          // key force un re-mount quand on change de stage : sinon React
          // garde l'ancien <img> sans replay le download.
          key={`${name}-${stage}`}
          src={currentSrc!}
          alt={name}
          loading="lazy"
          onError={() => {
            // Cascade : si on était sur src primaire et qu'il y a un alt,
            // on tente l'alt. Sinon, fallback initials.
            if (stage === 0 && srcAlt) setStage(1);
            else setStage(2);
          }}
          className={cn(
            "h-full w-full",
            cover ? "object-cover" : "object-contain",
          )}
          // Cadrage 28% : visage en haut. Filter : touche colorimétrique
          // pour homogénéiser les sources hétérogènes (Wikimedia, club
          // officielle, smartphones de presse).
          style={
            cover
              ? {
                  objectPosition: "center 28%",
                  filter: "saturate(1.06) contrast(1.03)",
                }
              : undefined
          }
        />
      ) : (
        <PremiumInitials initials={initials} className={initialsClassName} />
      )}
    </div>
  );
}

/**
 * Avatar initials premium — au lieu d'un texte simple sur fond plat, on
 * pose un monogram en Fraunces serif (signature de la marque) sur un
 * gradient subtle, avec un petit pattern dot en arrière pour la texture.
 * Beaucoup plus chaleureux qu'un placeholder générique tout en restant
 * cohérent avec la DA du site.
 */
function PremiumInitials({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <>
      {/* Pattern dots subtle pour casser l'aplat du gradient. Opacity très
          basse pour que ça ne devienne pas lisible comme du dot pattern. */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.06]"
      >
        <defs>
          <pattern id="lr-init-dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lr-init-dots)" />
      </svg>
      {/* Halo lumineux subtle au centre, sous le monogram. Renforce
          l'effet "il y a quelque chose là" sans imiter une vraie photo. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.06) 0%, transparent 55%)",
        }}
      />
      <span
        className={cn(
          "relative font-serif font-medium tracking-[-0.02em] select-none",
          "text-white/85",
          // Mince ombre interne pour donner de la profondeur.
          "[text-shadow:0_1px_0_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.25)]",
          className ?? "text-3xl",
        )}
      >
        {initials}
      </span>
    </>
  );
}

export default PlayerAvatar;
