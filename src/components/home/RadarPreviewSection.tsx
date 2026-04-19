import SectionWithMockup from "./SectionWithMockup";
import BrowserFrame from "@/components/ui/BrowserFrame";
import RadarPagePreview from "@/components/ui/RadarPagePreview";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";

export function RadarPreviewSection() {
  return (
    <div className="relative">
      <ResidualGradient position="sides" />
      <SectionWithMockup
        badge="LE RADAR"
        title={<>Ces joueurs pourraient un jour porter le maillot.</>}
        description="On traque les talents éligibles aux Léopards dans les plus grands championnats. Ascendance, double nationalité, lien familial avec la RDC. Chaque profil documenté, sourcé, vérifié."
        ctaLabel="Explorer le Radar"
        ctaHref="/radar"
        secondaryImageSrc="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80"
        primaryNode={
          <BrowserFrame url="leopardsradar.com/radar">
            <RadarPagePreview />
          </BrowserFrame>
        }
      />
    </div>
  );
}

export default RadarPreviewSection;
