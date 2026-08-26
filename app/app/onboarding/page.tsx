import type { Metadata } from "next"
import FigmaOnboarding from "@/components/figma-onboarding"

export const metadata: Metadata = { title: "Set up your forecast" }

export default function OnboardingPage() {
  return <FigmaOnboarding />
}
