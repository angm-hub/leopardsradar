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
          // Cadrage : object-position 28% pour que le visage reste dans la
          // partie supérieure (les photos sportives ont presque toujours
          // le visage en haut, jamais au centre).
          // Filter : touche colorimétrique pour homogénéiser des sources
          // hétérogènes (Wikimedia, photos clubs officielles, smartphones).
          // Saturation +6% donne du punch sans devenir Instagram, contrast
          // +3% creuse les ombres sur les photos plates des jours nuageux.
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
