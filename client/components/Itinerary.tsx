"use client";
import React from "react";
import { Icon, KIND_ICON } from "./Icon";
import { AvatarStack } from "./Shared";
import type { Day, Collaborator, ItineraryItem } from "@/lib/data";

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "grid", gridTemplateColumns: "260px 1fr", height: "100%", overflow: "hidden" },
  daysRail: { borderRight: "1px solid var(--hair)", background: "var(--bg)", overflow: "auto", padding: "22px 14px" },
  stream: { overflow: "auto", padding: "28px 40px 80px" },
  dayHeader: { display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "28px 0 16px", borderBottom: "1px solid var(--hair)", marginBottom: 10 },
  dayTitle: { fontFamily: "var(--f-display)", fontSize: 34, letterSpacing: "-0.01em" },
  time: { fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-3)", paddingTop: 2, letterSpacing: "0.02em" },
  kindDot: { width: 22, height: 22, borderRadius: 6, background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--hair)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", marginTop: 1 },
  title: { fontSize: 14, color: "var(--ink)", letterSpacing: "-0.005em" },
  sub: { fontSize: 13, color: "var(--ink-3)", marginTop: 3, maxWidth: 540 },
  meta: { display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  addSlot: { display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 10px 96px", color: "var(--ink-4)", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "1px dashed transparent" }
};

const dayTile = (active: boolean, drop: boolean): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10,
  padding: "10px 12px", borderRadius: 8,
  background: active ? "var(--ink)" : drop ? "var(--accent-soft)" : "transparent",
  color: active ? "var(--bg)" : "var(--ink-2)",
  boxShadow: active ? "none" : drop ? "inset 0 0 0 1px var(--accent)" : "inset 0 0 0 1px transparent",
  cursor: "pointer", transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease", marginBottom: 2
});

const ItinItem: React.FC<{
  item: ItineraryItem; isDragging: boolean;
  onDragStart: React.DragEventHandler; onDragEnd: () => void;
  onDragOver: React.DragEventHandler; onDrop: React.DragEventHandler;
  collaborators: Collaborator[];
}> = ({ item, isDragging, onDragStart, onDragEnd, onDragOver, onDrop, collaborators }) => {
  const [hover, setHover] = React.useState(false);
  const author = collaborators.find(c => c.id === item.by);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "18px 60px 22px 1fr auto",
        alignItems: "flex-start", gap: 14, padding: "12px 10px 12px 4px",
        borderRadius: 8, marginBottom: 2,
        background: isDragging ? "var(--card)" : (hover ? "var(--panel)" : "transparent"),
        boxShadow: isDragging ? "var(--sh-2)" : "none",
        cursor: "grab", transition: "background 120ms ease", opacity: isDragging ? .96 : 1
      }}>
      <div style={{ color: "var(--ink-4)", opacity: hover ? 1 : 0, transition: "opacity 120ms", paddingTop: 4 }}>
        <Icon name="drag" size={14} />
      </div>
      <div style={s.time}>
        <div>{item.t}</div>
        {item.dur !== "—" && item.dur && <div style={{ color: "var(--ink-4)", fontSize: 10, marginTop: 2 }}>{item.dur}</div>}
      </div>
      <div style={s.kindDot}><Icon name={KIND_ICON[item.kind]} size={13} /></div>
      <div>
        <div style={s.title}>{item.title}</div>
        {item.sub && <div style={s.sub}>{item.sub}</div>}
        <div style={s.meta}>
          {item.place && item.place !== "—" && <span className="chip"><Icon name="pin" size={10} /> {item.place}</span>}
          {item.cost && <span className="chip mono" style={{ fontSize: 11 }}>{item.cost}</span>}
          {item.booked
            ? <span className="chip" style={{ background: "#E7EFE6", color: "#2D5135" }}><Icon name="check" size={10} /> Booked</span>
            : <span className="chip" style={{ color: "var(--ink-3)" }}>Not booked</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 2 }}>
        {author && <div className="avatar sm" style={{ background: author.color }} title={`Added by ${author.name}`}>{author.initials}</div>}
      </div>
    </div>
  );
};

