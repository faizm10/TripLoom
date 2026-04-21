export type Collaborator = {
  id: string;
  name: string;
  initials: string;
  color: string;
  active: boolean;
  cursorDay: number | null;
  self?: boolean;
};

export type ItemKind = "transit" | "stay" | "food" | "see" | "walk" | "idea";

export type ItineraryItem = {
  id: string;
  t: string;
  dur: string;
  kind: ItemKind;
  title: string;
  sub: string;
  place: string;
  cost?: string;
  booked: boolean;
  by: string;
};

export type Day = {
  date: string;
  short: string;
  label: string;
  weather: { icon: "sun" | "cloud" | "rain"; temp: string };
  items: ItineraryItem[];
};

export type Place = {
  id: string;
  name: string;
  kind: string;
  neighborhood: string;
  day: number;
  x: number;
  y: number;
};

export type Trip = {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  year: string;
  cover: string;
  tag: string;
  collaborators: Collaborator[];
};

export const TRIP: Trip = {
  id: "tokyo-2026",
  title: "Tokyo",
  subtitle: "Ten days, four friends",
  start: "Apr 14",
  end: "Apr 23",
  year: "2026",
  cover: "tokyo",
  tag: "tag-c",
  collaborators: [
    { id: "m", name: "Mina", initials: "MK", color: "#E7D6C7", active: true, cursorDay: 2 },
    { id: "r", name: "Ravi", initials: "RS", color: "#CFE0D6", active: true, cursorDay: 4 },
    { id: "j", name: "June", initials: "JN", color: "#D8D9EC", active: false, cursorDay: null },
    { id: "y", name: "You", initials: "YO", color: "#EAE3D0", active: true, cursorDay: 0, self: true }
  ]
};

export const OTHER_TRIPS = [
  { id: "lisbon", title: "Lisbon + Sintra", when: "Jun 2 – Jun 8", year: "2026", status: "Planning", days: 6, places: 14, people: 2, tag: "tag-a" },
  { id: "patagonia", title: "Patagonia loop", when: "Oct 11 – Oct 25", year: "2026", status: "Idea", days: 14, places: 3, people: 3, tag: "tag-b" },
  { id: "seoul", title: "Seoul weekend", when: "Feb 6 – Feb 9", year: "2026", status: "Booked", days: 3, places: 22, people: 2, tag: "tag-d" },
  { id: "kyoto", title: "Kyoto — archive", when: "Nov 2 – Nov 10", year: "2025", status: "Archived", days: 8, places: 31, people: 4, tag: "tag-e" }
];

