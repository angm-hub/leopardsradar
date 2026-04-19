import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, MailWarning } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "confirmed" | "already" | "invalid" | "error";

export default function NewsletterConfirm() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc(
          "confirm_newsletter_subscription",
          { _token: token },
        );
        if (cancelled) return;
        if (error) throw error;
        const result = data as { status: string; email?: string };
        if (result.email) setEmail(result.email);
        if (result.status === "confirmed") setStatus("confirmed");
        else if (result.status === "already_confirmed") setStatus("already");
        else if (result.status === "invalid") setStatus("invalid");
        else setStatus("error");
      } catch (e) {
        console.error("[confirm]", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container-site py-32">
        <div className="mx-auto max-w-xl text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <h1 className="mt-6 font-serif text-3xl text-foreground">
                Confirmation en cours…
              </h1>
            </>
          )}

          {status === "confirmed" && (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Bienvenue chez les Léopards.
              </h1>
              <p className="mt-4 text-muted-light">
                {email ? `${email} est confirmé.` : "Inscription confirmée."}{" "}
                Première édition vendredi.
              </p>
              <div className="mt-8">
                <Link to="/">
                  <Button variant="primary" size="lg">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Tu es déjà confirmé.
              </h1>
              <p className="mt-4 text-muted-light">
                {email
                  ? `${email} fait déjà partie des abonnés.`
                  : "Tu es déjà dans la liste."}
              </p>
              <div className="mt-8">
                <Link to="/">
                  <Button variant="primary" size="lg">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === "invalid" && (
            <>
              <MailWarning className="mx-auto h-14 w-14 text-orange-400" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Lien invalide ou expiré.
              </h1>
              <p className="mt-4 text-muted-light">
                Ce lien de confirmation n'est pas reconnu. Réessaie de
                t'inscrire depuis l'accueil.
              </p>
              <div className="mt-8">
                <Link to="/#newsletter">
                  <Button variant="primary" size="lg">
                    S'inscrire à nouveau
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-14 w-14 text-destructive" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Une erreur est survenue.
              </h1>
              <p className="mt-4 text-muted-light">
                Réessaie dans quelques instants.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
