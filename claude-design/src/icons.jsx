/* Minimal, hand-drawn icons — single stroke, currentColor */

const Icon = ({ name, size = 16, strokeWidth = 1.5, style }) => {
  const s = size;
  const sw = strokeWidth;
  const common = {
    width: s, height: s, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: sw,
    strokeLinecap: "round", strokeLinejoin: "round", style
  };
  const paths = {
    loom: (
      /* Custom TripLoom mark — threaded loop */
      <g>
        <path d="M4 7 L20 7" />
        <path d="M4 12 L20 12" />
        <path d="M4 17 L20 17" />
        <path d="M8 4 L8 20" opacity=".4" />
        <path d="M16 4 L16 20" opacity=".4" />
      </g>
    ),
    grid: (
      <g>
        <rect x="4" y="4" width="7" height="7" rx="1.5"/>
        <rect x="13" y="4" width="7" height="7" rx="1.5"/>
        <rect x="4" y="13" width="7" height="7" rx="1.5"/>
        <rect x="13" y="13" width="7" height="7" rx="1.5"/>
      </g>
    ),
    calendar: (
      <g>
        <rect x="3.5" y="5" width="17" height="15" rx="2"/>
        <path d="M8 3 L8 7"/><path d="M16 3 L16 7"/>
        <path d="M3.5 10 L20.5 10"/>
      </g>
    ),
    pin: (
      <g>
        <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </g>
    ),
    ticket: (
      <g>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/>
        <path d="M12 7 L12 17" strokeDasharray="2 2"/>
      </g>
    ),
    note: (
      <g>
        <path d="M6 3h9l4 4v14H6z"/>
        <path d="M9 12h7M9 16h5M9 8h3"/>
      </g>
    ),
    yen: (
      <g>
        <path d="M7 5 L12 12 L17 5"/>
        <path d="M7 13 L17 13"/>
        <path d="M7 17 L17 17"/>
        <path d="M12 12 L12 20"/>
      </g>
    ),
    file: (
      <g>
        <path d="M7 3h7l4 4v14H7z"/>
        <path d="M14 3v4h4"/>
      </g>
    ),
    search: (
      <g>
        <circle cx="11" cy="11" r="6"/>
        <path d="M20 20 L16 16"/>
      </g>
    ),
    plus: (
      <g>
        <path d="M12 5 L12 19"/>
        <path d="M5 12 L19 12"/>
      </g>
    ),
    arrowRight: (
      <g>
        <path d="M5 12 L19 12"/>
        <path d="M13 6 L19 12 L13 18"/>
      </g>
    ),
    chevronRight: (<path d="M9 6 L15 12 L9 18"/>),
    chevronDown: (<path d="M6 9 L12 15 L18 9"/>),
    dots: (
      <g>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>
      </g>
    ),
    drag: (
      <g>
        <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none"/>
      </g>
    ),
    share: (
      <g>
        <circle cx="6" cy="12" r="2.5"/>
        <circle cx="18" cy="6" r="2.5"/>
        <circle cx="18" cy="18" r="2.5"/>
        <path d="M8 11 L16 7"/><path d="M8 13 L16 17"/>
      </g>
    ),
    sparkle: (
      <g>
        <path d="M12 4 L13.5 10.5 L20 12 L13.5 13.5 L12 20 L10.5 13.5 L4 12 L10.5 10.5 Z"/>
      </g>
    ),
    sun: (
      <g>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/>
      </g>
    ),
    cloud: (
      <g>
        <path d="M7 17h11a3.5 3.5 0 0 0 .4-6.98 5 5 0 0 0-9.65-1.2A4 4 0 0 0 7 17z"/>
      </g>
    ),
    rain: (
      <g>
        <path d="M7 14h11a3.5 3.5 0 0 0 .4-6.98 5 5 0 0 0-9.65-1.2A4 4 0 0 0 7 14z"/>
        <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2"/>
      </g>
    ),
    map: (
      <g>
        <path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z"/>
        <path d="M9 4 L9 18"/><path d="M15 6 L15 20"/>
      </g>
    ),
    list: (
      <g>
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </g>
    ),
    check: (<path d="M5 12 L10 17 L19 7"/>),
    clock: (
      <g>
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 8 L12 12 L15 14"/>
      </g>
    ),
    train: (
      <g>
        <rect x="6" y="4" width="12" height="14" rx="3"/>
        <path d="M6 12 L18 12"/>
        <circle cx="9" cy="15" r="0.6" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="15" r="0.6" fill="currentColor" stroke="none"/>
        <path d="M8 20 L6 22"/><path d="M16 20 L18 22"/>
      </g>
    ),
    bed: (
      <g>
        <path d="M3 18v-7h18v7"/>
        <path d="M3 18 L3 20"/><path d="M21 18 L21 20"/>
        <path d="M7 11 V9 a2 2 0 0 1 2-2 h6 a2 2 0 0 1 2 2 V11"/>
      </g>
    ),
    fork: (
      <g>
        <path d="M7 3v8a3 3 0 0 0 6 0V3"/>
        <path d="M10 11 L10 21"/>
        <path d="M17 3 Q14 4 14 9 Q14 12 17 13 L17 21"/>
      </g>
    ),
    walk: (
      <g>
        <circle cx="13" cy="4.5" r="1.5"/>
        <path d="M11 8 L9 14 L7 18"/>
        <path d="M11 8 L14 11 L13 15 L16 20"/>
        <path d="M11 11 L8 12"/>
      </g>
    ),
    bulb: (
      <g>
        <path d="M9 18h6"/><path d="M10 21h4"/>
        <path d="M8 14a5 5 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3z"/>
      </g>
    ),
    command: (
      <g>
        <path d="M9 6a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v10a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2z"/>
      </g>
    ),
    close: (<g><path d="M6 6 L18 18"/><path d="M18 6 L6 18"/></g>),
    check2: (<path d="M6 12 L10 16 L18 8"/>),
    globe: (
      <g>
        <circle cx="12" cy="12" r="8"/>
        <path d="M4 12 L20 12"/>
        <path d="M12 4 C8 8 8 16 12 20"/>
        <path d="M12 4 C16 8 16 16 12 20"/>
      </g>
    ),
    lock: (
      <g>
        <rect x="5" y="10" width="14" height="10" rx="2"/>
        <path d="M8 10 V7 a4 4 0 0 1 8 0 V10"/>
      </g>
    )
  };

  return <svg {...common}>{paths[name] ?? null}</svg>;
};

/* Kind → icon mapping used in the itinerary */
const KIND_ICON = {
  transit: "train",
  stay:    "bed",
  food:    "fork",
  see:     "sparkle",
  walk:    "walk",
  idea:    "bulb"
};

window.Icon = Icon;
window.KIND_ICON = KIND_ICON;
