import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";
type CType = "correction" | "new_player" | "observation" | "source" | "other";

interface Contribution {
  id: number;
  created_at: string;
  status: Status;
  type: CType;
  player_name: string | null;
  message: string | null;
  source_url: string | null;
  contributor_name: string | null;
  contributor_contact: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

const TYPE_LABEL: Record<CType, string> = {
  correction: "Correction",
  new_player: "Nouveau joueur",
  observation: "Observation",
  source: "Source",
  other: "Autre",
};

const TABS: { value: Status; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Validées" },
  { value: "rejected", label: "Rejetées" },
];

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminContributions() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Contribution[]>([]);
  const [tab, setTab] = useState<Status>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);

  // Auth gate — même motif que AdminPhotos.
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  async function load() {
    setFetching(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("contributions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data ?? []) as Contribution[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur de chargement";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [rows]);

  const visible = useMemo(
    () => rows.filter((r) => r.status === tab),
    [rows, tab],
  );

  async function decide(row: Contribution, next: "approved" | "rejected") {
    if (busy) return;
    setBusy(row.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("contributions")
        .update({
          status: next,
          reviewed_by: user?.email ?? "arbitre",
          reviewed_at: new Date().toISOString(),
          review_note: notes[row.id]?.trim() || null,
        })
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: next,
                reviewed_by: user?.email ?? "arbitre",
                reviewed_at: new Date().toISOString(),
                review_note: notes[row.id]?.trim() || null,
              }
            : r,
        ),
      );
      toast({
        title: next === "approved" ? "Validée" : "Rejetée",
        description:
          next === "approved" && row.type === "new_player"
            ? "Pense à créer le joueur dans la base (gate signal RDC)."
            : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action impossible";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl font-semibold mb-2">Accès refusé</h1>
          <p className="text-sm text-muted mb-6">
            Ton compte ({user?.email}) n'a pas le rôle <code>admin</code>.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth", { replace: true });
              }}
            >
              Se déconnecter
            </Button>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.25em] text-primary">
              Léopards Radar
            </Link>
            <h1 className="font-serif text-2xl font-semibold mt-1">Contributions</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth", { replace: true });
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-button border px-4 py-2 text-sm transition-colors",
                tab === t.value
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-card/40 text-muted hover:text-foreground",
              )}
            >
              {t.label}
              <span className="ml-2 font-mono text-xs text-muted">
                {counts[t.value]}
              </span>
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={load}
            disabled={fetching}
          >
            {fetching ? "…" : "Rafraîchir"}
          </Button>
        </div>

        {/* List */}
        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            Aucune contribution {tab === "pending" ? "en attente" : tab === "approved" ? "validée" : "rejetée"}.
          </p>
        ) : (
          <ul className="space-y-4">
            {visible.map((r) => (
              <li
                key={r.id}
                className="rounded-card border border-border bg-card/40 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-primary">
                    {TYPE_LABEL[r.type]}
                  </span>
                  {r.player_name && (
                    <span className="text-sm font-medium text-foreground">
                      {r.player_name}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted">{fmtDate(r.created_at)}</span>
                </div>

                {r.message && (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {r.message}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                  {r.source_url && (
                    <a
                      href={/^https?:\/\//.test(r.source_url) ? r.source_url : `https://${r.source_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cobalt-mist hover:text-foreground transition-colors break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {r.source_url}
                    </a>
                  )}
                  {r.contributor_name && <span>Par {r.contributor_name}</span>}
                  {r.contributor_contact && <span>{r.contributor_contact}</span>}
                </div>

                {r.status === "pending" ? (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={notes[r.id] ?? ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [r.id]: e.target.value }))
                      }
                      placeholder="Note de revue (optionnel)"
                      className="flex-1 rounded-button border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => decide(r, "approved")}
                        disabled={busy === r.id}
                        className="gap-1.5"
                      >
                        <Check className="h-4 w-4" /> Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide(r, "rejected")}
                        disabled={busy === r.id}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" /> Rejeter
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-border pt-3 text-xs text-muted">
                    <span
                      className={cn(
                        "font-medium",
                        r.status === "approved" ? "text-emerald-400" : "text-destructive",
                      )}
                    >
                      {r.status === "approved" ? "Validée" : "Rejetée"}
                    </span>
                    {r.reviewed_by && <span> par {r.reviewed_by}</span>}
                    {r.reviewed_at && <span> · {fmtDate(r.reviewed_at)}</span>}
                    {r.review_note && (
                      <span className="block mt-1 text-foreground/70">« {r.review_note} »</span>
                    )}
                    {r.status === "approved" && r.type === "new_player" && (
                      <span className="block mt-1 text-primary/80">
                        À créer dans la base (respecter le gate signal RDC).
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
