import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      fontFamily: "var(--f-display)", color: "var(--ink-3)"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, letterSpacing: "-0.02em", color: "var(--ink)" }}>404</div>
        <div style={{ marginTop: 8, fontFamily: "var(--f-ui)", fontSize: 14 }}>
          Trip not found.{" "}
          <Link href="/trips" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            Back to all trips
          </Link>
        </div>
      </div>
    </div>
  );
}
