import { useEffect } from "react";

/**
 * RoutePrefetch — précharge les chunks des routes les plus probables
 * pendant les frames idle après le LCP de la home.
 *
 * Pourquoi : sans prefetch, le clic vers /roster ou /player/<slug> déclenche
 * un import dynamique qui télécharge le chunk + sous-deps en série. Sur 4G
 * c'est 200-600 ms perceptibles. Avec prefetch en idle, les chunks sont
 * déjà en cache navigateur quand l'utilisateur clique → navigation instantanée.
 *
 * Les imports() ici ne créent aucun rendu — ils servent uniquement à
 * déclencher le téléchargement Vite-géré des chunks lazy. Aucune erreur
 * propagée même si l'import échoue (network blip), on retente à la
 * prochaine navigation.
 *
 * On limite aux 3 routes critiques (Roster, Player, Compare) — les autres
 * (admin, légal, etc.) restent lazy à la demande.
 */
export function RoutePrefetch() {
  useEffect(() => {
    type Idle = (cb: () => void, opts?: { timeout: number }) => number;
    const idle: Idle =
      (typeof window !== "undefined" && (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback) ||
      ((cb) => window.setTimeout(cb, 1));

    const handle = idle(
      () => {
        // Fire and forget — rejected promises are silenced. Vite emits each
        // import() as its own chunk, so the browser pulls them in parallel.
        void import("@/pages/Roster.tsx").catch(() => undefined);
        void import("@/pages/Player.tsx").catch(() => undefined);
        void import("@/pages/Compare.tsx").catch(() => undefined);
      },
      { timeout: 4000 },
    );

    return () => {
      const cancelIdle = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (cancelIdle) cancelIdle(handle);
    };
  }, []);

  return null;
}

export default RoutePrefetch;
