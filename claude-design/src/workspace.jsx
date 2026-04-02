/* Workspace — sidebar + top bar + view switcher */

const wsStyles = {
  shell: {
    display:"grid",
    gridTemplateColumns:"248px 1fr",
    height:"100%",
    background:"var(--bg)"
  },
  side: {
    background:"var(--panel)",
    borderRight:"1px solid var(--hair)",
    display:"flex", flexDirection:"column"
  },
  sideHead: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"16px 14px 12px"
  },
  tripPicker: {
    margin:"0 10px", padding:"10px 12px",
    background:"var(--card)",
    boxShadow:"inset 0 0 0 1px var(--hair)",
    borderRadius: 10,
    display:"grid", gridTemplateColumns:"28px 1fr auto", gap: 10,
    alignItems:"center", cursor:"pointer"
  },
  nav: {
    padding:"18px 10px 10px",
    display:"flex", flexDirection:"column", gap: 1
  },
  navItem: (active) => ({
    display:"grid", gridTemplateColumns:"18px 1fr auto", gap: 10,
    alignItems:"center",
    padding:"7px 10px",
    borderRadius: 6,
    fontSize: 13,
    color: active ? "var(--ink)" : "var(--ink-2)",
    background: active ? "var(--card)" : "transparent",
    boxShadow: active ? "inset 0 0 0 1px var(--hair)" : "none",
    cursor:"pointer"
  }),
  topbar: {
    height: 56,
    padding:"0 24px",
    display:"grid",
    gridTemplateColumns:"1fr auto 1fr",
    alignItems:"center",
    borderBottom:"1px solid var(--hair)",
    background:"var(--bg)"
  },
  segmented: {
    display:"inline-flex",
    background:"var(--panel)",
    padding: 3,
    borderRadius: 8,
    boxShadow:"inset 0 0 0 1px var(--hair)"
  },
  seg: (active) => ({
    padding:"5px 12px",
    borderRadius: 6,
    fontSize: 12, fontWeight: 500,
    color: active ? "var(--ink)" : "var(--ink-3)",
    background: active ? "var(--card)" : "transparent",
    boxShadow: active ? "var(--sh-1)" : "none",
    cursor:"pointer",
    display:"inline-flex", alignItems:"center", gap: 6,
    transition: "background 160ms ease, color 160ms ease"
  }),
  main: { overflow:"hidden", display:"flex", flexDirection:"column", height:"100%" },
  content: { flex:1, overflow:"hidden", position:"relative" }
};

