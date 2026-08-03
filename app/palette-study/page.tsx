import FigmaPaletteStudy from "@/components/figma-palette-study";
import { requireDevelopmentRoute } from "@/lib/development-route";

export default function PaletteStudyPage() {
  requireDevelopmentRoute();
  return <FigmaPaletteStudy />;
}
