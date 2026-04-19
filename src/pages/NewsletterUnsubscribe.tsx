import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { supabase } from "@/integrations/supabase/client";

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "invalid" | "error">(
    "loading",
  );

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
          "unsubscribe_newsletter",
          { _token: token },
        );
        if (cancelled) return;
        if (error) throw error;
        const result = data as { status: string };
        if (result.status === "unsubscribed") setStatus("ok");
        else if (result.status === "invalid") setStatus("invalid");
        else setStatus("error");
      } catch (e) {
        console.error("[unsubscribe]", e);
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
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
          )}
          {status === "ok" && (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Désinscription confirmée.
              </h1>
              <p className="mt-4 text-muted-light">
                Tu ne recevras plus la newsletter. À bientôt sur le terrain.
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
              <XCircle className="mx-auto h-14 w-14 text-orange-400" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Lien invalide.
              </h1>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-14 w-14 text-destructive" />
              <h1 className="mt-6 font-serif text-4xl text-foreground">
                Une erreur est survenue.
              </h1>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
