import { useEffect, useState } from "react";
import ColorThief from "colorthief";

export type RGB = [number, number, number];

/**
 * Extracts the dominant RGB color from an image URL.
 * Handles CORS (returns null on failure) and waits for the image to load.
 */
export function useDominantColor(imageUrl?: string | null): RGB | null {
  const [color, setColor] = useState<RGB | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;
      try {
        const thief = new ColorThief();
        const rgb = thief.getColor(img) as RGB;
        if (rgb && !cancelled) setColor(rgb);
      } catch {
        // CORS or decode error — silently fall back
        if (!cancelled) setColor(null);
      }
    };

    img.onerror = () => {
      if (!cancelled) setColor(null);
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
