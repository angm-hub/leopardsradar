const CLUBS = [
  { name: "Lille OSC", flag: "🇫🇷" },
  { name: "West Ham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Watford", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Pyramids FC", flag: "🇪🇬" },
  { name: "Spartak Moscow", flag: "🇷🇺" },
  { name: "Real Betis", flag: "🇪🇸" },
  { name: "Genk", flag: "🇧🇪" },
  { name: "Sunderland", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Le Havre", flag: "🇫🇷" },
  { name: "Standard Liège", flag: "🇧🇪" },
  { name: "Burnley", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Hibernian", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Widzew Łódź", flag: "🇵🇱" },
  { name: "Espanyol", flag: "🇪🇸" },
  { name: "Castellón", flag: "🇪🇸" },
  { name: "Montpellier", flag: "🇫🇷" },
  { name: "Atromitos", flag: "🇬🇷" },
  { name: "Elche", flag: "🇪🇸" },
];

const LOOP = [...CLUBS, ...CLUBS, ...CLUBS];

export function ClubsMarqueeSection() {
  return (
    <section className="py-16 md:py-24 bg-background border-t border-b border-border">
      <div className="container-site">
        <p className="text-center text-sm font-medium uppercase tracking-[0.25em] text-muted">
          Ils évoluent partout dans le monde.
        </p>
      </div>

      <div
        className="relative mt-10 flex overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
        }}
      >
        <div className="flex animate-marquee gap-12 whitespace-nowrap shrink-0 pr-12">
          {LOOP.map((club, i) => (
            <div
              key={`${club.name}-${i}`}
              className="flex items-center gap-3 shrink-0"
            >
              <span className="text-2xl leading-none">{club.flag}</span>
              <span className="text-xl font-serif font-semibold text-foreground/85">
                {club.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClubsMarqueeSection;
