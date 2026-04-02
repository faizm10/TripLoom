/* Itinerary — timeline with drag-and-drop across days */

const itinStyles = {
  wrap: {
    display:"grid",
    gridTemplateColumns:"260px 1fr",
    height:"100%",
    overflow:"hidden"
  },
  daysRail: {
    borderRight:"1px solid var(--hair)",
    background:"var(--bg)",
    overflow:"auto",
    padding:"22px 14px"
  },
  dayTile: (active, drop) => ({
    display:"grid",
    gridTemplateColumns:"auto 1fr auto",
    alignItems:"center", gap:10,
    padding:"10px 12px",
    borderRadius: 8,
    background: active ? "var(--ink)" : drop ? "var(--accent-soft)" : "transparent",
    color: active ? "var(--bg)" : "var(--ink-2)",
    boxShadow: active ? "none" : drop ? "inset 0 0 0 1px var(--accent)" : "inset 0 0 0 1px transparent",
    cursor:"pointer",
    transition:"background 160ms ease, color 160ms ease, box-shadow 160ms ease",
    marginBottom: 2
  }),
  dayNum: (active) => ({
    fontFamily:"var(--f-display)", fontSize: 20, lineHeight: 1,
    color: active ? "var(--bg)" : "var(--ink)",
    letterSpacing:"-0.01em"
  }),
  dayLabel: (active) => ({
    fontSize: 12, color: active ? "rgba(255,255,255,.7)" : "var(--ink-3)"
  }),

  stream: { overflow:"auto", padding:"28px 40px 80px" },

  dayHeader: {
    display:"flex", alignItems:"baseline", justifyContent:"space-between",
    padding: "28px 0 16px",
    borderBottom: "1px solid var(--hair)",
    marginBottom: 10
  },
  dayTitle: {
    fontFamily:"var(--f-display)", fontSize: 34,
    letterSpacing:"-0.01em"
  },
  daySub: { color:"var(--ink-3)", fontSize: 13, marginTop: 2 },

  item: (dragging) => ({
    display:"grid",
    gridTemplateColumns:"18px 60px 22px 1fr auto",
    alignItems:"flex-start",
    gap: 14,
    padding: "12px 10px 12px 4px",
    borderRadius: 8,
    marginBottom: 2,
    background: dragging ? "var(--card)" : "transparent",
    boxShadow: dragging ? "var(--sh-2)" : "none",
    cursor: "grab",
    transition: "background 120ms ease",
    opacity: dragging ? .96 : 1
  }),

  itemHover: {
    background: "var(--panel)"
  },

  time: {
    fontFamily:"var(--f-mono)", fontSize: 12,
    color:"var(--ink-3)", paddingTop: 2, letterSpacing:"0.02em"
  },
  kindDot: {
    width: 22, height: 22, borderRadius: 6,
    background:"var(--card)",
    boxShadow:"inset 0 0 0 1px var(--hair)",
    display:"flex", alignItems:"center", justifyContent:"center",
    color:"var(--ink-2)", marginTop: 1
  },
  title: { fontSize: 14, color:"var(--ink)", letterSpacing:"-0.005em" },
  sub: { fontSize: 13, color:"var(--ink-3)", marginTop: 3, maxWidth: 540 },
  meta: { display:"flex", alignItems:"center", gap: 8, marginTop: 8, flexWrap:"wrap" },

  addSlot: {
    display:"flex", alignItems:"center", gap: 8,
    padding:"10px 10px 10px 96px",
    color:"var(--ink-4)", fontSize: 13,
    borderRadius: 6, cursor:"pointer",
    border:"1px dashed transparent"
  }
};

