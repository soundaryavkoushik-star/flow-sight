import FigmaLanding from "@/components/figma-landing"
import { requireDevelopmentRoute } from "@/lib/development-route"

/**
 * Authentication-independent preview of the public landing page.
 * The root route still sends returning users directly to their dashboard.
 */
export default function LandingPage() {
  requireDevelopmentRoute()
  return <FigmaLanding />
}
