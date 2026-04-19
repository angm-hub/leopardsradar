import { Activity, Feather, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/ButtonPrimitive";

export function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    window.alert("Merci ! Tu recevras la prochaine édition vendredi.");
    setEmail("");
  };

  return (
    <section className="relative py-24 md:py-40 bg-card overflow-hidden">
      {/* Subtle grid pattern */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.03] text-foreground"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="container-site relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            Le Radar Léopards
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Une édition. Tous les vendredis.
          </h2>
          <p className="mt-5 text-muted-light text-lg max-w-xl mx-auto leading-relaxed">
            Les performances de vos Léopards, un talent à surveiller, et
            l'analyse de la semaine. Soigné. Court. Gratuit.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {[
              { icon: Activity, label: "Performances hebdo" },
              { icon: Sparkles, label: "Un talent surveillé" },
              { icon: Feather, label: "L'analyse de la semaine" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 text-sm text-foreground/80"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 mx-auto max-w-lg flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              required
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background border border-border rounded-button px-5 py-4 text-foreground placeholder:text-muted focus:border-primary outline-none transition-colors"
            />
            <Button type="submit" variant="primary" size="lg">
              Recevoir
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted">
            247 fans abonnés · 0 spam · Se désabonner en 1 clic
          </p>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
