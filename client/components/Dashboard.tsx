"use client";
import React from "react";
import Link from "next/link";
import { Brand, TripCover, AvatarStack } from "./Shared";
import { Icon } from "./Icon";
import { TRIP, OTHER_TRIPS, PLACES } from "@/lib/data";

type TripRow = {
  id: string; title: string; when: string; year: string; status: string;
  days: number; places: number; people: number; tag: string; seed?: number; subtitle?: string;
};

const d: Record<string, React.CSSProperties> = {
  page: { position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "248px 1fr", background: "var(--bg)" },
  side: { background: "var(--panel)", borderRight: "1px solid var(--hair)", padding: "18px 14px", display: "flex", flexDirection: "column" },
  sideTop: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 16px" },
  main: { overflow: "auto", padding: "40px 56px 80px" },
  header: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, paddingBottom: 24, borderBottom: "1px solid var(--hair)" },
  h1: { fontFamily: "var(--f-display)", fontSize: 48, letterSpacing: "-0.02em", margin: 0 },
  sub: { color: "var(--ink-3)", marginTop: 6, fontSize: 14 },
  row: { display: "grid", gridTemplateColumns: "44px 2.4fr 1fr 1fr 1fr 120px", alignItems: "center", gap: 16, padding: "18px 4px", borderBottom: "1px solid var(--hair)", cursor: "pointer", transition: "background 120ms ease" },
  colHead: { color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 10, borderBottom: "1px solid var(--hair)" },
  cover: { width: 44, height: 44, borderRadius: 8, overflow: "hidden", flex: "none" },
  title: { fontSize: 16, color: "var(--ink)", letterSpacing: "-0.005em" },
  titleSub: { color: "var(--ink-3)", fontSize: 12, marginTop: 3 },
  stat: { fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-2)" }
};

const sideLink = (active: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 6, fontSize: 13,
  color: active ? "var(--ink)" : "var(--ink-2)",
  background: active ? "var(--card)" : "transparent",
  boxShadow: active ? "inset 0 0 0 1px var(--hair)" : "none",
  cursor: "pointer"
});

const statusChip = (status: string): React.CSSProperties => {
  const tones: Record<string, { bg: string; fg: string }> = {
    Planning: { bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
    Booked: { bg: "#E7EFE6", fg: "#2D5135" },
    Idea: { bg: "var(--panel-2)", fg: "var(--ink-2)" },
    Archived: { bg: "var(--panel-2)", fg: "var(--ink-3)" },
    Active: { bg: "#EDE9E2", fg: "var(--ink)" }
  };
  const t = tones[status] || tones.Idea;
  return { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 999, background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500 };
};

const Row: React.FC<{ trip: TripRow }> = ({ trip }) => {
  const [hover, setHover] = React.useState(false);
  const body = (
    <div style={{ ...d.row, background: hover ? "var(--panel)" : "transparent" }}
         onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={d.cover}><TripCover tag={trip.tag} seed={trip.seed || 1} compact /></div>
      <div>
        <div style={d.title}>{trip.title}</div>
        <div style={d.titleSub}>{trip.subtitle || `${trip.days} days · planned with ${trip.people} people`}</div>
      </div>
      <div style={d.stat}>{trip.when}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AvatarStack
          people={Array.from({ length: trip.people }).map((_, i) => ({
            id: i, initials: (["MK", "RS", "JN", "YO"][i] || "··"),
            color: (["#E7D6C7", "#CFE0D6", "#D8D9EC", "#EAE3D0"][i])
          }))}
          size="sm"
        />
      </div>
      <div style={d.stat}>{trip.places} pins</div>
      <div><span style={statusChip(trip.status)}>{trip.status}</span></div>
    </div>
  );
  return trip.id === "tokyo-2026"
    ? <Link href={`/trips/${trip.id}`} style={{ color: "inherit" }}>{body}</Link>
    : body;
};

export const Dashboard: React.FC = () => {
  const allTrips: TripRow[] = [
    { id: "tokyo-2026", title: "Tokyo", when: `${TRIP.start} – ${TRIP.end}`, year: "2026",
      status: "Active", days: 10, places: PLACES.length, people: 4, tag: TRIP.tag, seed: 4, subtitle: TRIP.subtitle },
    ...OTHER_TRIPS.map((t, i) => ({ ...t, seed: i + 1 }))
  ];
  const byYear = allTrips.reduce<Record<string, TripRow[]>>((acc, t) => {
    (acc[t.year] ||= []).push(t); return acc;
  }, {});
  const years = Object.keys(byYear).sort().reverse();

  return (
    <div style={d.page} data-screen-label="02 Dashboard">
      <aside style={d.side}>
        <div style={d.sideTop}>
          <Link href="/"><Brand /></Link>
          <button className="btn ghost" style={{ width: 24, height: 24, padding: 0 }}>
            <Icon name="dots" size={14} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--card)", boxShadow: "inset 0 0 0 1px var(--hair)", borderRadius: 6, color: "var(--ink-3)", marginBottom: 14 }}>
          <Icon name="search" size={14} />
          <span style={{ fontSize: 13, flex: 1 }}>Search trips, places, notes</span>
          <span className="kbd">⌘K</span>
        </div>
        <div className="caps" style={{ padding: "8px 10px 6px" }}>Workspace</div>
        <div style={sideLink(true)}>
          <Icon name="grid" size={15} /> All trips
          <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 11 }}>{allTrips.length}</span>
        </div>
        <div style={sideLink(false)}><Icon name="calendar" size={15} /> Upcoming</div>
        <div style={sideLink(false)}><Icon name="bulb" size={15} /> Ideas</div>
        <div style={sideLink(false)}><Icon name="lock" size={15} /> Archive</div>

        <div className="caps" style={{ padding: "20px 10px 6px" }}>Shared with me</div>
        {allTrips.slice(0, 3).map(t => (
          <div key={t.id} style={sideLink(false)}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: `var(--${t.tag})` }} />
            {t.title}
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: "12px 6px 2px", borderTop: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <div className="avatar" style={{ background: "var(--tag-a)" }}>YO</div>
            <div style={{ fontSize: 13 }}>
              <div>You</div>
              <div style={{ color: "var(--ink-4)", fontSize: 11 }}>Free plan · 3 of 3</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={d.main}>
        <header style={d.header}>
          <div>
            <h1 style={d.h1}>Your trips</h1>
            <p style={d.sub}>Five in flight, one on the way, one to remember.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn"><Icon name="list" size={14} /> List</button>
            <button className="btn primary"><Icon name="plus" size={14} /> New trip</button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "44px 2.4fr 1fr 1fr 1fr 120px", gap: 16, padding: "0 4px" }}>
          <span></span>
          <span style={d.colHead}>Trip</span>
          <span style={d.colHead}>Dates</span>
          <span style={d.colHead}>People</span>
          <span style={d.colHead}>Places</span>
          <span style={d.colHead}>Status</span>
        </div>

        {years.map(year => (
          <section key={year} style={{ marginTop: 28 }}>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 28, letterSpacing: "-0.01em", padding: "0 4px 8px", color: "var(--ink-3)" }}>{year}</div>
            {byYear[year].map(t => <Row key={t.id} trip={t} />)}
          </section>
        ))}
      </main>
    </div>
  );
};
