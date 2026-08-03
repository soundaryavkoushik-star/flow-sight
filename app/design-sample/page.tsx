import DesignSampleLanding from "@/components/design-sample-landing"
import { requireDevelopmentRoute } from "@/lib/development-route"

export const metadata = {
  title: "Design sample",
  description: "A FlowSight visual direction study.",
}

export default function DesignSamplePage() {
  requireDevelopmentRoute()
  return <DesignSampleLanding />
}
