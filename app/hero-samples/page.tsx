import HeroDirectionSamples from "@/components/hero-direction-samples"
import { requireDevelopmentRoute } from "@/lib/development-route"

export const metadata = {
  title: "Hero direction samples",
  description: "Two FlowSight landing-page hero directions for comparison.",
}

export default function HeroSamplesPage() {
  requireDevelopmentRoute()
  return <HeroDirectionSamples />
}
