import SectionWithMockup from "./SectionWithMockup";

export function BestXIPreviewSection() {
  return (
    <SectionWithMockup
      reverseLayout
      badge="BEST XI DIASPORA"
      title={<>Notre composition rêvée, chaque semaine.</>}
      description="Si on alignait le meilleur XI possible des Léopards en 2026, roster actuel + diaspora éligible confondus, ça donnerait quoi ? On fait l'exercice tous les vendredis."
      ctaLabel="Voir toutes les compositions"
      ctaHref="/best-xi"
      primaryImageSrc="https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=80"
      secondaryImageSrc="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80"
    />
  );
}

export default BestXIPreviewSection;
