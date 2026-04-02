/* Landing — calm, editorial, one clear value prop + one CTA */

const landingStyles = {
  page: {
    position: "absolute", inset: 0, overflow: "auto",
    background: "var(--bg)"
  },
  nav: {
    position: "sticky", top: 0, zIndex: 4,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 48px",
    backdropFilter: "saturate(1.1) blur(10px)",
    background: "rgba(250,250,247,0.7)",
    borderBottom: "1px solid transparent"
  },
  navLinks: { display: "flex", gap: 28, color: "var(--ink-2)", fontSize: 13 },
  hero: {
    padding: "96px 48px 64px", maxWidth: 1280, margin: "0 auto",
    position: "relative"
  },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "4px 10px 4px 6px",
    borderRadius: 999,
    background: "var(--card)",
    boxShadow: "inset 0 0 0 1px var(--hair)",
    fontSize: 12, color: "var(--ink-2)",
    marginBottom: 28
  },
  headline: {
    fontFamily: "var(--f-display)",
    fontSize: 104, lineHeight: 0.98,
    letterSpacing: "-0.025em",
    color: "var(--ink)",
    margin: 0,
    maxWidth: 980
  },
  sub: {
    marginTop: 28, maxWidth: 560,
    fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)"
  },
  ctaRow: { display:"flex", gap: 12, marginTop: 36, alignItems:"center" },
  proof: {
    marginTop: 72,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 32,
    paddingTop: 32,
    borderTop: "1px solid var(--hair)"
  },
  proofItem: { color: "var(--ink-2)", fontSize: 13 },
  proofNum: {
    fontFamily: "var(--f-display)",
    fontSize: 36, letterSpacing: "-0.02em", color: "var(--ink)",
    lineHeight: 1, marginBottom: 6
  },
  canvasSection: {
    padding: "48px 48px 96px",
    maxWidth: 1280, margin: "0 auto"
  },
  canvasLabel: {
    display:"flex", justifyContent:"space-between",
    marginBottom: 14, color:"var(--ink-3)", fontSize: 12,
    fontFamily:"var(--f-mono)", letterSpacing:"0.04em", textTransform:"uppercase"
  },
  deviceFrame: {
    position:"relative",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "var(--sh-3)",
    background: "var(--bg)",
    height: 560
  },
  valueGrid: {
    padding: "96px 48px",
    maxWidth: 1280, margin: "0 auto",
    display:"grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1,
    background:"var(--hair)",
    border:"1px solid var(--hair)",
    borderRadius: 16,
    overflow:"hidden"
  },
  valueCell: {
    background: "var(--bg)",
    padding: "40px 36px 44px",
    minHeight: 260
  },
  valueTitle: {
    fontFamily:"var(--f-display)", fontSize: 30,
    letterSpacing:"-0.01em", lineHeight: 1.05,
    margin: "20px 0 10px"
  },
  valueBody: { color:"var(--ink-2)", fontSize: 14, lineHeight: 1.55, maxWidth: 320 },
  pillars: {
    padding: "96px 48px",
    maxWidth: 1080, margin: "0 auto",
    display: "grid", gridTemplateColumns: "220px 1fr", columnGap: 48, rowGap: 56
  },
  pillarK: {
    fontFamily:"var(--f-mono)", fontSize: 12,
    letterSpacing:"0.06em", textTransform:"uppercase",
    color: "var(--ink-3)", paddingTop: 4
  },
  pillarV: { fontFamily:"var(--f-display)", fontSize: 34, letterSpacing:"-0.01em", lineHeight: 1.1 },
  foot: {
    padding: "64px 48px 48px", maxWidth: 1280, margin: "0 auto",
    borderTop: "1px solid var(--hair)",
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    color: "var(--ink-3)", fontSize: 12
  }
};

