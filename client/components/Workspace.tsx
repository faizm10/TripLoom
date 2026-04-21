"use client";
import React from "react";
import Link from "next/link";
import { Brand, TripCover, AvatarStack, PresenceDot } from "./Shared";
import { Icon } from "./Icon";
import { Itinerary } from "./Itinerary";
import { MapView } from "./MapView";
import { Tweaks as TweaksPanel } from "./Tweaks";
import { TRIP, DAYS, PLACES, SIDEBAR, DEFAULT_TWEAKS, type Day, type Tweaks } from "@/lib/data";

const s: Record<string, React.CSSProperties> = {
  shell: { display: "grid", gridTemplateColumns: "248px 1fr", height: "100vh", background: "var(--bg)" },
  side: { background: "var(--panel)", borderRight: "1px solid var(--hair)", display: "flex", flexDirection: "column" },
  sideHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 14px 12px" },
  tripPicker: { margin: "0 10px", padding: "10px 12px", background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--hair)", borderRadius: 10, display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center", cursor: "pointer" },
  nav: { padding: "18px 10px 10px", display: "flex", flexDirection: "column", gap: 1 },
  topbar: { height: 56, padding: "0 24px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderBottom: "1px solid var(--hair)", background: "var(--bg)" },
  segmented: { display: "inline-flex", background: "var(--panel)", padding: 3, borderRadius: 8, boxShadow: "inset 0 0 0 1px var(--hair)" },
  main: { overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" },
  content: { flex: 1, overflow: "hidden", position: "relative" }
};

const navItem = (active: boolean): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: "18px 1fr auto", gap: 10, alignItems: "center",
  padding: "7px 10px", borderRadius: 6, fontSize: 13,
  color: active ? "var(--ink)" : "var(--ink-2)",
  background: active ? "var(--card)" : "transparent",
  boxShadow: active ? "inset 0 0 0 1px var(--hair)" : "none",
  cursor: "pointer"
});

const seg = (active: boolean): React.CSSProperties => ({
  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
  color: active ? "var(--ink)" : "var(--ink-3)",
  background: active ? "var(--card)" : "transparent",
  boxShadow: active ? "var(--sh-1)" : "none",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  transition: "background 160ms ease, color 160ms ease"
});

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="caps" style={{ fontSize: 10 }}>{label}</div>
    <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, color: "var(--ink)", marginTop: 2, letterSpacing: "-0.01em" }}>{value}</div>
  </div>
);

export const Workspace: React.FC = () => {
  const [section, setSection] = React.useState("itinerary");
  const [view, setView] = React.useState<"timeline" | "map">("timeline");
  const [activeDay, setActiveDay] = React.useState(0);
  const [days, setDays] = React.useState<Day[]>(DAYS);
  const [tweaks, setTweaks] = React.useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => {
    const accents: Record<string, string> = {
      indigo: "oklch(55% 0.12 275)", clay: "oklch(55% 0.12 40)",
      sage: "oklch(55% 0.10 150)", ink: "oklch(25% 0.02 270)"
    };
    document.documentElement.style.setProperty("--accent", accents[tweaks.accent]);
  }, [tweaks.accent]);

  const totalPlaces = PLACES.length;
  const booked = days.flatMap(d => d.items).filter(i => i.booked).length;
  const totalItems = days.flatMap(d => d.items).length;

  return (
    <div style={s.shell} data-screen-label="03 Workspace">
      <aside style={s.side}>
        <div style={s.sideHead}>
          <Link href="/trips" style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit" }}>
            <Icon name="chevronRight" size={14} style={{ transform: "rotate(180deg)", color: "var(--ink-3)" }} />
            <Brand size={13} />
          </Link>
        </div>

        <div style={s.tripPicker}>
          <div style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden" }}>
            <TripCover tag={TRIP.tag} seed={4} compact />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{TRIP.title}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{TRIP.start} – {TRIP.end}, {TRIP.year}</div>
          </div>
          <Icon name="chevronDown" size={12} style={{ color: "var(--ink-3)" }} />
        </div>

        <div style={s.nav}>
          {SIDEBAR.map(sec => (
            <div key={sec.id} style={navItem(section === sec.id)} onClick={() => setSection(sec.id)}>
              <Icon name={sec.icon} size={14} />
              <span>{sec.label}</span>
              {sec.id === "itinerary" && <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>{totalItems}</span>}
              {sec.id === "places" && <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>{totalPlaces}</span>}
              {sec.id === "bookings" && <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>{booked}/{totalItems}</span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "16px 14px", borderTop: "1px solid var(--hair)" }}>
          <div className="caps" style={{ marginBottom: 10 }}>With you</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TRIP.collaborators.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px", fontSize: 13 }}>
                <div className="avatar sm" style={{ background: c.color }}>{c.initials}</div>
                <span style={{ color: "var(--ink-2)" }}>
                  {c.name}{c.self && <span style={{ color: "var(--ink-4)" }}> (you)</span>}
                </span>
                <span style={{ marginLeft: "auto" }}>
                  <PresenceDot active={tweaks.showPresence && c.active} />
                </span>
              </div>
            ))}
          </div>
          <button className="btn ghost" style={{ marginTop: 10, width: "100%", justifyContent: "flex-start", color: "var(--ink-3)" }}>
            <Icon name="plus" size={13} /> Invite
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="caps">Itinerary</span>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{days[activeDay].label}</span>
            </div>
          </div>
          <div style={s.segmented}>
            <div style={seg(view === "timeline")} onClick={() => setView("timeline")}>
              <Icon name="calendar" size={12} /> Timeline
            </div>
            <div style={seg(view === "map")} onClick={() => setView("map")}>
              <Icon name="map" size={12} /> Map
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
            {tweaks.showPresence && <AvatarStack people={TRIP.collaborators.filter(c => c.active)} size="sm" />}
            <button className="btn" onClick={() => setTweaksOpen(o => !o)}>
              <Icon name="sparkle" size={13} /> Tweaks
            </button>
            <button className="btn"><Icon name="share" size={13} /> Share</button>
            <button className="btn primary"><Icon name="plus" size={13} /> Add</button>
          </div>
        </header>

        <div style={{ padding: "18px 32px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, borderBottom: "1px solid var(--hair)" }}>
          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div className="caps">{TRIP.year} · Spring</div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {TRIP.title}
              <span style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 24, marginLeft: 12 }}>
                {TRIP.start} – {TRIP.end}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", columnGap: 28, textAlign: "right", flex: "0 0 auto" }}>
            <Stat label="Days" value="10" />
            <Stat label="Pins" value={String(totalPlaces)} />
            <Stat label="Booked" value={`${booked}/${totalItems}`} />
            <Stat label="Budget" value="¥612k" />
          </div>
        </div>

        <div style={s.content}>
          <div style={{ position: "absolute", inset: 0, opacity: view === "timeline" ? 1 : 0, pointerEvents: view === "timeline" ? "auto" : "none", transition: "opacity 220ms ease" }}>
            <Itinerary activeDay={activeDay} setActiveDay={setActiveDay} days={days} setDays={setDays}
              showPresence={tweaks.showPresence} collaborators={TRIP.collaborators} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: view === "map" ? 1 : 0, pointerEvents: view === "map" ? "auto" : "none", transition: "opacity 220ms ease" }}>
            <MapView activeDay={activeDay} setActiveDay={setActiveDay} days={days} style={tweaks.mapStyle} />
          </div>
        </div>
      </main>

      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} />
    </div>
  );
};
