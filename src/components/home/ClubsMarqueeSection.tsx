import { useTier1Clubs } from "@/hooks/useTier1Clubs";

function ClubItem({ name }: { name: string }) {
  return (
    <div className="group flex items-center gap-3 px-8 py-4 shrink-0">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-card to-background border border-border flex items-center justify-center text-xs font-bold text-foreground/70 transition-all duration-300 group-hover:text-foreground group-hover:border-primary/40">
        {name
          .split(/\s+/)
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 3)
          .join("")
          .toUpperCase()}
      </div>
      <span className="font-serif text-xl font-semibold text-foreground/85 transition-colors duration-300 group-hover:text-foreground">
        {name}
      </span>
    </div>
  );
}

export function ClubsMarqueeSection() {
  const { clubs, loading } = useTier1Clubs();

  const maskStyle = {
    maskImage:
      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
  } as const;

  // Need enough items for the marquee to look full — repeat 3x
  const list = clubs.length ? clubs : [];
  const loop = [...list, ...list, ...list];
  // Split into two visual rows
  const half = Math.ceil(list.length / 2);
  const row1 = [...list.slice(0, half), ...list.slice(0, half), ...list.slice(0, half)];
  const row2 = [...list.slice(half), ...list.slice(half), ...list.slice(half)];

  return (
    <section className="py-16 md:py-24 bg-background border-t border-b border-border">
      <div className="container-site flex flex-col items-center text-center gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted">
          Ils évoluent partout dans le monde.
        </p>
        <p className="font-serif italic text-xl text-muted max-w-md">
          De Kinshasa à Londres. De Moscou au Caire.
        </p>
      </div>

      {loading || list.length === 0 ? (
        <div className="mt-10 text-center text-sm text-muted">
          {loading ? "Chargement des clubs…" : "Aucun club à afficher."}
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-4">
          <div className="relative flex overflow-hidden" style={maskStyle}>
            <div className="flex animate-marquee whitespace-nowrap shrink-0">
              {(row1.length ? row1 : loop).map((name, i) => (
                <ClubItem key={`row1-${name}-${i}`} name={name} />
              ))}
            </div>
          </div>

          {row2.length > 0 && (
            <div className="relative flex overflow-hidden" style={maskStyle}>
              <div className="flex animate-marquee-reverse whitespace-nowrap shrink-0">
                {row2.map((name, i) => (
                  <ClubItem key={`row2-${name}-${i}`} name={name} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ClubsMarqueeSection;