export const DAYS: Day[] = [
  { date: "Tue, Apr 14", short: "Apr 14", label: "Arrival · Shinjuku", weather: { icon: "cloud", temp: "17°" }, items: [
    { id:"d1-1", t:"14:40", dur:"1h 10m", kind:"transit", title:"Narita Express to Shinjuku", sub:"NEX 23 · Car 4, Seats 3A–3D", place:"Shinjuku Stn", cost:"¥13,080", booked:true, by:"y" },
    { id:"d1-2", t:"16:30", dur:"—", kind:"stay", title:"Check in — Hotel Century Southern Tower", sub:"Confirmation JP-82441 · Twin room", place:"Shinjuku 2-2-1", cost:"¥148,000 / 9nt", booked:true, by:"m" },
    { id:"d1-3", t:"19:00", dur:"2h", kind:"food", title:"Dinner at Donjaca", sub:"Izakaya — Ravi's pick. Walk-in only.", place:"Shinjuku Sanchome", booked:false, by:"r" },
    { id:"d1-4", t:"21:30", dur:"1h", kind:"walk", title:"Omoide Yokocho loitering", sub:"Nightcap. Skip if anyone's tired.", place:"Nishi-Shinjuku", booked:false, by:"j" }
  ]},
  { date: "Wed, Apr 15", short: "Apr 15", label: "Shibuya + Harajuku", weather: { icon: "sun", temp: "20°" }, items: [
    { id:"d2-1", t:"09:30", dur:"2h", kind:"see", title:"Meiji Jingu — morning walk", sub:"Enter from Harajuku gate.", place:"Yoyogi", booked:false, by:"m" },
    { id:"d2-2", t:"12:00", dur:"1h 30m", kind:"food", title:"Lunch · Afuri ramen", sub:"Yuzu shio. Allow queue.", place:"Harajuku", cost:"¥1,480 ea", booked:false, by:"y" },
    { id:"d2-3", t:"14:00", dur:"3h", kind:"see", title:"Shibuya wandering", sub:"Tower Records → Hachiko → Scramble Square", place:"Shibuya", booked:false, by:"r" },
    { id:"d2-4", t:"18:30", dur:"1h", kind:"see", title:"Shibuya Sky — sunset slot", sub:"Timed entry. Bring passports.", place:"Shibuya Scramble Sq.", cost:"¥2,500 ea", booked:true, by:"y" }
  ]},
  { date: "Thu, Apr 16", short: "Apr 16", label: "Asakusa + Yanaka", weather: { icon: "cloud", temp: "18°" }, items: [
    { id:"d3-1", t:"10:00", dur:"2h", kind:"see", title:"Sensō-ji + Nakamise", sub:"Skip the main drag, cut into the side streets.", place:"Asakusa", booked:false, by:"j" },
    { id:"d3-2", t:"13:00", dur:"1h", kind:"food", title:"Lunch · Daikokuya tempura", sub:"Original branch. Tendon set.", place:"Asakusa", cost:"¥2,100 ea", booked:false, by:"m" },
    { id:"d3-3", t:"15:00", dur:"3h", kind:"walk", title:"Yanaka old-town wander", sub:"Yanaka Ginza, cemetery, cats.", place:"Yanaka", booked:false, by:"r" }
  ]},
  { date: "Fri, Apr 17", short: "Apr 17", label: "teamLab + Toyosu", weather: { icon: "rain", temp: "15°" }, items: [
    { id:"d4-1", t:"11:00", dur:"3h", kind:"see", title:"teamLab Planets", sub:"Timed entry. Wear shorts or roll pants.", place:"Toyosu", cost:"¥3,800 ea", booked:true, by:"r" },
    { id:"d4-2", t:"15:30", dur:"1h 30m", kind:"food", title:"Late lunch · Tsukishima monja", sub:"Pick any. They're all fine.", place:"Tsukishima", booked:false, by:"j" },
    { id:"d4-3", t:"20:00", dur:"2h", kind:"food", title:"Dinner · Ginza Kagari", sub:"Chicken paitan. Reservation under 'Ravi'.", place:"Ginza", cost:"¥2,000 ea", booked:true, by:"r" }
  ]},
  { date: "Sat, Apr 18", short: "Apr 18", label: "Day trip — Hakone", weather: { icon: "cloud", temp: "14°" }, items: [
    { id:"d5-1", t:"07:50", dur:"1h 25m", kind:"transit", title:"Romancecar to Hakone-Yumoto", sub:"Odakyu, Seats reserved.", place:"Shinjuku", cost:"¥2,470 ea", booked:true, by:"y" },
    { id:"d5-2", t:"10:00", dur:"5h", kind:"see", title:"Hakone loop — ropeway + pirate ship", sub:"Open-air museum if time.", place:"Hakone", cost:"¥5,700 ea", booked:true, by:"m" },
    { id:"d5-3", t:"16:00", dur:"1h 30m", kind:"stay", title:"Onsen at Tenzan", sub:"Bring small towel. Tattoo policy checked.", place:"Hakone-Yumoto", cost:"¥1,450 ea", booked:false, by:"j" }
  ]},
  { date: "Sun, Apr 19", short: "Apr 19", label: "Downtempo · Daikanyama", weather: { icon: "sun", temp: "21°" }, items: [
    { id:"d6-1", t:"11:00", dur:"2h", kind:"see", title:"Tsutaya books + coffee", sub:"Slow morning. Mina working.", place:"Daikanyama", booked:false, by:"m" },
    { id:"d6-2", t:"14:00", dur:"2h 30m", kind:"walk", title:"Nakameguro canal walk", sub:"Shops along the canal.", place:"Nakameguro", booked:false, by:"r" }
  ]},
  { date: "Mon, Apr 20", short: "Apr 20", label: "Akihabara + Jimbocho", weather: { icon: "sun", temp: "22°" }, items: [
    { id:"d7-1", t:"10:30", dur:"2h 30m", kind:"see", title:"Akihabara — June's list", sub:"Super Potato, Yodobashi.", place:"Akihabara", booked:false, by:"j" },
    { id:"d7-2", t:"14:00", dur:"2h", kind:"see", title:"Jimbocho bookshop street", sub:"Ravi wants Issei-do.", place:"Jimbocho", booked:false, by:"r" }
  ]},
  { date: "Tue, Apr 21", short: "Apr 21", label: "Tsukiji + Hama-rikyū", weather: { icon: "cloud", temp: "19°" }, items: [
    { id:"d8-1", t:"08:00", dur:"2h", kind:"food", title:"Tsukiji outer market", sub:"Tamagoyaki, uni, coffee.", place:"Tsukiji", booked:false, by:"y" },
    { id:"d8-2", t:"10:30", dur:"2h", kind:"walk", title:"Hama-rikyū gardens + matcha", sub:"Tea house on the pond.", place:"Hama-rikyū", cost:"¥850 ea", booked:false, by:"m" }
  ]},
  { date: "Wed, Apr 22", short: "Apr 22", label: "Buffer + omiyage", weather: { icon: "sun", temp: "23°" }, items: [
    { id:"d9-1", t:"—", dur:"—", kind:"idea", title:"Unscheduled by design", sub:"Rest, repack, anything we missed.", place:"—", booked:false, by:"y" },
    { id:"d9-2", t:"18:00", dur:"2h 30m", kind:"food", title:"Final dinner · Nakajima", sub:"Sardine kaiseki, lunch-price at dinner.", place:"Shinjuku", cost:"¥8,800 ea", booked:true, by:"m" }
  ]},
  { date: "Thu, Apr 23", short: "Apr 23", label: "Departure", weather: { icon: "sun", temp: "22°" }, items: [
    { id:"d10-1", t:"11:00", dur:"—", kind:"stay", title:"Check out", sub:"Store bags at front desk.", place:"Century Southern Tower", booked:false, by:"y" },
    { id:"d10-2", t:"14:10", dur:"1h 25m", kind:"transit", title:"NEX → Narita", sub:"Flight NH 106, 17:55.", place:"Narita T1", cost:"¥3,270 ea", booked:true, by:"y" }
  ]}
];

