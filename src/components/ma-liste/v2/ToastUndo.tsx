import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

interface ToastUndoProps {
  open: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * Toast undo pour actions destructives (changement formation, remove all, etc.).
 * Auto-dismiss après 5 sec si pas d'action. Style sobre, slide down depuis le haut.
 */
export function ToastUndo({
  open, message, onUndo, onDismiss, durationMs = 5000,
}: ToastUndoProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-2xl">
            <span className="font-v2-body text-[13px] text-foreground">
              {message}
            </span>
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 font-v2-mono text-[10px] uppercase tracking-[0.08em] font-semibold hover:bg-primary-hover transition-colors"
            >
              <Undo2 className="h-3 w-3" strokeWidth={2.5} />
              Annuler
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
