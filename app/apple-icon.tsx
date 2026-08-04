import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#F7F2EA",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", height: 112, position: "relative", width: 128 }}>
        <div style={{ border: "7px solid #292522", borderRadius: 6, bottom: 4, height: 26, left: 2, position: "absolute", width: 56 }} />
        <div style={{ border: "7px solid #292522", borderRadius: 6, height: 26, left: 22, position: "absolute", top: 43, width: 74 }} />
        <div style={{ border: "7px solid #292522", borderRadius: 6, height: 26, left: 40, position: "absolute", top: 2, width: 88 }} />
      </div>
    </div>,
    size,
  )
}
