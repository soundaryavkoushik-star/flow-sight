import FigmaLanding from "@/components/figma-landing"

/**
 * Authentication-independent preview of the public landing page.
 * The root route still sends returning users directly to their dashboard.
 */
export default function LandingPage() {
  return <FigmaLanding />
}