const Landing = ({ onEnter }) => {
  return (
    <div style={landingStyles.page} data-screen-label="01 Landing">
      {/* NAV */}
      <nav style={landingStyles.nav}>
        <Brand />
        <div style={landingStyles.navLinks}>
          <a>Product</a><a>Templates</a><a>Pricing</a><a>Changelog</a>
        </div>
        <div style={{ display:"flex", gap: 10 }}>
          <button className="btn ghost">Sign in</button>
          <button className="btn primary" onClick={onEnter}>Start planning</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={landingStyles.hero}>
        <div className="dotfield" style={{
          position:"absolute", inset:0, opacity:.35, pointerEvents:"none",
          maskImage:"radial-gradient(ellipse at 60% 30%, black 30%, transparent 75%)",
          WebkitMaskImage:"radial-gradient(ellipse at 60% 30%, black 30%, transparent 75%)"
        }} />
        <div style={{ position:"relative" }}>
          <div style={landingStyles.badge}>
            <span className="avatar sm" style={{ background:"var(--tag-c)" }}>✦</span>
            Now in open beta <span className="mono" style={{ color:"var(--ink-3)" }}>·  v0.9</span>
          </div>

          <h1 style={landingStyles.headline}>
            Plan the trip,{" "}
            <em style={{ fontStyle:"italic", color:"var(--accent-ink)" }}>not the tabs.</em>
          </h1>

          <p style={landingStyles.sub}>
            TripLoom is a single, structured workspace for every part of a trip — the
            timeline, the bookings, the places, and the people you're going with.
            No more pasting between Docs, Maps, and Notes.
          </p>

          <div style={landingStyles.ctaRow}>
            <button className="btn primary lg" onClick={onEnter}>
              Open the demo trip
              <Icon name="arrowRight" size={14} />
            </button>
            <button className="btn ghost lg">
              Watch 90-second tour
            </button>
            <div style={{ marginLeft: 12, color:"var(--ink-3)", fontSize: 13 }}>
              Free for up to 3 trips · no card
            </div>
          </div>

          <div style={landingStyles.proof}>
            <div style={landingStyles.proofItem}>
              <div style={landingStyles.proofNum}>one</div>
              place for the itinerary, the bookings, and the map.
              Progressive disclosure; never a dashboard of widgets.
            </div>
            <div style={landingStyles.proofItem}>
              <div style={landingStyles.proofNum}>live</div>
              multi-user editing with ambient presence — see where everyone's
              looking without chat noise.
            </div>
            <div style={landingStyles.proofItem}>
              <div style={landingStyles.proofNum}>calm</div>
              designed to feel like a notebook that happens to sync, not
              another app fighting for your attention.
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW STRIP */}
      <section style={landingStyles.canvasSection}>
        <div style={landingStyles.canvasLabel}>
          <span>Preview — Tokyo, Apr 14 → 23</span>
          <span>Shift + tap to enter the prototype</span>
        </div>
        <div style={landingStyles.deviceFrame} onClick={onEnter}>
          <LandingPreview />
        </div>
      </section>

      {/* VALUE GRID */}
      <section style={landingStyles.valueGrid}>
        <div style={landingStyles.valueCell}>
          <Icon name="calendar" size={22} style={{ color:"var(--ink-3)" }} />
          <div style={landingStyles.valueTitle}>The itinerary is the page.</div>
          <p style={landingStyles.valueBody}>
            Drag activities between days. Everything you add anywhere
            — a booking, a pin, a note — threads back into the timeline.
          </p>
        </div>
        <div style={landingStyles.valueCell}>
          <Icon name="pin" size={22} style={{ color:"var(--ink-3)" }} />
          <div style={landingStyles.valueTitle}>Places live on the map.</div>
          <p style={landingStyles.valueBody}>
            Every saved spot is tied to the day it belongs to. Toggle the
            map view to see Tuesday as a walk, not a list.
          </p>
        </div>
        <div style={landingStyles.valueCell}>
          <Icon name="share" size={22} style={{ color:"var(--ink-3)" }} />
          <div style={landingStyles.valueTitle}>Plan together, quietly.</div>
          <p style={landingStyles.valueBody}>
            Ambient presence shows who's viewing what. No cursor storms,
            no notification pile. Just the same page — actually.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section style={landingStyles.pillars}>
        <div style={landingStyles.pillarK}>Principle 01</div>
        <div style={landingStyles.pillarV}>
          One screen per decision. Never ten widgets asking you
          which one matters right now.
        </div>

        <div style={landingStyles.pillarK}>Principle 02</div>
        <div style={landingStyles.pillarV}>
          Every object — a day, a flight, a dinner — is the same shape,
          so you can move it, link it, and share it.
        </div>

        <div style={landingStyles.pillarK}>Principle 03</div>
        <div style={landingStyles.pillarV}>
          The UI shouldn't yell. A trip is supposed to be the fun part;
          the tool should stay out of the way.
        </div>
      </section>

      {/* FOOT */}
      <footer style={landingStyles.foot}>
        <Brand size={14} />
        <div style={{ display:"flex", gap:32 }}>
          <span>© 2026 TripLoom Labs</span>
          <span>Docs</span>
          <span>Status</span>
          <span>Privacy</span>
        </div>
      </footer>
    </div>
  );
};

