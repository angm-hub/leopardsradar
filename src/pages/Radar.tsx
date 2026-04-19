import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Select } from "@/components/ui/SelectPrimitive";
import PlayerCardSkeleton from "@/components/ui/PlayerCardSkeleton";
import { usePlayers } from "@/hooks/usePlayers";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ELIGIBILITY = [
  { value: "ALL", label: "Toutes" },
  { value: "Ascendance parent direct", label: "Ascendance parent" },
  { value: "Ascendance grand-parent", label: "Ascendance grand-parent" },
  { value: "Dual-nationalité", label: "Dual-nationalité" },
  { value: "Résidence", label: "Résidence" },
];

const NATIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "France", label: "France" },
  { value: "Belgique", label: "Belgique" },
  { value: "Angleterre", label: "Angleterre" },
  { value: "Pays-Bas", label: "Pays-Bas" },
  { value: "Portugal", label: "Portugal" },
  { value: "Suisse", label: "Suisse" },
];

const AGES = [
  { value: "ALL", label: "Tous" },
  { value: "U21", label: "U21" },
  { value: "U23", label: "U23" },
  { value: "23-27", label: "23-27" },
  { value: "27+", label: "27+" },
];

const PRIORITY = [
  { value: "ALL", label: "Toutes" },
  { value: "HIGH", label: "Élevée" },
  { value: "MED", label: "Moyenne" },
  { value: "WATCH", label: "Observer" },
];

export default function Radar() {
  const { players: radarPlayers, loading, error } = usePlayers({ category: "Radar" });
  const [eligibility, setEligibility] = useState("ALL");
  const [nation, setNation] = useState("ALL");
  const [age, setAge] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return radarPlayers.filter((p) => {
      if (eligibility !== "ALL" && p.radarEligibility !== eligibility) return false;
      if (nation !== "ALL" && p.nationalitySport !== nation) return false;
      if (age === "U21" && p.age >= 21) return false;
      if (age === "U23" && p.age >= 23) return false;
      if (age === "23-27" && (p.age < 23 || p.age > 27)) return false;
      if (age === "27+" && p.age <= 27) return false;
      void priority;
      return true;
    });
  }, [radarPlayers, eligibility, nation, age, priority]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? ""),
      player_name: String(formData.get("player_name") ?? ""),
      sources: String(formData.get("sources") ?? ""),
    };
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from("contact_suggestions")
        .insert(payload);
      if (err) throw err;
      form.reset();
      toast.success("Merci, on regarde ça dès cette semaine.");
    } catch (err) {
      console.error("[Radar suggestion]", err);
      toast.error("Impossible d'envoyer. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <header className="container-site pt-32 pb-8">
          <h1 className="font-serif text-6xl md:text-7xl font-semibold text-foreground">
            Le Radar.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">
            Ces joueurs pourraient un jour porter le maillot des Léopards. On les observe.
          </p>
        </header>

        {/* Explainer */}
        <div className="container-site mb-12">
          <details
            className="rounded-card border border-border bg-card p-6"
            onToggle={(e) => setExplainerOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-foreground">
              <span className="font-serif text-lg">Comprendre l'éligibilité FIFA</span>
              <ChevronDown
                className={`h-5 w-5 text-muted transition-transform ${
                  explainerOpen ? "rotate-180" : ""
                }`}
              />
            </summary>
            <div className="mt-6 space-y-4 text-foreground/80 leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">Articles 5 à 8 du règlement FIFA.</span>{" "}
                Un joueur peut représenter une nation s'il en possède la nationalité, ou s'il a un parent
                ou grand-parent né dans le pays.
              </p>
              <p>
                Une <span className="font-semibold text-foreground">résidence ininterrompue de 5 ans</span>{" "}
                après l'âge de 18 ans dans le pays peut également ouvrir l'éligibilité.
              </p>
              <p>
                Règle dite du <span className="font-semibold text-foreground">one-time switch</span> :
                un joueur ayant disputé moins de 3 matchs A officiels (hors phases finales) avec une nation
                peut changer de sélection une fois dans sa carrière.
              </p>
            </div>
          </details>
        </div>

        {/* Filters */}
        <div className="sticky top-16 z-20 border-y border-border bg-background/85 backdrop-blur-lg py-4">
          <div className="container-site flex flex-wrap items-center gap-3">
            <Select
              label="Éligibilité"
              options={ELIGIBILITY}
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
            />
            <Select
              label="Sélection actuelle"
              options={NATIONS}
              value={nation}
              onChange={(e) => setNation(e.target.value)}
            />
            <Select
              label="Âge"
              options={AGES}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Select
              label="Priorité"
              options={PRIORITY}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <span className="ml-auto text-sm text-muted">
              {loading ? "…" : `${filtered.length} profils`}
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="container-site flex flex-col gap-6 py-12">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] animate-shimmer rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card"
                style={{ backgroundSize: "200% 100%" }}
              />
            ))
          ) : error ? (
            <p className="py-16 text-center text-muted-light">
              Données en cours de chargement…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-light">
              {radarPlayers.length === 0
                ? "Aucun profil radar pour l'instant."
                : "Aucun joueur ne correspond à ces filtres."}
            </p>
          ) : null}
          {filtered.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col gap-6 rounded-card border border-border bg-card p-6 transition-colors hover:border-border-hover md:flex-row"
            >
              <img
                src={p.photoUrl}
                alt={p.name}
                loading="lazy"
                className="aspect-square w-full rounded-card object-cover md:h-[200px] md:w-[200px]"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                    <Zap className="h-3 w-3" /> Radar
                  </span>
                  <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs uppercase tracking-wider text-muted-light">
                    {p.nationalitySport}
                  </span>
                  <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs uppercase tracking-wider text-muted-light">
                    {p.age} ans
                  </span>
                  {p.radarEligibility ? (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                      {p.radarEligibility}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 font-serif text-3xl text-foreground">{p.name}</h2>
                <p className="text-muted">
                  {p.club} · {p.positionLabel}
                </p>

                <p className="mt-4 font-serif text-base italic leading-relaxed text-foreground/85">
                  {p.radarReason}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  {p.radarSources?.length ? (
                    <>
                      <span className="text-muted">Sources :</span>
                      {p.radarSources.map((s) => (
                        <a
                          key={s.title}
                          href={s.url}
                          className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary"
                        >
                          {s.title}
                        </a>
                      ))}
                    </>
                  ) : null}
                  <Link
                    to={`/player/${p.slug}`}
                    className="ml-auto inline-flex items-center gap-1 text-primary hover:text-primary-hover"
                  >
                    Voir profil complet →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Contribute */}
        <section className="container-site py-20">
          <div className="mx-auto max-w-2xl rounded-card border border-border bg-card p-8">
            <h3 className="font-serif text-2xl text-foreground">
              Tu as une info ? Un joueur à suggérer ?
            </h3>
            <p className="mt-3 text-muted">
              On lit tout. Une source, un lien, un tuyau — chaque suggestion est étudiée.
            </p>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Ton email"
                className="w-full rounded-button border border-border bg-background px-5 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
              <input
                name="player_name"
                type="text"
                required
                placeholder="Nom du joueur"
                className="w-full rounded-button border border-border bg-background px-5 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
              <textarea
                name="sources"
                required
                rows={3}
                placeholder="Sources / liens"
                className="w-full rounded-button border border-border bg-background px-5 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? "Envoi…" : "Envoyer ma suggestion"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
