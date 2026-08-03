import FlowSightEditorialSample from "@/components/flowsight-editorial-sample"
import { requireDevelopmentRoute } from "@/lib/development-route"

export const metadata = {
  title: "Editorial design sample",
  description: "FlowSight editorial landing-page direction.",
}

export default function DesignSampleTwoPage() {
  requireDevelopmentRoute()
  return <FlowSightEditorialSample />
}
