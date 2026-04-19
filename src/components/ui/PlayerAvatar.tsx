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
      style={
        showImage
          ? undefined
          : {
              background:
                "linear-gradient(135deg, #00A651 0%, #007a3d 50%, #004d25 100%)",
            }
      }
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
        />
      ) : (
        <span
          className={cn(
            "font-serif font-semibold text-white tracking-tight select-none",
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
