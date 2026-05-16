import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import { encodeListToHash } from "@/lib/maListeUrlState";

interface ShareModalV2Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal share — apparait quand l'utilisateur a fini sa liste et clique
 * "Partager". Layout sobre :
 * - Titre éditorial
 * - Champ pseudo optionnel
 * - 3 actions : Lien · X (Twitter) · WhatsApp
 *
 * Pas de "Bravo !" ni confetti — la sobriété renforce le premium (cf. DESIGN.md).
 */
export function ShareModalV2({ open, onClose }: ShareModalV2Props) {
  const formation = useMaListeV2Store((s) => s.formation);
  const startingXI = useMaListeV2Store((s) => s.startingXI);
  const bench = useMaListeV2Store((s) => s.bench);
  const captain = useMaListeV2Store((s) => s.captain);
  const [pseudo, setPseudo] = useState("");
  const [copied, setCopied] = useState(false);

  const hash = encodeListToHash({ formation, startingXI, bench, captain });
  const permalink =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}#${hash}`
      : "";
  const pseudoLabel = pseudo.trim() ? ` par ${pseudo.trim()}` : "";
  const text = `Voilà ma sélection des 26 pour les Léopards au Mondial 2026${pseudoLabel}.`;

  const copy = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(permalink)}`,
      "_blank",
    );
  };

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${permalink}`)}`,
      "_blank",
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="share-title"
                className="font-v2 italic text-2xl font-light leading-none text-foreground"
                style={{ letterSpacing: "-0.025em" }}
              >
                Posée. Partage.
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/55 hover:bg-background hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 font-v2-body text-[13px] text-foreground/60 leading-relaxed">
              Ton lien marche partout. Tu peux ajouter ton pseudo si tu veux qu'on sache que c'est toi.
            </p>

            <div className="mt-5">
              <label className="block font-v2-mono text-[10px] uppercase tracking-[0.08em] text-foreground/45 mb-2">
                Pseudo (optionnel)
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value.slice(0, 24))}
                placeholder="ex. Alex, Kinshasa Boy…"
                className="w-full rounded-md border border-border bg-background py-2 px-3 font-v2-body text-[13px] text-foreground placeholder:text-foreground/35 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={copy}
                className={cn(
                  "w-full flex items-center justify-between gap-2 rounded-md border border-border bg-background px-4 py-3 font-v2-body text-[13px] transition-colors",
                  "hover:border-primary",
                )}
              >
                <span className="truncate text-foreground/70 font-v2-mono text-[11px]">
                  {permalink.replace(/^https?:\/\//, "")}
                </span>
                <span className="flex items-center gap-1.5 text-primary shrink-0">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="font-v2-mono text-[10px] uppercase tracking-[0.08em]">
                    {copied ? "copié" : "copier"}
                  </span>
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openTwitter}
                  className="flex items-center justify-center gap-2 rounded-md bg-foreground text-background py-2.5 font-v2-body text-[13px] font-semibold hover:bg-foreground/90 transition-colors"
                >
                  <Twitter className="h-3.5 w-3.5" /> X
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="flex items-center justify-center gap-2 rounded-md bg-[#25D366] text-white py-2.5 font-v2-body text-[13px] font-semibold hover:bg-[#1ebe57] transition-colors"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
