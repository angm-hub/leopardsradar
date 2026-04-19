import SectionWithMockup from "./SectionWithMockup";
import LineupPitch, { type LineupPlayer } from "@/components/ui/LineupPitch";
import BrowserFrame from "@/components/ui/BrowserFrame";

const mockLineup: LineupPlayer[] = [
  {
    name: "Mpasi-Nzau",
    position: "GK",
    photoUrl:
      "https://images.unsplash.com/photo-1566577134624-a1bcda9faf3a?w=200&q=80",
    club: "Le Havre",
    nationalityFlag: "🇫🇷",
  },
  {
    name: "Wan-Bissaka",
    position: "RB",
    photoUrl:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80",
    club: "West Ham",
    nationalityFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  },
  {
    name: "Mbemba",
    position: "CB",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    club: "Lille",
    nationalityFlag: "🇫🇷",
  },
  {
    name: "Tuanzebe",
    position: "CB",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    club: "Burnley",
    nationalityFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  },
  {
    name: "Masuaku",
    position: "LB",
    photoUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
    club: "Lens",
    nationalityFlag: "🇫🇷",
  },
  {
    name: "Sadiki",
    position: "CM",
    photoUrl:
      "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&q=80",
    club: "Sunderland",
    nationalityFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  },
  {
    name: "Kayembe",
    position: "CM",
    photoUrl:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80",
    club: "Watford",
    nationalityFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  },
  {
    name: "Moutoussamy",
    position: "CM",
    photoUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
    club: "Atromitos",
    nationalityFlag: "🇬🇷",
  },
  {
    name: "Bongonda",
    position: "LW",
    photoUrl:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80",
    club: "Spartak",
    nationalityFlag: "🇷🇺",
  },
  {
    name: "Mayele",
    position: "ST",
    photoUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
    club: "Pyramids",
    nationalityFlag: "🇪🇬",
  },
  {
    name: "Bakambu",
    position: "RW",
    photoUrl:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=200&q=80",
    club: "Real Betis",
    nationalityFlag: "🇪🇸",
  },
];

export function BestXIPreviewSection() {
  return (
    <SectionWithMockup
      className="bg-card/30"
      reverseLayout
      badge="BEST XI DIASPORA"
      title={<>Notre composition rêvée, chaque semaine.</>}
      description="Si on alignait le meilleur XI possible des Léopards en 2026, roster actuel + diaspora éligible confondus, ça donnerait quoi ? On fait l'exercice tous les vendredis."
      ctaLabel="Voir toutes les compositions"
      ctaHref="/best-xi"
      secondaryImageSrc="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80"
      primaryNode={
        <BrowserFrame url="leopardsradar.com/best-xi">
          <LineupPitch
            formation="4-3-3"
            players={mockLineup}
            date="Sem. 16 · 2026"
          />
        </BrowserFrame>
      }
    />
  );
}

export default BestXIPreviewSection;
