"use client";
import React from "react";
import { Icon } from "./Icon";
import { PLACES, type Day } from "@/lib/data";

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "grid", gridTemplateColumns: "300px 1fr", height: "100%", overflow: "hidden" },
  side: { borderRight: "1px solid var(--hair)", overflow: "auto", padding: "22px 18px" },
  mapCanvas: { position: "relative", overflow: "hidden", background: "var(--panel)" }
};

const pill = (active: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999,
  background: active ? "var(--ink)" : "var(--card)",
  color: active ? "var(--bg)" : "var(--ink-2)",
  boxShadow: active ? "none" : "inset 0 0 0 1px var(--hair)",
  fontSize: 12, cursor: "pointer", whiteSpace: "nowrap"
});

const placeRow = (active: boolean): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: "22px 1fr auto", alignItems: "center", gap: 10,
  padding: "10px 10px", borderRadius: 8,
  background: active ? "var(--panel)" : "transparent", cursor: "pointer"
});

const PinMark: React.FC<{ day: number; small?: boolean }> = ({ day, small }) => {
  const size = small ? 22 : 28;
  return (
    <div style={{
      width: size, height: size, flex: "none",
      background: "var(--accent)", color: "#fff", borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: small ? 10 : 12, fontWeight: 600,
      boxShadow: "0 1px 2px rgba(22,24,28,.15), 0 0 0 2px #fff"
    }}>{day}</div>
  );
};

const PaperMap: React.FC<{ places: typeof PLACES; activeDay: number | null; hoverPlace: string | null; style: string }> = ({ places, activeDay, hoverPlace, style }) => {
  const byDay: Record<number, typeof PLACES> = {};
  PLACES.forEach(p => { (byDay[p.day] ||= []).push(p); });
  const bg = style === "dots"
    ? <rect width="100" height="100" fill="url(#dots)" />
    : <rect width="100" height="100" fill="var(--bg)" />;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <pattern id="dots" width="2" height="2" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.2" fill="var(--hair-2)" />
        </pattern>
        <pattern id="tokyo-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0 L0 0 0 6" fill="none" stroke="var(--hair)" strokeWidth="0.12" />
        </pattern>
      </defs>
      {bg}
      <rect width="100" height="100" fill="url(#tokyo-grid)" />
      <path d="M 72 100 L 100 100 L 100 58 Q 92 62 85 70 Q 78 82 72 100 Z" fill="var(--panel)" />
      <path d="M 50 0 Q 55 20 62 40 T 75 80 Q 78 90 75 100" stroke="var(--hair-2)" strokeWidth="0.4" fill="none" />
      <path d="M 82 0 Q 80 20 78 40 T 85 78" stroke="var(--hair-2)" strokeWidth="0.3" fill="none" />
      <ellipse cx="44" cy="48" rx="18" ry="16" stroke="var(--hair-2)" strokeWidth="0.35" fill="none" strokeDasharray="0.6 0.5" />
      {[
        { x: 26, y: 40, n: "Shinjuku" }, { x: 32, y: 56, n: "Shibuya" },
        { x: 66, y: 26, n: "Asakusa" }, { x: 55, y: 50, n: "Ginza" },
        { x: 70, y: 62, n: "Toyosu" }, { x: 58, y: 40, n: "Akihabara" },
        { x: 34, y: 66, n: "Naka-meguro" }
      ].map(l => (
        <text key={l.n} x={l.x} y={l.y} fontSize="1.2" fontFamily="var(--f-mono)" fill="var(--ink-4)"
              style={{ letterSpacing: "0.05em", textTransform: "uppercase" }} textAnchor="middle">
          {l.n}
        </text>
      ))}
      {Object.entries(byDay).map(([day, pts]) => {
        if (pts.length < 2) return null;
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
        const visible = activeDay == null || Number(day) === activeDay;
        return (
          <path key={day} d={d} stroke={visible ? "var(--accent)" : "var(--hair-2)"}
                strokeWidth={visible ? 0.45 : 0.3} fill="none" strokeDasharray="0.7 0.9"
                strokeLinecap="round" opacity={visible ? 0.7 : 0.25} />
        );
      })}
      {places.map(p => {
        const hov = hoverPlace === p.id;
        return (
          <g key={p.id}>
            {hov && <circle cx={p.x} cy={p.y} r="2.4" fill="var(--accent)" opacity="0.2" />}
            <circle cx={p.x} cy={p.y} r={hov ? 1.4 : 1.05} fill="var(--accent)" stroke="#fff" strokeWidth="0.35" />
            <text x={p.x + 2} y={p.y + 0.5} fontSize="1.2" fontFamily="var(--f-mono)" fill="var(--ink-2)">{p.name}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const MapView: React.FC<{
  activeDay: number; setActiveDay: (n: number) => void;
  days: Day[]; style?: string;
}> = ({ activeDay, setActiveDay, days, style = "paper" }) => {
  const [filter, setFilter] = React.useState<"all" | number>("all");
  const [hoverPlace, setHoverPlace] = React.useState<string | null>(null);
  const visible = filter === "all" ? PLACES : PLACES.filter(p => p.day === (filter as number) + 1);

  return (
    <div style={s.wrap}>
      <aside style={s.side}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="caps">Places</div>
          <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>{PLACES.length} pins</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={pill(filter === "all")} onClick={() => setFilter("all")}>All days</div>
          {days.map((_, i) => (
            <div key={i} style={pill(filter === i)} onClick={() => { setFilter(i); setActiveDay(i); }}>D{i + 1}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map(p => (
            <div key={p.id} style={placeRow(hoverPlace === p.id)}
              onMouseEnter={() => setHoverPlace(p.id)} onMouseLeave={() => setHoverPlace(null)}>
              <PinMark day={p.day} small />
              <div>
                <div style={{ fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.neighborhood} · {p.kind}</div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>D{p.day}</span>
            </div>
          ))}
        </div>
      </aside>

      <div style={s.mapCanvas}>
        <PaperMap places={visible} activeDay={filter === "all" ? null : (filter as number) + 1} hoverPlace={hoverPlace} style={style} />
        <div style={{ position: "absolute", top: 20, left: 20, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)", boxShadow: "var(--sh-1)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Tokyo · {filter === "all" ? "all days" : days[filter as number].label}
        </div>
        <div style={{ position: "absolute", bottom: 20, left: 20, fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--ink-3)" }}>
          35.6762° N · 139.6503° E
        </div>
      </div>
    </div>
  );
};
