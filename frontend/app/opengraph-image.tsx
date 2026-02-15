import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "36px",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              border: "2px solid rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            TL
          </div>
          TripLoom
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            <span>Plan, Book, and Manage</span>
            <span>Trips in One Place</span>
          </div>
          <div style={{ fontSize: "30px", opacity: 0.9 }}>
            AI-guided travel for first-time travelers.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
