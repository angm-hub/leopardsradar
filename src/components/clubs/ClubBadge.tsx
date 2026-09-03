import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ClubBadge — crest Transfermarkt dérivé de l'id club (`current_club_id` est
 * un id TM), avec fallback monogramme propre (initiales) si l'id manque ou si
 * l'image ne charge pas. Jamais de trou visible.
 */
export function ClubBadge({
  tmId,
  name,
  size = 32,
  className,
}: {
  tmId: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/^(AS|FC|CS|DC|TP|RC|AC|SC|US|CD|SA)\s+/i, "")
    .trim()
    .slice(0, 2)
    .toUpperCase();
  const style = { width: size, height: size };
  if (!tmId || failed) {
    return (
      <span
        style={style}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] text-primary ring-1 ring-primary/20",
          className,
        )}
      >
        {initials || "?"}
      </span>
    );
  }
  return (
    <img
      src={`https://tmssl.akamaized.net/images/wappen/head/${tmId}.png`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
      className={cn("shrink-0 rounded-md bg-white/5 object-contain", className)}
    />
  );
}

export default ClubBadge;
