"use client";
import React from "react";
import { Icon } from "./Icon";
import type { Tweaks as TweaksT } from "@/lib/data";

const ACCENTS: Record<string, string> = {
  indigo: "oklch(55% 0.12 275)",
  clay: "oklch(55% 0.12 40)",
  sage: "oklch(55% 0.10 150)",
  ink: "oklch(25% 0.02 270)"
};

const s: Record<string, React.CSSProperties> = {
  panel: { position: "fixed", right: 20, bottom: 20, zIndex: 50, width: 300, background: "var(--card)", borderRadius: 14, boxShadow: "var(--sh-3)", padding: 16, fontSize: 13 },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--hair)" }
};
const swatch = (on: boolean, bg: string): React.CSSProperties => ({
  width: 18, height: 18, borderRadius: 4, cursor: "pointer", background: bg,
  boxShadow: on ? "0 0 0 2px var(--bg), 0 0 0 3px var(--ink)" : "inset 0 0 0 1px var(--hair-2)"
});
const pill = (on: boolean): React.CSSProperties => ({
  padding: "4px 10px", borderRadius: 999, fontSize: 12,
  background: on ? "var(--ink)" : "var(--card)",
  color: on ? "var(--bg)" : "var(--ink-2)",
  boxShadow: on ? "none" : "inset 0 0 0 1px var(--hair)",
  cursor: "pointer"
});

export const Tweaks: React.FC<{
  open: boolean; tweaks: TweaksT;
  setTweaks: React.Dispatch<React.SetStateAction<TweaksT>>;
  onClose: () => void;
}> = ({ open, tweaks, setTweaks, onClose }) => {
  if (!open) return null;
  const update = (patch: Partial<TweaksT>) => setTweaks(prev => ({ ...prev, ...patch }));
  return (
    <div style={s.panel} className="rise">
      <div style={s.head}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 500 }}>Tweaks</span>
        </div>
        <button className="btn ghost" style={{ width: 24, height: 24, padding: 0 }} onClick={onClose}>
          <Icon name="close" size={13} />
        </button>
      </div>

      <div style={s.row}>
        <div>
          <div>Accent</div>
          <div style={{ color: "var(--ink-4)", fontSize: 11 }}>Used for today markers, pins, selection</div>
        </div>
        <div style={{ display: "inline-flex", gap: 6 }}>
          {Object.entries(ACCENTS).map(([k, v]) => (
            <div key={k} style={swatch(tweaks.accent === k, v)}
                 onClick={() => update({ accent: k as TweaksT["accent"] })} />
          ))}
        </div>
      </div>

      <div style={s.row}>
        <div><div>Density</div><div style={{ color: "var(--ink-4)", fontSize: 11 }}>Spacing in the timeline</div></div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["cozy", "compact"] as const).map(dd => (
            <div key={dd} style={pill(tweaks.density === dd)} onClick={() => update({ density: dd })}>{dd}</div>
          ))}
        </div>
      </div>

      <div style={s.row}>
        <div><div>Map style</div><div style={{ color: "var(--ink-4)", fontSize: 11 }}>Background of the map canvas</div></div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["paper", "dots"] as const).map(dd => (
            <div key={dd} style={pill(tweaks.mapStyle === dd)} onClick={() => update({ mapStyle: dd })}>{dd}</div>
          ))}
        </div>
      </div>

      <div style={s.row}>
        <div><div>Ambient presence</div><div style={{ color: "var(--ink-4)", fontSize: 11 }}>Show avatars + active dots</div></div>
        <div>
          <div style={pill(tweaks.showPresence)} onClick={() => update({ showPresence: !tweaks.showPresence })}>
            {tweaks.showPresence ? "on" : "off"}
          </div>
        </div>
      </div>
    </div>
  );
};
