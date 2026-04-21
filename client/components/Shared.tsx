"use client";
import React from "react";

export const LoomMark: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block" }}>
    <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--ink)" />
    <g stroke="#FAFAF7" strokeWidth="1.6" strokeLinecap="round">
      <path d="M7 11 H25" />
      <path d="M7 16 H25" />
      <path d="M7 21 H25" />
    </g>
    <g stroke="#FAFAF7" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
      <path d="M12 7 V25" />
      <path d="M20 7 V25" />
    </g>
  </svg>
);

export const Brand: React.FC<{ size?: number; withName?: boolean }> = ({ size = 18, withName = true }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
    <LoomMark size={size} />
    {withName && (
      <span style={{ fontFamily: "var(--f-display)", fontSize: size + 6, letterSpacing: "-0.01em", lineHeight: 1 }}>TripLoom</span>
    )}
  </div>
);

type Person = { id: string | number; name?: string; initials: string; color: string };

export const AvatarStack: React.FC<{ people: Person[]; size?: "sm" | "lg" | ""; max?: number }> = ({ people, size = "sm", max = 4 }) => {
  const list = people.slice(0, max);
  const extra = people.length - list.length;
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      {list.map((p, i) => (
        <div key={p.id} className={`avatar ${size}`}
             style={{ background: p.color, marginLeft: i === 0 ? 0 : -6, zIndex: 10 - i }}
             title={p.name}>{p.initials}</div>
      ))}
      {extra > 0 && (
        <div className={`avatar ${size}`} style={{ background: "var(--panel)", color: "var(--ink-3)", marginLeft: -6 }}>+{extra}</div>
      )}
    </div>
  );
};

export const PresenceDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span style={{
    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
    background: active ? "#4CAF7A" : "var(--ink-4)",
    boxShadow: active ? "0 0 0 2px rgba(76,175,122,.18)" : "none"
  }} />
);

export const TripCover: React.FC<{ tag?: string; seed?: number; label?: string; compact?: boolean }> = ({ tag = "tag-c", seed = 1, label, compact }) => {
  const shapes = Array.from({ length: 5 }, (_, i) => {
    const s = (seed * 97 + i * 53) % 100;
    return { cx: 10 + ((s * 7) % 80), cy: 20 + ((s * 11) % 60), r: 14 + ((s * 3) % 22) };
  });
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: `var(--${tag})`, overflow: "hidden", borderRadius: compact ? 8 : 12 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
           style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: .55 }}>
        {shapes.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={i % 2 ? "rgba(22,24,28,.06)" : "rgba(255,255,255,.6)"} />
        ))}
        <line x1="0" y1="78" x2="100" y2="62" stroke="rgba(22,24,28,.1)" strokeWidth=".4" />
        <line x1="0" y1="68" x2="100" y2="74" stroke="rgba(22,24,28,.08)" strokeWidth=".4" />
      </svg>
      {label && (
        <div style={{
          position: "absolute", left: compact ? 10 : 14, bottom: compact ? 8 : 12,
          fontFamily: "var(--f-display)", fontSize: compact ? 14 : 22,
          color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1
        }}>{label}</div>
      )}
    </div>
  );
};
