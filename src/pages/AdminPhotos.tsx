import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerLite {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
}

type RowStatus = "queued" | "uploading" | "done" | "error" | "no-match";

interface Row {
  file: File;
  slug: string; // derived from filename
  matchedPlayer?: PlayerLite;
  status: RowStatus;
  message?: string;
}

const BUCKET = "player-photos";

function slugFromFilename(name: string): string {
  // Remove extension, lowercase, normalise whitespace/diacritics, keep [a-z0-9-]
  const base = name.replace(/\.[^.]+$/, "").trim().toLowerCase();
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extOf(file: File): string {
  const m = file.name.match(/\.([a-z0-9]+)$/i);
  return (m?.[1] ?? "jpg").toLowerCase();
}

export default function AdminPhotos() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [players, setPlayers] = useState<PlayerLite[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Auth gate
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Load players
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, slug, name, image_url")
        .order("name", { ascending: true });
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      setPlayers((data ?? []) as PlayerLite[]);
    })();
  }, [isAdmin]);

  const playersBySlug = useMemo(() => {
    const m = new Map<string, PlayerLite>();
    players.forEach((p) => m.set(p.slug, p));
    return m;
  }, [players]);

  const filtered = useMemo(() => {
    if (!search) return players;
    const s = search.toLowerCase();
    return players.filter(
      (p) => p.name.toLowerCase().includes(s) || p.slug.includes(s),
    );
  }, [players, search]);

  const stats = useMemo(() => {
    const total = players.length;
    const withPhoto = players.filter(
      (p) => p.image_url && p.image_url.includes(BUCKET),
    ).length;
    return { total, withPhoto };
  }, [players]);

  const onFiles = useCallback(
    (fileList: FileList | File[]) => {
      const arr = Array.from(fileList);
      const newRows: Row[] = arr.map((file) => {
        const slug = slugFromFilename(file.name);
        const matched = playersBySlug.get(slug);
        return {
          file,
          slug,
          matchedPlayer: matched,
          status: matched ? "queued" : "no-match",
          message: matched ? undefined : `Aucun joueur avec le slug "${slug}"`,
        };
      });
      setRows((prev) => [...prev, ...newRows]);
    },
    [playersBySlug],
  );

  async function processAll() {
    setProcessing(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.status !== "queued" || !row.matchedPlayer) continue;
        setRows((r) =>
          r.map((x, idx) => (idx === i ? { ...x, status: "uploading" } : x)),
        );
        try {
          const ext = extOf(row.file);
          const path = `${row.slug}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, row.file, { upsert: true, contentType: row.file.type });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: dbErr } = await (supabase as any)
            .from("players")
            .update({ image_url: publicUrl })
            .eq("id", row.matchedPlayer.id);
          if (dbErr) throw dbErr;
          setRows((r) =>
            r.map((x, idx) => (idx === i ? { ...x, status: "done" } : x)),
          );
          setPlayers((ps) =>
            ps.map((p) =>
              p.id === row.matchedPlayer!.id ? { ...p, image_url: publicUrl } : p,
            ),
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Erreur";
          setRows((r) =>
            r.map((x, idx) =>
              idx === i ? { ...x, status: "error", message: msg } : x,
            ),
          );
        }
      }
    } finally {
      setProcessing(false);
    }
  }

  function clearDone() {
    setRows((r) => r.filter((x) => x.status !== "done"));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
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
            Ton compte ({user?.email}) n'a pas le rôle <code>admin</code>. Demande à
            quelqu'un avec accès base de données de te l'attribuer.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={signOut}>
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

  const queued = rows.filter((r) => r.status === "queued").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.25em] text-primary">
              Léopards Radar
            </Link>
            <h1 className="font-serif text-2xl font-semibold mt-1">Photos joueurs</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total joueurs" value={stats.total} />
          <StatCard label="Avec photo bucket" value={stats.withPhoto} />
          <StatCard
            label="Sans photo bucket"
            value={stats.total - stats.withPhoto}
            accent
          />
        </div>

        {/* Drop zone */}
        <section>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
            }}
            className={cn(
              "rounded-card border-2 border-dashed p-10 text-center transition",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-card/40",
            )}
          >
            <Upload className="h-8 w-8 mx-auto text-muted mb-3" />
            <p className="text-sm">
              Dépose tes photos ici. Le nom de fichier doit correspondre au{" "}
              <code className="text-primary">slug</code> du joueur.
            </p>
            <p className="text-xs text-muted mt-1">
              Ex&nbsp;: <code>cedric-bakambu.jpg</code>,{" "}
              <code>aaron-wan-bissaka.png</code>
            </p>
            <label className="inline-block mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-90">
                Ou choisir des fichiers
              </span>
            </label>
          </div>

          {rows.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted">
                {rows.length} fichier{rows.length > 1 ? "s" : ""} ·{" "}
                {queued} en attente
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearDone}>
                  Nettoyer terminés
                </Button>
                <Button
                  size="sm"
                  onClick={processAll}
                  disabled={processing || queued === 0}
                >
                  {processing ? "Upload…" : `Uploader ${queued} fichier(s)`}
                </Button>
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <ul className="mt-4 space-y-2">
              {rows.map((row, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-border bg-card/40 p-3 text-sm"
                >
                  <StatusIcon status={row.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs truncate">
                        {row.file.name}
                      </span>
                      <span className="text-muted text-xs">→</span>
                      <span className="font-mono text-xs text-primary truncate">
                        {row.slug}
                      </span>
                    </div>
                    {row.matchedPlayer ? (
                      <p className="text-xs text-muted mt-0.5">
                        {row.matchedPlayer.name}
                      </p>
                    ) : (
                      <p className="text-xs text-destructive mt-0.5">
                        {row.message}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Player list (search) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl font-semibold">Joueurs ({players.length})</h2>
            <Input
              placeholder="Recherche par nom ou slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.slice(0, 200).map((p) => {
              const hasBucket = p.image_url?.includes(BUCKET);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-card/40 p-2"
                >
                  <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted/30">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] font-mono text-muted truncate">
                      {p.slug}
                    </p>
                  </div>
                  {hasBucket ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : null}
                </div>
              );
            })}
          </div>
          {filtered.length > 200 && (
            <p className="mt-3 text-xs text-muted text-center">
              200 premiers affichés · affine la recherche pour voir les autres
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border p-4",
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
      )}
    >
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: RowStatus }) {
  if (status === "uploading")
    return <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />;
  if (status === "done")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "error" || status === "no-match")
    return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <div className="h-4 w-4 rounded-full border border-border shrink-0" />;
}
