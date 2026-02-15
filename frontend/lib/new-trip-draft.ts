const STORAGE_KEY = "triploom_new_trip_draft"

export type NewTripDraft = {
  destination: string
  dateMode: "exact" | "weekend" | "flexible"
  travelers: "solo" | "group"
}

const defaultDraft: NewTripDraft = {
  destination: "",
  dateMode: "exact",
  travelers: "solo",
}

export function loadNewTripDraft(): NewTripDraft {
  if (typeof window === "undefined") return defaultDraft
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NewTripDraft>
      return {
        destination: parsed.destination ?? defaultDraft.destination,
        dateMode:
          parsed.dateMode && ["exact", "weekend", "flexible"].includes(parsed.dateMode)
            ? parsed.dateMode
            : defaultDraft.dateMode,
        travelers:
          parsed.travelers && ["solo", "group"].includes(parsed.travelers)
            ? parsed.travelers
            : defaultDraft.travelers,
      }
    }
  } catch {
    // ignore
  }
  return defaultDraft
}

export function saveNewTripDraft(draft: Partial<NewTripDraft>) {
  if (typeof window === "undefined") return
  try {
    const current = loadNewTripDraft()
    const next = { ...current, ...draft }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearNewTripDraft() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
