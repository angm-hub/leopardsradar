import { useRef, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Mail,
  Check,
  Twitter,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { submitUserList } from "@/lib/maListeApi";
import { FORMATION_SLOTS } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import { formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";

const PITCH_POSITIONS: Record<
  Formation,
  Partial<Record<SlotPosition, { x: number; y: number }>>
> = {
  "4-3-3": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 28, y: 47 }, CM: { x: 50, y: 50 }, RCM: { x: 72, y: 47 },
    LW: { x: 15, y: 22 }, ST: { x: 50, y: 14 }, RW: { x: 85, y: 22 },
  },
  "4-2-3-1": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 35, y: 54 }, RCM: { x: 65, y: 54 },
    LW: { x: 18, y: 30 }, CAM: { x: 50, y: 33 }, RW: { x: 82, y: 30 },
    ST: { x: 50, y: 12 },
  },
  "3-5-2": {
    GK: { x: 50, y: 90 },
    LCB: { x: 25, y: 72 }, CB: { x: 50, y: 75 }, RCB: { x: 75, y: 72 },
    LWB: { x: 8, y: 50 }, LCM: { x: 30, y: 50 }, CM: { x: 50, y: 53 }, RCM: { x: 70, y: 50 }, RWB: { x: 92, y: 50 },
    LST: { x: 35, y: 17 }, RST: { x: 65, y: 17 },
  },
};

