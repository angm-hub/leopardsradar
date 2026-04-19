import SectionWithMockup from "./SectionWithMockup";

export function RadarPreviewSection() {
  return (
    <SectionWithMockup
      badge="LE RADAR"
      title={<>Ces joueurs pourraient un jour porter le maillot.</>}
      description="On traque les talents éligibles aux Léopards dans les plus grands championnats. Ascendance, double nationalité, lien familial avec la RDC. Chaque profil documenté, sourcé, vérifié."
      ctaLabel="Explorer le Radar"
      ctaHref="/radar"
      primaryImageSrc="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80"
      secondaryImageSrc="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80"
    />
  );
}

export default RadarPreviewSection;