const Itinerary = ({ activeDay, setActiveDay, days, setDays, showPresence, collaborators }) => {
  const [dragging, setDragging] = React.useState(null); // { itemId, fromDay }
  const [overDay, setOverDay] = React.useState(null);

  const dayRefs = React.useRef({});
  React.useEffect(() => {
    const el = dayRefs.current[activeDay];
    if (el) el.scrollIntoViewIfNeeded ? el.scrollIntoViewIfNeeded() :
            el.parentNode.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  }, [activeDay]);

  const onDragStart = (itemId, fromDay) => (e) => {
    setDragging({ itemId, fromDay });
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", itemId); } catch (err) {}
  };
  const onDragEnd = () => {
    setDragging(null); setOverDay(null);
  };

  const moveItem = (toDay, targetIndex) => {
    if (!dragging) return;
    const { itemId, fromDay } = dragging;
    setDays(prev => {
      const next = prev.map(d => ({ ...d, items: [...d.items] }));
      const src = next[fromDay];
      const idx = src.items.findIndex(i => i.id === itemId);
      if (idx === -1) return prev;
      const [it] = src.items.splice(idx, 1);
      const dst = next[toDay];
      const insertAt = targetIndex == null ? dst.items.length : targetIndex;
      dst.items.splice(insertAt, 0, it);
      return next;
    });
  };

  return (
    <div style={itinStyles.wrap}>
      {/* Day rail */}
      <div style={itinStyles.daysRail}>
        <div className="caps" style={{ padding:"0 8px 10px" }}>Days</div>
        {days.map((d, i) => {
          const active = i === activeDay;
          const drop = overDay === i && dragging && dragging.fromDay !== i;
          const cursors = showPresence
            ? collaborators.filter(c => c.active && !c.self && c.cursorDay === i)
            : [];
          return (
            <div
              key={i}
              ref={el => dayRefs.current[i] = el}
              onClick={() => setActiveDay(i)}
              onDragOver={(e) => { e.preventDefault(); setOverDay(i); }}
              onDragLeave={() => setOverDay(prev => prev === i ? null : prev)}
              onDrop={(e) => { e.preventDefault(); moveItem(i, null); onDragEnd(); }}
              style={itinStyles.dayTile(active, drop)}
            >
              <div style={itinStyles.dayNum(active)}>{String(i + 1).padStart(2,"0")}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--bg)" : "var(--ink)" }}>{d.short}</div>
                <div style={itinStyles.dayLabel(active)}>{d.label}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {cursors.map(c => (
                  <div key={c.id} className="avatar sm"
                       style={{ background: c.color, boxShadow:"0 0 0 2px var(--bg)" }}
                       title={`${c.name} is here`}>
                    {c.initials}
                  </div>
                ))}
                <span style={{
                  fontFamily:"var(--f-mono)", fontSize: 11,
                  color: active ? "rgba(255,255,255,.6)" : "var(--ink-4)"
                }}>{d.items.length}</span>
              </div>
            </div>
          );
        })}
        <div style={{
          marginTop: 10, padding:"10px 12px",
          display:"flex", alignItems:"center", gap: 8,
          color:"var(--ink-3)", fontSize: 13, cursor:"pointer",
          borderRadius: 6, border:"1px dashed var(--hair-2)"
        }}>
          <Icon name="plus" size={14} /> Add day
        </div>
      </div>

      {/* Stream */}
      <div style={itinStyles.stream}>
        {days.map((d, di) => {
          const cursors = showPresence
            ? collaborators.filter(c => c.active && !c.self && c.cursorDay === di)
            : [];
          return (
            <section key={di}
              onDragOver={(e) => { e.preventDefault(); setOverDay(di); }}
              onDrop={(e) => { e.preventDefault(); moveItem(di, null); onDragEnd(); }}
            >
              <div style={itinStyles.dayHeader}>
                <div>
                  <div className="caps">Day {di + 1} · {d.date}</div>
                  <div style={itinStyles.dayTitle}>{d.label}</div>
                </div>
                <div style={{ display:"flex", gap: 12, alignItems:"center" }}>
                  {cursors.length > 0 && (
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap: 6,
                      padding:"3px 8px 3px 4px", borderRadius: 999,
                      background:"var(--accent-soft)",
                      color:"var(--accent-ink)", fontSize: 12
                    }}>
                      <AvatarStack people={cursors} size="sm" />
                      <span>viewing</span>
                    </div>
                  )}
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap: 6,
                    color:"var(--ink-3)", fontSize: 13
                  }}>
                    <Icon name={d.weather.icon} size={14} /> {d.weather.temp}
                  </div>
                </div>
              </div>

              {d.items.map((it, ii) => (
                <ItinItem
                  key={it.id}
                  item={it}
                  isDragging={dragging && dragging.itemId === it.id}
                  onDragStart={onDragStart(it.id, di)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => { e.preventDefault(); setOverDay(di); }}
                  onDrop={(e) => { e.preventDefault(); moveItem(di, ii); onDragEnd(); }}
                  collaborators={collaborators}
                />
              ))}

              <div style={itinStyles.addSlot}>
                <Icon name="plus" size={13} /> Add activity
                <span style={{ marginLeft:"auto", fontFamily:"var(--f-mono)", fontSize: 11 }}>
                  <span className="kbd">⌘</span> <span className="kbd">K</span>
                </span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const ItinItem = ({ item, isDragging, onDragStart, onDragEnd, onDragOver, onDrop, collaborators }) => {
  const [hover, setHover] = React.useState(false);
  const author = collaborators.find(c => c.id === item.by);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...itinStyles.item(isDragging),
        ...(hover && !isDragging ? itinStyles.itemHover : {})
      }}
    >
      <div style={{
        color:"var(--ink-4)", opacity: hover ? 1 : 0, transition:"opacity 120ms",
        paddingTop: 4
      }}>
        <Icon name="drag" size={14} />
      </div>
      <div style={itinStyles.time}>
        <div>{item.t}</div>
        {item.dur !== "—" && item.dur && (
          <div style={{ color:"var(--ink-4)", fontSize: 10, marginTop: 2 }}>{item.dur}</div>
        )}
      </div>
      <div style={itinStyles.kindDot}>
        <Icon name={KIND_ICON[item.kind]} size={13} />
      </div>
      <div>
        <div style={itinStyles.title}>{item.title}</div>
        {item.sub && <div style={itinStyles.sub}>{item.sub}</div>}
        <div style={itinStyles.meta}>
          {item.place && item.place !== "—" && (
            <span className="chip"><Icon name="pin" size={10} /> {item.place}</span>
          )}
          {item.cost && <span className="chip mono" style={{ fontSize: 11 }}>{item.cost}</span>}
          {item.booked
            ? <span className="chip" style={{ background:"#E7EFE6", color:"#2D5135" }}>
                <Icon name="check" size={10} /> Booked
              </span>
            : <span className="chip" style={{ color:"var(--ink-3)" }}>
                Not booked
              </span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap: 8, paddingTop: 2 }}>
        {author && (
          <div className="avatar sm" style={{ background: author.color }} title={`Added by ${author.name}`}>
            {author.initials}
          </div>
        )}
      </div>
    </div>
  );
};

window.Itinerary = Itinerary;
