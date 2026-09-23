import { ImageResponse } from "next/og";

export const alt = "Street-Car — Everything automotive. One place.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "radial-gradient(ellipse at 80% 20%, #5a140e 0%, #08080a 60%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#ff3b2f,#ff7a18)" }} />
          <div style={{ fontSize: 40, fontWeight: 700, display: "flex" }}>
            Street<span style={{ color: "#ff3b2f" }}>-Car</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>Everything automotive.</div>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1.1, color: "#ff5446" }}>One place.</div>
          <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 28 }}>Buy, sell, trade, and discover automotive events.</div>
        </div>
      </div>
    ),
    size,
  );
}
