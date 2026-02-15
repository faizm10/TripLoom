import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 600,
}

export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          background: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: "30px", fontWeight: 700 }}>TripLoom</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            <span>AI Travel Planning</span>
            <span>That Feels Simple</span>
          </div>
          <div style={{ fontSize: "28px", opacity: 0.9 }}>
            Flights, hotels, transit, and itineraries together.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
