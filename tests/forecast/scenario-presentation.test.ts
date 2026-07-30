import { describe, expect, it } from "vitest"
import { formatCurrencyCents } from "../../lib/financial/currency"
import { decisionRoomNote, safeDateComparisonLabel, scenarioChartScale } from "../../lib/forecast/scenario-presentation"

describe("scenario presentation", () => {
  it("preserves the sign of a negative projected low", () => {
    expect(formatCurrencyCents(-39_900)).toBe("-$399")
  })

  it("uses below-zero language when no positive buffer exists", () => {
    expect(decisionRoomNote({
      safeToSpendCents: 0,
      lowestBalanceCents: -39_900,
      hasPositiveBuffer: false,
      throughLabel: "Aug 27",
    })).toBe("Your projected balance falls below $0 in this outlook.")
    expect(safeDateComparisonLabel(false)).toBe("above $0")
  })

  it("distinguishes reaching zero from falling below it", () => {
    expect(decisionRoomNote({
      safeToSpendCents: 0,
      lowestBalanceCents: 0,
      hasPositiveBuffer: false,
      throughLabel: "Aug 27",
    })).toBe("Your projected balance reaches $0 before your next income.")
  })

  it("keeps the negative chart boundary close to the actual low", () => {
    const scale = scenarioChartScale([600_000, -39_900, 510_000], 0)
    expect(scale.showThreshold).toBe(true)
    expect(scale.domain[0]).toBe(-40_000)
  })

  it("does not squash a positive low against an irrelevant zero floor", () => {
    const scale = scenarioChartScale([600_000, 89_900, 510_000], 0)
    expect(scale.showThreshold).toBe(false)
    expect(scale.domain[0]).toBe(80_000)
  })
})