export const Itinerary: React.FC<{
  activeDay: number; setActiveDay: (n: number) => void;
  days: Day[]; setDays: React.Dispatch<React.SetStateAction<Day[]>>;
  showPresence: boolean; collaborators: Collaborator[];
}> = ({ activeDay, setActiveDay, days, setDays, showPresence, collaborators }) => {
  const [dragging, setDragging] = React.useState<{ itemId: string; fromDay: number } | null>(null);
  const [overDay, setOverDay] = React.useState<number | null>(null);

  const onDragStart = (itemId: string, fromDay: number): React.DragEventHandler => (e) => {
    setDragging({ itemId, fromDay });
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", itemId); } catch {}
  };
  const onDragEnd = () => { setDragging(null); setOverDay(null); };

  const moveItem = (toDay: number, targetIndex: number | null) => {
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
    <div style={s.wrap}>
      <div style={s.daysRail}>
        <div className="caps" style={{ padding: "0 8px 10px" }}>Days</div>
        {days.map((d, i) => {
          const active = i === activeDay;
          const drop = overDay === i && !!dragging && dragging.fromDay !== i;
          const cursors = showPresence ? collaborators.filter(c => c.active && !c.self && c.cursorDay === i) : [];
          return (
            <div key={i} onClick={() => setActiveDay(i)}
              onDragOver={(e) => { e.preventDefault(); setOverDay(i); }}
              onDragLeave={() => setOverDay(prev => prev === i ? null : prev)}
              onDrop={(e) => { e.preventDefault(); moveItem(i, null); onDragEnd(); }}
              style={dayTile(active, drop)}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 20, lineHeight: 1, color: active ? "var(--bg)" : "var(--ink)", letterSpacing: "-0.01em" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--bg)" : "var(--ink)" }}>{d.short}</div>
                <div style={{ fontSize: 12, color: active ? "rgba(255,255,255,.7)" : "var(--ink-3)" }}>{d.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {cursors.map(c => (
                  <div key={c.id} className="avatar sm" style={{ background: c.color, boxShadow: "0 0 0 2px var(--bg)" }} title={`${c.name} is here`}>{c.initials}</div>
                ))}
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: active ? "rgba(255,255,255,.6)" : "var(--ink-4)" }}>{d.items.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={s.stream}>
        {days.map((d, di) => {
          const cursors = showPresence ? collaborators.filter(c => c.active && !c.self && c.cursorDay === di) : [];
          return (
            <section key={di}
              onDragOver={(e) => { e.preventDefault(); setOverDay(di); }}
              onDrop={(e) => { e.preventDefault(); moveItem(di, null); onDragEnd(); }}>
              <div style={s.dayHeader}>
                <div>
                  <div className="caps">Day {di + 1} · {d.date}</div>
                  <div style={s.dayTitle}>{d.label}</div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {cursors.length > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 4px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent-ink)", fontSize: 12 }}>
                      <AvatarStack people={cursors} size="sm" /><span>viewing</span>
                    </div>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13 }}>
                    <Icon name={d.weather.icon} size={14} /> {d.weather.temp}
                  </div>
                </div>
              </div>
              {d.items.map((it, ii) => (
                <ItinItem key={it.id} item={it}
                  isDragging={!!dragging && dragging.itemId === it.id}
                  onDragStart={onDragStart(it.id, di)} onDragEnd={onDragEnd}
                  onDragOver={(e) => { e.preventDefault(); setOverDay(di); }}
                  onDrop={(e) => { e.preventDefault(); moveItem(di, ii); onDragEnd(); }}
                  collaborators={collaborators} />
              ))}
              <div style={s.addSlot}>
                <Icon name="plus" size={13} /> Add activity
                <span style={{ marginLeft: "auto", fontFamily: "var(--f-mono)", fontSize: 11 }}>
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
