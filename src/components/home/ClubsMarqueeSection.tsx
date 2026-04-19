interface Club {
  name: string;
  logo: string;
}

// Wikipedia Commons SVG logos (public domain / fair use crests)
const CLUBS: Club[] = [
  {
    name: "Lille OSC",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/35/Logo_LOSC_Lille_2018.svg/200px-Logo_LOSC_Lille_2018.svg.png",
  },
  {
    name: "West Ham",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/West_Ham_United_FC_logo.svg/200px-West_Ham_United_FC_logo.svg.png",
  },
  {
    name: "Watford",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e2/Watford.svg/200px-Watford.svg.png",
  },
  {
    name: "Pyramids FC",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/55/Pyramids_FC_logo.png/200px-Pyramids_FC_logo.png",
  },
  {
    name: "Spartak Moscow",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/FC_Spartak_Moscow_logo.svg/200px-FC_Spartak_Moscow_logo.svg.png",
  },
  {
    name: "Real Betis",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Real_betis_logo.svg/200px-Real_betis_logo.svg.png",
  },
  {
    name: "Genk",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/13/KRC_Genk_logo.svg/200px-KRC_Genk_logo.svg.png",
  },
  {
    name: "Sunderland",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Logo_Sunderland.svg/200px-Logo_Sunderland.svg.png",
  },
  {
    name: "Le Havre",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Le_Havre_AC_logo.svg/200px-Le_Havre_AC_logo.svg.png",
  },
  {
    name: "Standard Liège",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Standard_Li%C3%A8ge_logo.svg/200px-Standard_Li%C3%A8ge_logo.svg.png",
  },
  {
    name: "Burnley",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/Burnley_FC_Logo.svg/200px-Burnley_FC_Logo.svg.png",
  },
  {
    name: "Hibernian",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Hibernian_FC_logo.svg/200px-Hibernian_FC_logo.svg.png",
  },
  {
    name: "Widzew Łódź",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Widzew_%C5%81%C3%B3d%C5%BA_logo.svg/200px-Widzew_%C5%81%C3%B3d%C5%BA_logo.svg.png",
  },
  {
    name: "Espanyol",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/64/Rcd_espanyol_logo.svg/200px-Rcd_espanyol_logo.svg.png",
  },
  {
    name: "Castellón",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/CD_Castell%C3%B3n_logo.svg/200px-CD_Castell%C3%B3n_logo.svg.png",
  },
  {
    name: "Montpellier",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Montpellier_HSC_logo.svg/200px-Montpellier_HSC_logo.svg.png",
  },
  {
    name: "Atromitos",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Atromitos_F.C._logo.svg/200px-Atromitos_F.C._logo.svg.png",
  },
  {
    name: "Elche",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Elche_CF_logo.svg/200px-Elche_CF_logo.svg.png",
  },
];

const LOOP = [...CLUBS, ...CLUBS, ...CLUBS];

function ClubItem({ club }: { club: Club }) {
  return (
    <div className="group flex items-center gap-3 px-8 py-4 shrink-0">
      <img
        src={club.logo}
        alt={`${club.name} logo`}
        loading="lazy"
        className="h-10 w-10 object-contain grayscale opacity-60 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <span className="font-serif text-xl font-semibold text-foreground/85 transition-colors duration-300 group-hover:text-foreground">
        {club.name}
      </span>
    </div>
  );
}

export function ClubsMarqueeSection() {
  const maskStyle = {
    maskImage:
      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
  } as const;

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

      <div className="mt-10 flex flex-col gap-4">
        {/* Row 1 — left */}
        <div className="relative flex overflow-hidden" style={maskStyle}>
          <div className="flex animate-marquee whitespace-nowrap shrink-0">
            {LOOP.map((club, i) => (
              <ClubItem key={`row1-${club.name}-${i}`} club={club} />
            ))}
          </div>
        </div>

        {/* Row 2 — right (reverse) */}
        <div className="relative flex overflow-hidden" style={maskStyle}>
          <div className="flex animate-marquee-reverse whitespace-nowrap shrink-0">
            {LOOP.map((club, i) => (
              <ClubItem key={`row2-${club.name}-${i}`} club={club} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClubsMarqueeSection;
