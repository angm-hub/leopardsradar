import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate("/admin/photos", { replace: true });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin/photos` },
        });
        if (error) throw error;
        toast({
          title: "Compte créé",
          description: "Vérifie ton email pour confirmer.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/admin/photos", { replace: true });
      }
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Inconnue",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8">
        <Link to="/" className="block text-xs uppercase tracking-[0.25em] text-primary mb-6">
          ← Léopards Radar
        </Link>
        <h1 className="font-serif text-3xl font-semibold mb-1">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-sm text-muted mb-6">Espace admin uniquement.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "..." : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-6 w-full text-xs text-muted hover:text-foreground transition"
        >
          {mode === "signin"
            ? "Pas de compte ? Créer un compte"
            : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </main>
  );
}
