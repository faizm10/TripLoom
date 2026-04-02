/* App — ties the three screens together, exposes Tweaks */

const App = () => {
  const [screen, setScreen] = React.useState(() => {
    try { return localStorage.getItem("tl_screen") || "landing"; } catch (e) { return "landing"; }
  });
  const [tweaks, setTweaks] = React.useState(() => window.__TRIPLOOM_TWEAKS || {});
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => {
    try { localStorage.setItem("tl_screen", screen); } catch (e) {}
  }, [screen]);

  // Host integration for tweaks toolbar toggle
  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === "__activate_edit_mode") setTweaksOpen(true);
      if (t === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({ type:"__edit_mode_available" }, "*"); } catch (e) {}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Initial accent apply
  React.useEffect(() => {
    const accents = {
      indigo: "oklch(55% 0.12 275)",
      clay:   "oklch(55% 0.12 40)",
      sage:   "oklch(55% 0.10 150)",
      ink:    "oklch(25% 0.02 270)"
    };
    document.documentElement.style.setProperty("--accent", accents[tweaks.accent] || accents.indigo);
  }, []);

  // Cozy/compact density hook — applies a CSS var to itinerary spacing
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--item-pad", tweaks.density === "compact" ? "8px" : "12px"
    );
  }, [tweaks.density]);

  const goDash = () => setScreen("dashboard");
  const goTrip = () => setScreen("workspace");
  const goLanding = () => setScreen("landing");

  return (
    <div className="app">
      <div className={`screen ${screen === "landing" ? "active" : ""}`}>
        <Landing onEnter={goDash} />
      </div>
      <div className={`screen ${screen === "dashboard" ? "active" : ""}`}>
        <Dashboard onOpenTrip={goTrip} />
      </div>
      <div className={`screen ${screen === "workspace" ? "active" : ""}`}>
        <Workspace onBackToDash={goDash} tweaks={tweaks} />
      </div>

      {/* Demo nav strip — subtle, bottom-left */}
      <NavStrip screen={screen} setScreen={setScreen} />

      <Tweaks
        open={tweaksOpen}
        tweaks={tweaks}
        setTweaks={setTweaks}
        onClose={() => {
          setTweaksOpen(false);
          try { window.parent.postMessage({ type:"__deactivate_edit_mode" }, "*"); } catch (e) {}
        }}
      />
    </div>
  );
};

const NavStrip = ({ screen, setScreen }) => {
  const screens = [
    { id: "landing",   label: "Landing" },
    { id: "dashboard", label: "Dashboard" },
    { id: "workspace", label: "Workspace" }
  ];
  return (
    <div style={{
      position:"fixed", bottom: 16, left: 16, zIndex: 40,
      display:"inline-flex",
      padding: 4,
      background:"rgba(255,255,255,0.9)",
      backdropFilter:"blur(10px)",
      borderRadius: 10,
      boxShadow:"var(--sh-2)"
    }}>
      {screens.map(s => (
        <button key={s.id}
          onClick={() => setScreen(s.id)}
          style={{
            padding:"6px 12px",
            borderRadius: 6,
            fontSize: 12, fontWeight: 500,
            background: screen === s.id ? "var(--ink)" : "transparent",
            color: screen === s.id ? "var(--bg)" : "var(--ink-2)"
          }}
        >{s.label}</button>
      ))}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
