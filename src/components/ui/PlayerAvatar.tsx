import { useState } from "react";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/playerHelpers";

interface PlayerAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  /** When true, image fills the wrapper with object-cover (used for cards) */
  cover?: boolean;
  /** Optional text size override for the initials fallback */
  initialsClassName?: string;
  /** Optional inline style (e.g. fixed width/height for export). */
  style?: React.CSSProperties;
}

/**
 * Always renders something — either the player photo or a green-gradient
 * circle with the player's initials as fallback. Handles broken/missing
 * URLs (403, 404, timeout) gracefully.
 *
 * The fallback uses the Léopards green gradient: #00A651 → #004d25.
 */
export function PlayerAvatar({
  name,
  src,
  className,
  cover = true,
  initialsClassName,
  style,
}: PlayerAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;
  const initials = initialsFromName(name);

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center",
        className,
      )}
      style={{
        ...(showImage
          ? {}
          : {
              background:
                "linear-gradient(135deg, #0a3f22 0%, #08361c 50%, #052e16 100%)",
            }),
        ...style,
      }}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
          className={cn(
            "h-full w-full",
            cover ? "object-cover" : "object-contain",
          )}
          // Cadrage : on tire le focus vers le haut de la photo où se trouve
          // le visage dans la quasi-totalité des photos sportives (Wikimedia,
          // photos officielles club). object-position 'center' tombait
          // souvent sur le buste pour les photos plein corps. 28% est un bon
          // compromis : le visage reste visible sur les portraits cadrés
          // serré et apparaît correctement sur les photos plein corps.
          style={cover ? { objectPosition: "center 28%" } : undefined}
        />
      ) : (
        <span
          className={cn(
            "font-serif font-semibold tracking-tight select-none text-white/90",
            initialsClassName ?? "text-2xl",
          )}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export default PlayerAvatar;