export const PLACES: Place[] = [
  { id:"p1", name:"Century Southern Tower", kind:"Stay", neighborhood:"Shinjuku", day:1, x:26, y:42 },
  { id:"p2", name:"Donjaca", kind:"Food", neighborhood:"Shinjuku", day:1, x:28, y:40 },
  { id:"p3", name:"Meiji Jingu", kind:"See", neighborhood:"Yoyogi", day:2, x:31, y:48 },
  { id:"p4", name:"Shibuya Sky", kind:"See", neighborhood:"Shibuya", day:2, x:32, y:55 },
  { id:"p5", name:"Afuri", kind:"Food", neighborhood:"Harajuku", day:2, x:30, y:50 },
  { id:"p6", name:"Sensō-ji", kind:"See", neighborhood:"Asakusa", day:3, x:66, y:28 },
  { id:"p7", name:"Daikokuya", kind:"Food", neighborhood:"Asakusa", day:3, x:65, y:30 },
  { id:"p8", name:"Yanaka Ginza", kind:"Walk", neighborhood:"Yanaka", day:3, x:58, y:34 },
  { id:"p9", name:"teamLab Planets", kind:"See", neighborhood:"Toyosu", day:4, x:70, y:60 },
  { id:"p10", name:"Ginza Kagari", kind:"Food", neighborhood:"Ginza", day:4, x:55, y:52 },
  { id:"p11", name:"Tsutaya Daikanyama", kind:"See", neighborhood:"Daikanyama", day:6, x:34, y:62 },
  { id:"p12", name:"Nakameguro canal", kind:"Walk", neighborhood:"Nakameguro", day:6, x:36, y:65 },
  { id:"p13", name:"Super Potato", kind:"See", neighborhood:"Akihabara", day:7, x:58, y:40 },
  { id:"p14", name:"Issei-do", kind:"See", neighborhood:"Jimbocho", day:7, x:52, y:42 },
  { id:"p15", name:"Tsukiji outer market", kind:"Food", neighborhood:"Tsukiji", day:8, x:58, y:54 },
  { id:"p16", name:"Hama-rikyū gardens", kind:"Walk", neighborhood:"Hama-rikyū", day:8, x:57, y:56 },
  { id:"p17", name:"Nakajima", kind:"Food", neighborhood:"Shinjuku", day:9, x:27, y:43 }
];

export const SIDEBAR = [
  { id:"overview", label:"Overview", icon:"grid" },
  { id:"itinerary", label:"Itinerary", icon:"calendar" },
  { id:"places", label:"Places", icon:"pin" },
  { id:"bookings", label:"Bookings", icon:"ticket" },
  { id:"notes", label:"Notes", icon:"note" },
  { id:"budget", label:"Budget", icon:"yen" },
  { id:"files", label:"Files", icon:"file" }
] as const;

export type Tweaks = {
  accent: "indigo" | "clay" | "sage" | "ink";
  density: "cozy" | "compact";
  mapStyle: "paper" | "dots";
  showPresence: boolean;
};

export const DEFAULT_TWEAKS: Tweaks = {
  accent: "indigo",
  density: "cozy",
  mapStyle: "paper",
  showPresence: true
};
