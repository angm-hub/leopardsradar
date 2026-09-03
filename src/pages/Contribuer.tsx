import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, PenLine, ShieldCheck, Radar } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";

type ContribType = "correction" | "new_player" | "observation" | "source";

const TYPES: { value: ContribType; label: string; hint: string }[] = [
  { value: "correction", label: "Corriger une info", hint: "Un club, une date, une nationalité, un faux positif." },
  { value: "new_player", label: "Ajouter un joueur", hint: "Un joueur d'origine congolaise qui manque au radar." },
  { value: "observation", label: "Signaler un talent vu", hint: "Un joueur repéré sur le terrain, avec ce que tu as vu." },
  { value: "source", label: "Proposer une source", hint: "Un lien, un compte, une base qui nous aiderait." },
];

const STEPS = [
  { icon: PenLine, title: "Tu proposes", desc: "Tu remontes une info, le plus précis possible, avec une source si tu l'as." },
  { icon: ShieldCheck, title: "On vérifie", desc: "Chaque contribution passe par une revue. Rien ne rejoint le radar sans validation." },
  { icon: Radar, title: "Ça compte", desc: "Une fois validée, l'info entre dans la base. Les contributeurs réguliers gagnent un statut." },
];

const FIELD =
  "w-full rounded-button border border-border bg-card/60 px-4 py-3 text-base text-foreground placeholder:text-foreground/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors";

export default function Contribuer() {
  useDocumentMeta({
    title: "Contribuer",
    description:
      "Aide à compléter le radar du football congolais. Corrige une info, ajoute un joueur, signale un talent, propose une source. Chaque contribution est vérifiée.",
  });

  const [type, setType] = useState<ContribType>("correction");
  const [player, setPlayer] = useState("");
  const [details, setDetails] = useState("");
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (details.trim().length < 8) {
      toast.error("Ajoute un peu plus de détail pour qu'on puisse vérifier.");
      return;
    }
    setLoading(true);
    try {
      // Types Supabase pas encore régénérés pour cette table : cast volontaire.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("contributions").insert({
        status: "pending",
        type,
        player_name: player.trim() || null,
        message: details.trim(),
        source_url: source.trim() || null,
        contributor_name: name.trim() || null,
        contributor_contact: contact.trim() || null,
        payload: { player: player.trim() || null },
      });
      if (error) throw error;
      setDone(true);
      toast.success("Merci. Ta contribution est en file de vérification.");
    } catch (err) {
      console.error("[Contribuer]", err);
      toast.error("Envoi impossible pour le moment. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-14">
          <nav aria-label="breadcrumb" className="text-sm text-muted mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Contribuer</span>
          </nav>
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">
              Le radar se construit à plusieurs
            </span>
            <h1 className="mt-6 display-heading text-5xl md:text-6xl text-foreground">
              Aide à compléter le radar.
            </h1>
            <p className="mt-6 text-xl text-muted-light">
              Un joueur qui manque, une info à corriger, un talent local que
              personne ne suit. Tu vois quelque chose que le radar n'a pas ? Dis-le.
              Chaque contribution est vérifiée avant de rejoindre la base.
            </p>
          </div>
        </section>

        <section className="container-site pb-16">
          <div className="max-w-2xl">
            {done ? (
              <div
                className="rounded-card border border-primary/30 bg-primary/5 p-8 text-center"
                role="status"
                aria-live="polite"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30">
                  <Check className="h-6 w-6" />
                </span>
                <h2 className="mt-5 display-heading text-2xl text-foreground">
                  Reçu. Merci.
                </h2>
                <p className="mt-3 text-muted-light">
                  Ta contribution est en file de vérification. Si elle tient, elle
                  rejoint le radar. Les contributeurs réguliers gagnent un statut.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setPlayer("");
                    setDetails("");
                    setSource("");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-button border border-border px-5 py-2.5 text-sm text-foreground hover:border-primary/50 transition-colors"
                >
                  Proposer autre chose
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-foreground">De quoi s'agit-il ?</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        aria-pressed={type === t.value}
                        className={cn(
                          "text-left rounded-card border p-4 transition-colors",
                          type === t.value
                            ? "border-primary/60 bg-primary/5"
                            : "border-border bg-card/40 hover:border-primary/30",
                        )}
                      >
                        <span className="block text-sm font-medium text-foreground">{t.label}</span>
                        <span className="mt-1 block text-xs text-muted leading-relaxed">{t.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="c-player" className="text-sm font-medium text-foreground">
                    Joueur concerné <span className="text-muted font-normal">(si tu en as un)</span>
                  </label>
                  <input
                    id="c-player"
                    type="text"
                    value={player}
                    onChange={(e) => setPlayer(e.target.value)}
                    disabled={loading}
                    placeholder="Nom du joueur"
                    className={FIELD}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="c-details" className="text-sm font-medium text-foreground">
                    L'info, le plus précis possible
                  </label>
                  <textarea
                    id="c-details"
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    disabled={loading}
                    rows={5}
                    placeholder="Ce que tu sais, où tu l'as vu, pourquoi ça compte."
                    className={cn(FIELD, "resize-y min-h-[120px]")}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="c-source" className="text-sm font-medium text-foreground">
                    Source ou lien <span className="text-muted font-normal">(recommandé)</span>
                  </label>
                  <input
                    id="c-source"
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    disabled={loading}
                    placeholder="Un lien, un compte, une page. Ce qui appuie ton info."
                    className={FIELD}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="c-name" className="text-sm font-medium text-foreground">
                      Ton nom <span className="text-muted font-normal">(pour te créditer)</span>
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      placeholder="Comment on t'appelle"
                      className={FIELD}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="c-contact" className="text-sm font-medium text-foreground">
                      Contact <span className="text-muted font-normal">(si on doit revenir vers toi)</span>
                    </label>
                    <input
                      id="c-contact"
                      type="email"
                      inputMode="email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      disabled={loading}
                      placeholder="Email"
                      className={FIELD}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-button bg-primary px-6 py-3 text-base font-medium text-primary-foreground",
                      "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_20px_rgba(252,209,22,0.15)]",
                      "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.18),0_0_30px_rgba(252,209,22,0.3)]",
                      "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
                      "disabled:opacity-60 disabled:pointer-events-none disabled:hover:scale-100",
                    )}
                  >
                    {loading ? "Envoi…" : "Envoyer ma contribution"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <span className="text-xs text-foreground/50 leading-relaxed">
                    Vérifiée avant publication. Rien ne rejoint le radar sans validation.
                  </span>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="container-site py-16 border-t border-border">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Comment ça marche</span>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="rounded-card border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-4 display-heading text-xl text-foreground">{title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