export function ListRecap() {
  const formation = useMaListeStore((s) => s.formation);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);
  const captain = useMaListeStore((s) => s.captain);
  const email = useMaListeStore((s) => s.email);
  const setEmail = useMaListeStore((s) => s.setEmail);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const sessionId = useMaListeStore((s) => s.sessionId);
  const reset = useMaListeStore((s) => s.reset);

  const pitchRef = useRef<HTMLDivElement>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const insights = useMemo(() => {
    const xiPlayers = Object.values(startingXI).filter(
      (p): p is NonNullable<typeof p> => p !== null,
    );
    const all = [...xiPlayers, ...bench];
    const radarCount = all.filter((p) => p.player_category === "radar").length;
    const ages = all.map((p) => p.age ?? 0).filter((a) => a > 0);
    const avgAge =
      ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const totalValue = all.reduce(
      (sum, p) => sum + (p.market_value_eur ?? 0),
      0,
    );
    return {
      radarCount,
      avgAge: Math.round(avgAge * 10) / 10,
      totalValue,
      total: all.length,
    };
  }, [startingXI, bench]);

  const handleDownload = async () => {
    if (!pitchRef.current) return;
    setDownloadLoading(true);
    try {
      const dataUrl = await toPng(pitchRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0A0A0B",
      });
      const link = document.createElement("a");
      link.download = `ma-liste-leopards-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSubmit = async (includeEmail: boolean) => {
    if (!formation || !captain) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await submitUserList({
        sessionId,
        formation,
        startingXI,
        bench,
        captain,
        email: includeEmail ? email || undefined : undefined,
      });
      setEmailSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(
        "Impossible d'enregistrer ta liste. Réessaie dans un instant.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleShare = (platform: "twitter" | "whatsapp" | "copy") => {
    const text = `Voici ma liste des 26 pour les Léopards au Mondial 2026 🐆\n\nVia @leopardsradar`;
    const url = `${window.location.origin}/ma-liste`;
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
      );
    } else if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
        "_blank",
      );
    } else if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!formation || !captain) {
    return (
      <section className="container-site max-w-2xl py-32 text-center">
        <p className="text-muted">
          Ta liste est incomplète. Reviens en arrière pour la finaliser.
        </p>
        <button
          onClick={previousStep}
          className="mt-6 text-xs uppercase tracking-[0.2em] text-primary hover:underline"
        >
          ← Retour
        </button>
      </section>
    );
  }

  const slots = FORMATION_SLOTS[formation];
  const positions = PITCH_POSITIONS[formation];

  return (
    <section className="container-site max-w-5xl py-12 md:py-16">
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousStep}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            RÉCAPITULATIF
          </span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Ta liste est prête.
          </h1>
          <p className="mt-3 text-muted-light">
            Télécharge-la. Partage-la. Compare-la.
          </p>
        </div>

        {/* Exportable visual */}
        <div className="flex justify-center">
          <div
            ref={pitchRef}
            className="w-full max-w-[640px] rounded-card overflow-hidden border border-border"
            style={{ backgroundColor: "#0A0A0B" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                  LÉOPARDS RADAR
                </p>
                <p className="font-serif text-xl text-white mt-1">
                  Ma Liste des 26
                </p>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                {formation}
              </span>
            </div>

            {/* Pitch */}
            <div
              className="relative w-full"
              style={{
                aspectRatio: "3/4",
                background:
                  "linear-gradient(180deg, #0d3d20 0%, #0a2e18 50%, #0d3d20 100%)",
              }}
            >
              {/* lines */}
              <div className="absolute inset-3 border-2 border-white/15 rounded-sm" />
              <div className="absolute left-3 right-3 top-1/2 h-px bg-white/15" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/15 rounded-full" />

              {slots.map((slot) => {
                const pos = positions?.[slot];
                const player = startingXI[slot];
                if (!pos || !player) return null;
                const isCaptain = captain.slug === player.slug;
                return (
                  <div
                    key={slot}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="relative">
                      <PlayerAvatar
                        name={player.name}
                        src={player.image_url}
                        className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 shadow-lg",
                          isCaptain ? "border-primary" : "border-white/40",
                        )}
                        initialsClassName="text-xs"
                      />
                      {isCaptain && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow">
                          C
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/90 font-medium px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm whitespace-nowrap max-w-[80px] truncate">
                      {player.name.split(" ").slice(-1)[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/50">
              <span>leopardsradar.com/ma-liste</span>
              <span>{new Date().toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "RADAR",
              value: insights.radarCount,
              sub: "joueurs éligibles",
            },
            {
              label: "ÂGE MOYEN",
              value: insights.avgAge,
              sub: "ans",
            },
            {
              label: "VALEUR TOTALE",
              value: formatMarketValue(insights.totalValue),
              sub: "marché",
            },
            {
              label: "FORMATION",
              value: formation,
              sub: "ta tactique",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-card border border-border bg-card p-4 text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                {s.label}
              </p>
              <p className="font-serif text-2xl text-foreground mt-1">
                {s.value}
              </p>
              <p className="text-xs text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={downloadLoading}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {downloadLoading ? "Génération…" : "Télécharger mon visuel"}
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => handleShare("twitter")}
              className="gap-2"
            >
              <Twitter className="h-4 w-4" />X
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("whatsapp")}
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("copy")}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>

          {/* Email capture */}
          {!emailSubmitted ? (
            <div className="rounded-card border border-border bg-card p-5 mt-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-lg text-foreground">
                  Reçois la vraie liste de Desabre
                </h3>
              </div>
              <p className="text-sm text-muted mt-2">
                Quand les convocations officielles tomberont, on te prévient
                pour comparer avec ta liste.
              </p>
              <div className="flex gap-2 mt-4">
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-background border border-border rounded-button text-sm text-foreground placeholder:text-muted focus:border-primary outline-none transition-colors"
                />
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={!email || submitLoading}
                >
                  {submitLoading ? "…" : "M'abonner"}
                </Button>
              </div>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitLoading}
                className="mt-3 text-xs text-muted hover:text-foreground underline disabled:opacity-50"
              >
                Continuer sans email
              </button>
              {submitError && (
                <p className="mt-3 text-xs text-alert">{submitError}</p>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-card border border-primary/40 bg-primary/5 p-5 flex items-center gap-3"
            >
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <p className="font-serif text-lg text-foreground">
                  Ta liste est enregistrée.
                </p>
                <p className="text-sm text-muted mt-0.5">
                  On te préviendra le jour des convocations officielles.
                </p>
              </div>
            </motion.div>
          )}

          <button
            onClick={reset}
            className="block mx-auto mt-6 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
          >
            Recommencer une nouvelle liste
          </button>
        </div>
      </div>
    </section>
  );
}
