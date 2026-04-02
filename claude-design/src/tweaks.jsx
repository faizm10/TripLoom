/* Tweaks — floating panel toggled by the host toolbar */

const tweakStyles = {
  panel: {
    position:"fixed", right: 20, bottom: 20, zIndex: 50,
    width: 300,
    background:"var(--card)",
    borderRadius: 14,
    boxShadow:"var(--sh-3)",
    padding: 16,
    fontSize: 13
  },
  head: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    marginBottom: 12
  },
  row: {
    display:"grid", gridTemplateColumns:"1fr auto", gap: 10,
    alignItems:"center",
    padding:"8px 0",
    borderTop:"1px solid var(--hair)"
  },
  swatches: { display:"inline-flex", gap: 6 },
  swatch: (on) => ({
    width: 18, height: 18, borderRadius: 4,
    cursor:"pointer",
    boxShadow: on ? "0 0 0 2px var(--bg), 0 0 0 3px var(--ink)" : "inset 0 0 0 1px var(--hair-2)"
  }),
  pill: (on) => ({
    padding:"4px 10px", borderRadius: 999, fontSize: 12,
    background: on ? "var(--ink)" : "var(--card)",
    color: on ? "var(--bg)" : "var(--ink-2)",
    boxShadow: on ? "none" : "inset 0 0 0 1px var(--hair)",
    cursor:"pointer"
  })
};

const ACCENTS = {
  indigo: "oklch(55% 0.12 275)",
  clay:   "oklch(55% 0.12 40)",
  sage:   "oklch(55% 0.10 150)",
  ink:    "oklch(25% 0.02 270)"
};

const Tweaks = ({ open, tweaks, setTweaks, onClose }) => {
  if (!open) return null;

  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENTS[tweaks.accent]);
  }, [tweaks.accent]);

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    try {
      window.parent.postMessage({ type:"__edit_mode_set_keys", edits: patch }, "*");
    } catch (e) {}
  };

  return (
    <div style={tweakStyles.panel} className="rise">
      <div style={tweakStyles.head}>
        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
          <Icon name="sparkle" size={14} style={{ color:"var(--accent)" }} />
          <span style={{ fontWeight: 500 }}>Tweaks</span>
        </div>
        <button className="btn ghost" style={{ width: 24, height: 24, padding: 0 }} onClick={onClose}>
          <Icon name="close" size={13} />
        </button>
      </div>

      <div style={tweakStyles.row}>
        <div>
          <div>Accent</div>
          <div style={{ color:"var(--ink-4)", fontSize: 11 }}>Used for today markers, pins, selection</div>
        </div>
        <div style={tweakStyles.swatches}>
          {Object.entries(ACCENTS).map(([k, v]) => (
            <div key={k}
                 style={{
                   ...tweakStyles.swatch(tweaks.accent === k),
                   background: v
                 }}
                 onClick={() => update({ accent: k })}/>
          ))}
        </div>
      </div>

      <div style={tweakStyles.row}>
        <div>
          <div>Density</div>
          <div style={{ color:"var(--ink-4)", fontSize: 11 }}>Spacing in the timeline</div>
        </div>
        <div style={{ display:"flex", gap: 4 }}>
          {["cozy","compact"].map(d => (
            <div key={d} style={tweakStyles.pill(tweaks.density === d)}
                 onClick={() => update({ density: d })}>{d}</div>
          ))}
        </div>
      </div>

      <div style={tweakStyles.row}>
        <div>
          <div>Map style</div>
          <div style={{ color:"var(--ink-4)", fontSize: 11 }}>Background of the map canvas</div>
        </div>
        <div style={{ display:"flex", gap: 4 }}>
          {["paper","dots"].map(d => (
            <div key={d} style={tweakStyles.pill(tweaks.mapStyle === d)}
                 onClick={() => update({ mapStyle: d })}>{d}</div>
          ))}
        </div>
      </div>

      <div style={tweakStyles.row}>
        <div>
          <div>Ambient presence</div>
          <div style={{ color:"var(--ink-4)", fontSize: 11 }}>Show avatars + active dots</div>
        </div>
        <div>
          <div style={tweakStyles.pill(tweaks.showPresence)}
               onClick={() => update({ showPresence: !tweaks.showPresence })}>
            {tweaks.showPresence ? "on" : "off"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, color:"var(--ink-4)", fontSize: 11, lineHeight: 1.5 }}>
        Changes save to this prototype. Density affects only the itinerary stream.
      </div>
    </div>
  );
};

window.Tweaks = Tweaks;