const Workspace = ({ onBackToDash, tweaks }) => {
  const [section, setSection] = React.useState("itinerary");
  const [view, setView] = React.useState("timeline"); // 'timeline' | 'map'
  const [activeDay, setActiveDay] = React.useState(0);
  const [days, setDays] = React.useState(DAYS);

  const totalPlaces = PLACES.length;
  const booked = days.flatMap(d => d.items).filter(i => i.booked).length;
  const totalItems = days.flatMap(d => d.items).length;

  return (
    <div style={wsStyles.shell} data-screen-label="03 Workspace">
      {/* SIDEBAR */}
      <aside style={wsStyles.side}>
        <div style={wsStyles.sideHead}>
          <div style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}
               onClick={onBackToDash}>
            <Icon name="chevronRight" size={14}
                  style={{ transform:"rotate(180deg)", color:"var(--ink-3)" }}/>
            <Brand size={13} />
          </div>
        </div>

        <div style={wsStyles.tripPicker}>
          <div style={{ width: 28, height: 28, borderRadius: 6, overflow:"hidden" }}>
            <TripCover tag={TRIP.tag} seed={4} compact />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{TRIP.title}</div>
            <div style={{ fontSize: 11, color:"var(--ink-3)" }}>
              {TRIP.start} – {TRIP.end}, {TRIP.year}
            </div>
          </div>
          <Icon name="chevronDown" size={12} style={{ color:"var(--ink-3)" }} />
        </div>

        <div style={wsStyles.nav}>
          {SIDEBAR.map(s => (
            <div key={s.id}
                 style={wsStyles.navItem(section === s.id || (s.id === "itinerary" && section === "itinerary"))}
                 onClick={() => setSection(s.id)}>
              <Icon name={s.icon} size={14} />
              <span>{s.label}</span>
              {s.id === "itinerary" && (
                <span className="mono" style={{ color:"var(--ink-4)", fontSize: 11 }}>
                  {totalItems}
                </span>
              )}
              {s.id === "places" && (
                <span className="mono" style={{ color:"var(--ink-4)", fontSize: 11 }}>
                  {totalPlaces}
                </span>
              )}
              {s.id === "bookings" && (
                <span className="mono" style={{ color:"var(--ink-4)", fontSize: 11 }}>
                  {booked}/{totalItems}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Collaborators */}
        <div style={{ marginTop:"auto", padding:"16px 14px", borderTop:"1px solid var(--hair)" }}>
          <div className="caps" style={{ marginBottom: 10 }}>With you</div>
          <div style={{ display:"flex", flexDirection:"column", gap: 6 }}>
            {TRIP.collaborators.map(c => (
              <div key={c.id} style={{
                display:"flex", alignItems:"center", gap: 10,
                padding:"4px 2px", fontSize: 13
              }}>
                <div className="avatar sm" style={{ background: c.color }}>{c.initials}</div>
                <span style={{ color:"var(--ink-2)" }}>
                  {c.name}{c.self && <span style={{ color:"var(--ink-4)" }}> (you)</span>}
                </span>
                <span style={{ marginLeft:"auto" }}>
                  <PresenceDot active={tweaks.showPresence && c.active} />
                </span>
              </div>
            ))}
          </div>
          <button className="btn ghost" style={{
            marginTop: 10, width:"100%", justifyContent:"flex-start",
            color:"var(--ink-3)"
          }}>
            <Icon name="plus" size={13} /> Invite
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={wsStyles.main}>
        {/* TOPBAR */}
        <header style={wsStyles.topbar}>
          <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap: 10 }}>
              <span className="caps">Itinerary</span>
              <span style={{ color:"var(--ink-4)" }}>/</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{days[activeDay].label}</span>
            </div>
          </div>

          {/* Segmented view toggle */}
          <div style={wsStyles.segmented}>
            <div style={wsStyles.seg(view === "timeline")}
                 onClick={() => setView("timeline")}>
              <Icon name="calendar" size={12} /> Timeline
            </div>
            <div style={wsStyles.seg(view === "map")}
                 onClick={() => setView("map")}>
              <Icon name="map" size={12} /> Map
            </div>
          </div>

          <div style={{ display:"flex", gap: 8, justifyContent:"flex-end", alignItems:"center" }}>
            {tweaks.showPresence && (
              <AvatarStack
                people={TRIP.collaborators.filter(c => c.active)}
                size="sm"
              />
            )}
            <button className="btn">
              <Icon name="share" size={13} /> Share
            </button>
            <button className="btn primary">
              <Icon name="plus" size={13} /> Add
            </button>
          </div>
        </header>

        {/* Summary ribbon */}
        <div style={{
          padding:"18px 32px 10px",
          display:"flex", alignItems:"flex-end", justifyContent:"space-between",
          borderBottom: "1px solid var(--hair)"
        }}>
          <div>
            <div className="caps">
              {TRIP.year} · Spring
            </div>
            <div style={{
              fontFamily:"var(--f-display)", fontSize: 44,
              letterSpacing:"-0.02em", lineHeight: 1, marginTop: 4
            }}>
              {TRIP.title}
              <em style={{ fontStyle:"italic", color:"var(--ink-3)", fontSize: 30, marginLeft: 12 }}>
                {TRIP.start} – {TRIP.end}
              </em>
            </div>
          </div>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(4, auto)",
            columnGap: 32, rowGap: 0,
            textAlign:"right"
          }}>
            <Stat label="Days" value="10"/>
            <Stat label="Pins" value={String(totalPlaces)}/>
            <Stat label="Booked" value={`${booked}/${totalItems}`}/>
            <Stat label="Budget" value="¥612k"/>
          </div>
        </div>

        <div style={wsStyles.content}>
          {/* Crossfade views */}
          <div style={{
            position:"absolute", inset:0,
            opacity: view === "timeline" ? 1 : 0,
            pointerEvents: view === "timeline" ? "auto" : "none",
            transition:"opacity 220ms ease"
          }}>
            <Itinerary
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              days={days}
              setDays={setDays}
              showPresence={tweaks.showPresence}
              collaborators={TRIP.collaborators}
            />
          </div>
          <div style={{
            position:"absolute", inset:0,
            opacity: view === "map" ? 1 : 0,
            pointerEvents: view === "map" ? "auto" : "none",
            transition:"opacity 220ms ease"
          }}>
            <MapView
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              days={days}
              style={tweaks.mapStyle}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <div className="caps" style={{ fontSize: 10 }}>{label}</div>
    <div style={{
      fontFamily:"var(--f-mono)", fontSize: 18,
      color:"var(--ink)", marginTop: 2,
      letterSpacing:"-0.01em"
    }}>{value}</div>
  </div>
);

window.Workspace = Workspace;