/* Stylized screenshot-ish preview — reuses the design vocabulary */
const LandingPreview = () => (
  <div style={{
    display:"grid", gridTemplateColumns:"220px 1fr 320px",
    height:"100%", background: "var(--bg)"
  }}>
    {/* mini sidebar */}
    <div style={{
      background:"var(--panel)", borderRight:"1px solid var(--hair)",
      padding: 18, display:"flex", flexDirection:"column", gap: 14
    }}>
      <Brand size={14} />
      <div style={{ height: 1, background:"var(--hair)", margin:"6px 0" }} />
      <div className="caps" style={{ fontSize: 10 }}>Trips</div>
      {["Tokyo","Lisbon + Sintra","Patagonia loop"].map((n,i) => (
        <div key={n} style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"6px 8px", borderRadius: 6,
          background: i === 0 ? "var(--card)" : "transparent",
          boxShadow: i === 0 ? "inset 0 0 0 1px var(--hair)" : "none",
          fontSize: 13, color: i === 0 ? "var(--ink)" : "var(--ink-2)"
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 4,
            background: `var(--tag-${["c","a","b"][i]})`
          }} />
          {n}
        </div>
      ))}
    </div>
    {/* timeline preview */}
    <div style={{ padding: "20px 28px", overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <div>
          <div className="caps">10 days · 4 people</div>
          <div className="serif" style={{ fontSize: 34, letterSpacing:"-0.01em" }}>Tokyo</div>
        </div>
        <AvatarStack people={TRIP.collaborators} size="sm" />
      </div>
      <div style={{ display:"flex", gap: 8, marginBottom: 12 }}>
        {DAYS.slice(0,6).map((d,i) => (
          <div key={i} style={{
            flex: 1, padding: "8px 10px", borderRadius: 6,
            background: i === 1 ? "var(--ink)" : "var(--card)",
            color: i === 1 ? "var(--bg)" : "var(--ink-2)",
            boxShadow: "inset 0 0 0 1px var(--hair)",
            fontSize: 11, fontFamily: "var(--f-mono)"
          }}>
            <div>{d.short}</div>
            <div style={{ opacity: .6, fontSize: 10, marginTop: 2 }}>{d.label.split(" · ")[0].slice(0, 10)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
        {DAYS[1].items.map((it, i) => (
          <div key={it.id} style={{
            display:"grid", gridTemplateColumns:"52px 18px 1fr auto",
            gap: 10, alignItems:"center",
            padding: "10px 12px",
            background:"var(--card)", borderRadius: 8,
            boxShadow:"inset 0 0 0 1px var(--hair)"
          }}>
            <span className="mono" style={{ fontSize: 11, color:"var(--ink-3)" }}>{it.t}</span>
            <Icon name={KIND_ICON[it.kind]} size={14} style={{ color:"var(--ink-3)" }} />
            <div style={{ fontSize: 13 }}>{it.title}</div>
            <span className="chip">{it.place}</span>
          </div>
        ))}
      </div>
    </div>
    {/* mini map */}
    <div style={{
      background:"var(--panel)", borderLeft:"1px solid var(--hair)",
      padding: 18
    }}>
      <div className="caps" style={{ fontSize: 10, marginBottom: 8 }}>Day 2</div>
      <div style={{
        aspectRatio:"1/1",
        borderRadius: 10,
        background:"var(--bg)",
        boxShadow:"inset 0 0 0 1px var(--hair)",
        position:"relative", overflow:"hidden"
      }}>
        <MiniMap />
      </div>
      <div style={{ marginTop: 14, display:"flex", flexDirection:"column", gap: 6 }}>
        {PLACES.filter(p => p.day === 2).map(p => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap: 8, fontSize: 12, color:"var(--ink-2)" }}>
            <Icon name="pin" size={12} style={{ color:"var(--accent)" }} />
            {p.name}
            <span style={{ color:"var(--ink-4)", marginLeft:"auto" }}>{p.neighborhood}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MiniMap = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <pattern id="grd" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--hair)" strokeWidth="0.3"/>
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#grd)" />
    <path d="M10 70 Q 40 60 60 70 T 95 65" stroke="var(--hair-2)" strokeWidth="0.6" fill="none"/>
    <path d="M20 10 Q 40 30 30 60 T 40 95" stroke="var(--hair-2)" strokeWidth="0.6" fill="none"/>
    {PLACES.filter(p => p.day === 2).map((p, i) => (
      <g key={p.id}>
        <circle cx={p.x} cy={p.y} r="1.8" fill="var(--accent)" />
        <circle cx={p.x} cy={p.y} r="4" fill="var(--accent)" opacity=".18" />
      </g>
    ))}
    {(() => {
      const pts = PLACES.filter(p => p.day === 2);
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
      return <path d={d} stroke="var(--accent)" strokeWidth=".8" fill="none" strokeDasharray="1 1.5" />;
    })()}
  </svg>
);

window.Landing = Landing;
