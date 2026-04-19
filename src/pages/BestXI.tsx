import { useState, type FormEvent } from "react";
import { Link2, MessageCircle, Twitter, Instagram } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";

const PITCH_IMG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=80";

// Approximate normalized positions on the pitch (4-3-3, attack at top)
const POSITIONS: { label: string; x: number; y: number }[] = [
  // ATT row (top)
  { label: "9", x: 50, y: 18 },
  { label: "11", x: 22, y: 24 },
  { label: "7", x: 78, y: 24 },
  // MID row
  { label: "8", x: 30, y: 44 },
  { label: "6", x: 50, y: 48 },
  { label: "10", x: 70, y: 44 },
  // DEF row
  { label: "3", x: 15, y: 68 },
  { label: "4", x: 38, y: 70 },
  { label: "5", x: 62, y: 70 },
  { label: "2", x: 85, y: 68 },
  // GK
  { label: "1", x: 50, y: 88 },
];

const ARCHIVES = [
  { date: "08 avr. 2026", title: "Édition #14" },
  { date: "01 avr. 2026", title: "Édition #13" },
  { date: "25 mars 2026", title: "Édition #12" },
  { date: "18 mars 2026", title: "Édition #11" },
  { date: "11 mars 2026", title: "Édition #10" },
  { date: "04 mars 2026", title: "Édition #09" },
];

export default function BestXI() {
  const [email, setEmail] = useState("");

  const onNotify = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmail("");
    alert("Merci ! On te prévient dès le lancement.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <header className="container-site pt-32 pb-12">
          <h1 className="font-serif text-6xl text-foreground">
            Le Best XI Diaspora.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">
            Chaque semaine, notre composition rêvée des Léopards.
          </p>
        </header>

        {/* Current week */}
        <section className="container-site pb-20">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Semaine du 15 avril 2026
          </p>

          <div className="mx-auto mt-6 aspect-[4/5] w-full max-w-lg overflow-hidden rounded-card border border-border bg-card relative">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${PITCH_IMG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.35) saturate(1.1)",
              }}
            />
            {/* Yellow glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
              }}
            />

            {/* Formation label */}
            <span className="absolute left-5 top-5 font-serif text-2xl font-semibold text-foreground/90">
              4-3-3
            </span>

            {/* Player dots */}
            {POSITIONS.map((p, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/60 bg-background/80 font-mono text-xs font-bold text-primary backdrop-blur-md shadow-lg shadow-primary/20">
                    {p.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Share */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm">
              <Twitter className="h-4 w-4" /> Partager
            </Button>
            <Button variant="outline" size="sm">
              <Instagram className="h-4 w-4" /> Instagram
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4" /> Copier
            </Button>
          </div>

          {/* Editorial caption */}
          <p className="mx-auto mt-10 max-w-prose text-center font-serif text-lg italic leading-relaxed text-foreground/80">
            Mbemba en patron, Sadiki en métronome, Wissa en pointe : un onze qui
            mêle expérience et insolence. Bakambu sur le banc, ça veut tout dire
            sur la profondeur du vivier.
          </p>
        </section>

        {/* Archives */}
        <section className="container-site py-20">
          <h2 className="font-serif text-3xl text-foreground">Archives.</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ARCHIVES.map((a) => (
              <a
                key={a.title}
                href="#"
                className="group block overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-border-hover"
              >
                <div
                  className="aspect-[4/5] w-full"
                  style={{
                    backgroundImage: `url(${PITCH_IMG})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.4)",
                  }}
                />
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs text-muted">{a.date}</p>
                    <p className="font-serif text-lg text-foreground">{a.title}</p>
                  </div>
                  <span className="text-sm text-primary group-hover:text-primary-hover">
                    Voir →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* V2 tease */}
        <section className="container-site py-16">
          <div className="mx-auto max-w-2xl rounded-card border border-primary/30 bg-gradient-to-br from-card to-background p-8 text-center">
            <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              Bientôt
            </span>
            <h3 className="mt-4 font-serif text-2xl text-foreground">
              Compose TON Best XI Léopards.
            </h3>
            <p className="mt-3 text-muted">
              Drag-and-drop, partage sur les réseaux, vote communautaire. On finalise.
            </p>
            <form
              onSubmit={onNotify}
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="flex-1 rounded-button border border-border bg-background px-5 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" variant="primary" size="md">
                Me notifier
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
