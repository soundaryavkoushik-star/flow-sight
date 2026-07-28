import { ImageResponse } from "next/og"

export const alt = "FlowSight — See what’s next for your money"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#FFFDFC",
          color: "#111827",
          fontFamily: "Arial, sans-serif",
          padding: "66px 74px",
        }}
      >
        <div style={{ position: "absolute", width: 520, height: 520, right: -100, top: -190, borderRadius: 999, background: "rgba(201,107,67,0.12)" }} />
        <div style={{ display: "flex", width: "100%", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 700 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 12, background: "#111827", color: "#FFFDFC", fontSize: 24 }}>↗</div>
            FlowSight
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 62 }}>
            <div style={{ display: "flex", width: 560, flexDirection: "column" }}>
              <div style={{ color: "#C96B43", fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase" }}>30-day cash-flow forecast</div>
              <div style={{ display: "flex", marginTop: 20, flexDirection: "column", fontSize: 64, lineHeight: 1.03, letterSpacing: "-0.04em", fontWeight: 600 }}>
                See what&apos;s next
                <span style={{ color: "#C96B43" }}>for your money.</span>
              </div>
              <div style={{ marginTop: 24, color: "#4B5563", fontSize: 24, lineHeight: 1.45 }}>Know the tight days, upcoming commitments, and what remains safe to spend—before you make the next decision.</div>
            </div>

            <div style={{ display: "flex", width: 405, height: 288, flexDirection: "column", border: "1px solid #E7DDD1", borderRadius: 28, background: "#FFFFFF", padding: "26px 28px", boxShadow: "0 24px 60px rgba(28,28,34,0.10)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#73766F", fontSize: 15 }}>Projected balance</div>
                <div style={{ padding: "7px 12px", borderRadius: 999, background: "#F8EFD9", color: "#B7791F", fontSize: 14 }}>Watch · Aug 3</div>
              </div>
              <svg viewBox="0 0 350 150" width="350" height="150" style={{ marginTop: 16 }}>
                <line x1="8" y1="116" x2="342" y2="116" stroke="#B7791F" strokeWidth="2" strokeDasharray="7 6" opacity="0.65" />
                <path d="M10 30 C65 34 82 50 118 54 C156 60 168 92 206 105 C238 116 258 120 282 112 C306 102 316 72 340 60" fill="none" stroke="#C96B43" strokeWidth="6" strokeLinecap="round" />
                <circle cx="282" cy="112" r="9" fill="#C96B43" stroke="#FFFFFF" strokeWidth="4" />
              </svg>
              <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#73766F", fontSize: 13 }}>Projected low</span><span style={{ marginTop: 3, fontSize: 27, fontWeight: 600 }}>$420</span></div>
                <div style={{ color: "#B7791F", fontSize: 14 }}>5 days before payday</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", color: "#73766F", fontSize: 17 }}>Connection-free setup · Transparent calculations · No budgets to maintain</div>
        </div>
      </div>
    ),
    size,
  )
}
