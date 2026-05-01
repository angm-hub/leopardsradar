import { useRef, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Twitter,
  Copy,
  Link as LinkIcon,
  Smartphone,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { submitUserList } from "@/lib/maListeApi";
import { ShareCard, type ShareFormat } from "@/components/ma-liste/ShareCard";
import { formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";

export function ListRecap() {
  const formation = useMaListeStore((s) => s.formation);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);
  const captain = useMaListeStore((s) => s.captain);
  // newsletter coming soon — email capture removed
  const previousStep = useMaListeStore((s) => s.previousStep);
  const sessionId = useMaListeStore((s) => s.sessionId);
  const reset = useMaListeStore((s) => s.reset);

  const storyRef = useRef<HTMLDivElement>(null);
  const ogRef = useRef<HTMLDivElement>(null);

  const [pseudo, setPseudo] = useState<string>("");
  const [downloadingFormat, setDownloadingFormat] =
    useState<ShareFormat | null>(null);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);
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

  const handleDownload = async (format: ShareFormat) => {
    const node = format === "story" ? storyRef.current : ogRef.current;
    if (!node) return;
    setDownloadingFormat(format);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0A0A0B",
        width: format === "story" ? 1080 : 1200,
        height: format === "story" ? 1350 : 630,
      });
      const link = document.createElement("a");
      link.download = `ma-liste-leopards-${format}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSubmit = async (includeEmail: boolean) => {
    if (!formation || !captain) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const result = await submitUserList({
        sessionId,
        formation,
        startingXI,
        bench,
        captain,
        
        pseudo: pseudo.trim() || undefined,
      });
      setEmailSubmitted(true);
      setSubmittedSlug(result.slug);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(
        "Impossible d'enregistrer ta liste. Réessaie dans un instant.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const permalink = submittedSlug
    ? `${window.location.origin}/ma-liste/${submittedSlug}`
    : `${window.location.origin}/ma-liste`;

  const handleShare = (platform: "twitter" | "whatsapp" | "copy" | "permalink") => {
    const text = `Voici ma liste des 26 pour les Léopards au Mondial 2026 🐆`;
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(permalink)}`,
        "_blank",
      );
    } else if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + " " + permalink)}`,
        "_blank",
      );
    } else if (platform === "copy" || platform === "permalink") {
      navigator.clipboard.writeText(permalink);
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

  return (
    <section className="container-site max-w-3xl py-12 md:py-16">
      {/* Offscreen ShareCards for export */}
      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
        aria-hidden
      >
        <div ref={storyRef}>
          <ShareCard
            format="story"
            formation={formation}
            startingXI={startingXI}
            bench={bench}
            captain={captain}
            pseudo={pseudo}
            slug={submittedSlug}
          />
        </div>
        <div ref={ogRef}>
          <ShareCard
            format="og"
            formation={formation}
            startingXI={startingXI}
            bench={bench}
            captain={captain}
            pseudo={pseudo}
            slug={submittedSlug}
          />
        </div>
      </div>

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
            Ta liste des 26 est prête.
          </h1>
          <p className="mt-3 text-muted-light">
            Télécharge-la, partage-la, compare-la quand Desabre annoncera la sienne.
          </p>
        </div>

        {/* Live preview (visible) — scaled down to fit the page */}
        <div className="flex justify-center">
          <div
            className="rounded-card overflow-hidden border border-border shadow-2xl"
            style={{
              width: "min(440px, 100%)",
              aspectRatio: "1080 / 1350",
            }}
          >
            <div
              style={{
                transform: "scale(0.407)",
                transformOrigin: "top left",
                width: 1080,
                height: 1350,
              }}
            >
              <ShareCard
                format="story"
                formation={formation}
                startingXI={startingXI}
                bench={bench}
                captain={captain}
                pseudo={pseudo}
                slug={submittedSlug}
              />
            </div>
          </div>
        </div>

        {/* Pseudo input */}
        <div className="max-w-md mx-auto">
          <label className="block text-xs uppercase tracking-[0.2em] text-muted mb-2">
            TON PSEUDO (optionnel, apparaîtra sur la carte)
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 24))}
            placeholder="ex. Alex, Kinshasa Boy…"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-button text-sm text-foreground placeholder:text-muted focus:border-primary outline-none transition-colors"
          />
        </div>

        {/* Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "RADAR", value: insights.radarCount, sub: "joueurs" },
            { label: "ÂGE MOYEN", value: insights.avgAge, sub: "ans" },
            {
              label: "VALEUR",
              value: formatMarketValue(insights.totalValue),
              sub: "marché",
            },
            { label: "FORMATION", value: formation, sub: "tactique" },
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

        {/* Download — 2 formats */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <h3 className="font-serif text-lg text-foreground text-center">
            Télécharger ton visuel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => handleDownload("story")}
              disabled={downloadingFormat !== null}
              className="gap-2"
            >
              <Smartphone className="h-4 w-4" />
              {downloadingFormat === "story"
                ? "Génération…"
                : "Pour Instagram · LinkedIn (1080×1350)"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleDownload("og")}
              disabled={downloadingFormat !== null}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {downloadingFormat === "og"
                ? "Génération…"
                : "Pour X · WhatsApp (1200×630)"}
            </Button>
          </div>
        </div>

        {/* Share actions */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleShare("permalink")}
            className="w-full gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            {copied
              ? "Lien copié"
              : submittedSlug
                ? `Copier le lien : /ma-liste/${submittedSlug}`
                : "Copier le lien (après enregistrement)"}
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
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>

          {/* Save list (no email — newsletter coming soon) */}
          {!emailSubmitted ? (
            <div className="rounded-card border border-border bg-card p-5 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-lg text-foreground">
                  Enregistre ta liste
                </h3>
              </div>
              <p className="text-sm text-muted mt-2">
                Liste enregistrée localement et partageable via un permalien.
                Newsletter bientôt disponible pour recevoir la vraie liste de
                Desabre.
              </p>
              <Button
                size="lg"
                onClick={() => handleSubmit(false)}
                disabled={submitLoading}
                className="w-full mt-4"
              >
                {submitLoading ? "Enregistrement…" : "Enregistrer ma liste"}
              </Button>
              {submitError && (
                <p className="mt-3 text-xs text-alert">{submitError}</p>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-card border border-primary/40 bg-primary/5 p-5 flex items-start gap-3 mt-4",
              )}
            >
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
                <Check className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-lg text-foreground">
                  Ta liste est enregistrée.
                </p>
                <p className="text-sm text-muted mt-0.5">
                  Permalien :{" "}
                  <a
                    href={permalink}
                    className="text-primary hover:underline break-all"
                  >
                    {permalink}
                  </a>
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
