"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Settings2Icon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { useTripFinanceActions } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  isFixedCost,
  type ExpenseCategory,
  type FinanceGuardrailStatus,
  type FinanceSummary,
  type SplitMode,
  type Trip,
  type TripExpense,
  type TripExpenseSplit,
} from "@/lib/trips"
import { getFinanceSummary, getTripFinance, runFinanceGuardrails } from "@/lib/trips"

/* ── Constants ──────────────────────────────────────────────────────────── */

const EXPENSE_CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "transit", label: "Transit" },
  { value: "food", label: "Food" },
  { value: "activities", label: "Activities" },
  { value: "misc", label: "Other" },
  { value: "flights", label: "Flights" },
  { value: "hotels", label: "Hotels" },
]

const DAILY_CATEGORIES: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "transit", label: "Transit" },
  { value: "food", label: "Food" },
  { value: "activities", label: "Activities" },
  { value: "misc", label: "Other" },
]

const STATUS_CLASSES: Record<FinanceGuardrailStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  watch: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  over: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const STATUS_LABEL: Record<FinanceGuardrailStatus, string> = {
  on_track: "On track",
  watch: "Watch",
  over: "Over budget",
}

type ExpenseDraft = {
  date: string
  title: string
  amount: string
  category: ExpenseCategory
  payerName: string
  currency: string
  splitMode: SplitMode
  notes: string
  splits: Record<string, string>
}

type HotelPricingMode = "one_person" | "x_people" | "full_booking"
type HotelSplitBy = "nights" | "days"

const HOTEL_ALLOCATOR_NOTE_PREFIX = "[hotel_allocator_v1]"

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function formatDateLabel(date: string): string {
  if (!date) return "Date TBD"
  const [year, month, day] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt)
}

function defaultDraft(trip: Trip, currency: string): ExpenseDraft {
  return {
    date: trip.startDate,
    title: "",
    amount: "",
    category: "transit",
    payerName: "Primary traveler",
    currency,
    splitMode: "equal",
    notes: "",
    splits: {},
  }
}

function buildTravelers(totalCount: number): Array<{ id: string; label: string }> {
  const total = Math.max(1, totalCount)
  return Array.from({ length: total }).map((_, index) => ({
    id: `traveler-${index + 1}`,
    label: `Traveler ${index + 1}`,
  }))
}

function parseIsoDateOrFallback(value: string, fallback: string): Date {
  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback
  const [year, month, day] = source.split("-").map(Number)
  return new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1))
}

function addUtcDays(date: string, days: number): string {
  const base = parseIsoDateOrFallback(date, "1970-01-01")
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function categoryLabel(value: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function FinancePageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  return <FinancePageBody trip={trip} />
}

function FinancePageBody({ trip }: { trip: Trip }) {
  const finance = getTripFinance(trip)
  const summary = getFinanceSummary(trip)
  const guardrail = runFinanceGuardrails(trip)
  const travelerCount = finance.groupModeEnabled ? finance.groupSize : Math.max(1, trip.travelers)
  const travelers = React.useMemo(() => buildTravelers(travelerCount), [travelerCount])
  const {
    addTripExpense,
    deleteTripExpense,
    runFinanceAutomationCheck,
    setTripBudget,
    updateFinanceAutomation,
    updateFinanceSettings,
    updateTripExpense,
  } = useTripFinanceActions()

  /* ── Budget state ── */
  const [budgetTotal, setBudgetTotalState] = React.useState(String(finance.budgetTotal || ""))
  const [budgetCurrency, setBudgetCurrency] = React.useState(finance.currency || "CAD")
  const [rateDrafts, setRateDrafts] = React.useState<Record<string, string>>({})

  /* ── Hotel allocator state ── */
  const [hotelOpen, setHotelOpen] = React.useState(false)
  const [hotelTotalInput, setHotelTotalInput] = React.useState("")
  const [hotelPricingMode, setHotelPricingMode] = React.useState<HotelPricingMode>("full_booking")
  const [hotelPeopleCount, setHotelPeopleCount] = React.useState(
    finance.groupModeEnabled ? finance.groupSize : Math.max(1, trip.travelers)
  )
  const [hotelNights, setHotelNights] = React.useState(Math.max(1, trip.totalDays - 1))
  const [hotelDays, setHotelDays] = React.useState(Math.max(1, trip.totalDays))
  const [hotelSplitBy, setHotelSplitBy] = React.useState<HotelSplitBy>("nights")
  const [hotelStartDate, setHotelStartDate] = React.useState(trip.startDate)
  const [hotelError, setHotelError] = React.useState("")

  /* ── Expense form state ── */
  const [draft, setDraft] = React.useState<ExpenseDraft>(() =>
    defaultDraft(trip, finance.currency || "CAD")
  )
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState("")

  /* ── Settings / guardrails ── */
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const previousStatusRef = React.useRef<FinanceGuardrailStatus | undefined>(
    finance.automation.lastStatus
  )
  const exchangeRatesSignature = React.useMemo(
    () => JSON.stringify(finance.exchangeRates),
    [finance.exchangeRates]
  )

  /* ── Sync from store ── */
  React.useEffect(() => {
    setBudgetTotalState(String(finance.budgetTotal || ""))
    setBudgetCurrency(finance.currency || "CAD")
    setDraft((c) => ({ ...c, currency: finance.currency || "CAD" }))
  }, [finance.budgetTotal, finance.currency])

  React.useEffect(() => {
    const next: Record<string, string> = {}
    for (const [cur, rate] of Object.entries(finance.exchangeRates)) {
      next[cur] = String(rate)
    }
    setRateDrafts((prev) => {
      if (Object.keys(prev).length !== Object.keys(next).length) return next
      for (const k of Object.keys(next)) {
        if (prev[k] !== next[k]) return next
      }
      return prev
    })
  }, [exchangeRatesSignature, finance.exchangeRates])

  React.useEffect(() => {
    const prev = previousStatusRef.current
    const nextStatus = finance.automation.lastStatus
    previousStatusRef.current = nextStatus
    if (!finance.automation.showDailyPaceAlerts || !prev || !nextStatus || prev === nextStatus)
      return
    if (nextStatus === "watch") toast.warning("Budget pacing moved to Watch.")
    else if (nextStatus === "over") toast.error("Budget pacing moved to Over.")
    else toast.success("Budget pacing is back on track.")
  }, [finance.automation.lastStatus, finance.automation.showDailyPaceAlerts])

  /* ── Derived data ── */
  const sortedExpenses = React.useMemo(
    () =>
      [...finance.expenses].sort((a, b) => {
        if (a.date === b.date) return a.createdAt.localeCompare(b.createdAt)
        return a.date.localeCompare(b.date)
      }),
    [finance.expenses]
  )

  const groupedExpenses = React.useMemo(() => {
    const groups = new Map<string, TripExpense[]>()
    for (const expense of sortedExpenses) {
      const list = groups.get(expense.date) ?? []
      list.push(expense)
      groups.set(expense.date, list)
    }
    return Array.from(groups.entries())
  }, [sortedExpenses])

  const toBaseCurrency = React.useCallback(
    (expense: Pick<TripExpense, "amount" | "currency">): number => {
      const cur = (expense.currency || finance.currency).toUpperCase()
      const rate = finance.exchangeRates[cur] || 1
      return expense.amount * rate
    },
    [finance.currency, finance.exchangeRates]
  )

  const dailyCategoryTotals = React.useMemo(() => {
    return DAILY_CATEGORIES.map((cat) => {
      const spent = finance.expenses
        .filter((e) => e.category === cat.value)
        .reduce((sum, e) => sum + toBaseCurrency(e), 0)
      const share = summary.dailySpent > 0 ? Math.min(100, (spent / summary.dailySpent) * 100) : 0
      return { ...cat, spent, share }
    })
  }, [finance.expenses, summary.dailySpent, toBaseCurrency])

  const currenciesInUse = React.useMemo(() => {
    const set = new Set<string>([finance.currency.toUpperCase()])
    for (const e of finance.expenses) set.add((e.currency || finance.currency).toUpperCase())
    return Array.from(set).sort()
  }, [finance.currency, finance.expenses])

  /* ── Handlers ── */
  function resetDraft() {
    setDraft(defaultDraft(trip, finance.currency || "CAD"))
    setEditingExpenseId(null)
    setFormError("")
  }

  function buildSplits(): TripExpenseSplit[] | undefined {
    if (draft.splitMode !== "custom") return undefined
    return travelers.map((t) => ({ travelerId: t.id, amount: Number(draft.splits[t.id] ?? 0) }))
  }

  function validateExpense(): string | null {
    const amount = Number(draft.amount)
    if (!draft.date) return "Date is required."
    if (!draft.title.trim()) return "Title is required."
    if (!draft.payerName.trim()) return "Payer is required."
    if (!draft.currency.trim()) return "Currency is required."
    if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than 0."
    if (draft.splitMode === "custom") {
      const sum = travelers.reduce((t, v) => t + Number(draft.splits[v.id] ?? 0), 0)
      if (Math.abs(sum - amount) > 0.01) return "Custom split must add up to the total."
    }
    return null
  }

  function saveBudget() {
    const parsed = Number(budgetTotal)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Budget must be greater than 0.")
      return
    }
    setTripBudget(trip.id, parsed, budgetCurrency)
    toast.success("Budget saved.")
  }

  function saveExpense() {
    const validationError = validateExpense()
    if (validationError) { setFormError(validationError); return }
    const now = new Date().toISOString()
    const amount = Number(draft.amount)
    const splits = buildSplits()
    const base: TripExpense = {
      id: editingExpenseId || crypto.randomUUID(),
      tripId: trip.id,
      date: draft.date,
      title: draft.title.trim(),
      amount,
      category: draft.category,
      payerName: draft.payerName.trim(),
      currency: draft.currency.trim().toUpperCase(),
      splitMode: draft.splitMode,
      splits,
      notes: draft.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }
    if (editingExpenseId) {
      updateTripExpense(trip.id, editingExpenseId, {
        ...base,
        id: editingExpenseId,
        createdAt: finance.expenses.find((e) => e.id === editingExpenseId)?.createdAt || now,
      })
      toast.success("Expense updated.")
    } else {
      addTripExpense(trip.id, base)
      toast.success("Expense added.")
    }
    resetDraft()
  }

  function startEdit(expense: TripExpense) {
    setEditingExpenseId(expense.id)
    const splits: Record<string, string> = {}
    for (const s of expense.splits ?? []) splits[s.travelerId] = String(s.amount)
    setDraft({
      date: expense.date,
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      payerName: expense.payerName,
      currency: expense.currency,
      splitMode: expense.splitMode,
      notes: expense.notes || "",
      splits,
    })
    setAdvancedOpen(true)
    setFormError("")
  }

  function removeExpense(id: string) {
    deleteTripExpense(trip.id, id)
    toast.success("Expense deleted.")
  }

  function updateRate(currency: string, value: string) {
    setRateDrafts((c) => ({ ...c, [currency]: value }))
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return
    updateFinanceSettings(trip.id, { exchangeRates: { [currency]: n } })
  }

  function applyHotelAllocation() {
    const enteredTotal = Number(hotelTotalInput)
    if (!Number.isFinite(enteredTotal) || enteredTotal <= 0) {
      setHotelError("Enter a valid hotel price.")
      return
    }
    const peopleCount = Math.max(1, Number(hotelPeopleCount) || 1)
    const nights = Math.max(1, Number(hotelNights) || 1)
    const days = Math.max(1, Number(hotelDays) || 1)
    const splitCount = hotelSplitBy === "nights" ? nights : days
    let bookingTotal = enteredTotal
    if (hotelPricingMode === "one_person") bookingTotal = enteredTotal * Math.max(1, travelerCount)
    else if (hotelPricingMode === "x_people") bookingTotal = enteredTotal * peopleCount
    const existingAutoHotel = finance.expenses.filter(
      (e) => e.category === "hotels" && typeof e.notes === "string" && e.notes.startsWith(HOTEL_ALLOCATOR_NOTE_PREFIX)
    )
    for (const item of existingAutoHotel) deleteTripExpense(trip.id, item.id)
    const totalCents = Math.round(bookingTotal * 100)
    const baseCents = Math.floor(totalCents / splitCount)
    const remainder = totalCents - baseCents * splitCount
    const now = new Date().toISOString()
    for (let i = 0; i < splitCount; i++) {
      const cents = baseCents + (i < remainder ? 1 : 0)
      addTripExpense(trip.id, {
        id: crypto.randomUUID(),
        tripId: trip.id,
        date: addUtcDays(hotelStartDate, i),
        title: `Hotel stay ${i + 1}/${splitCount}`,
        amount: cents / 100,
        category: "hotels",
        payerName: "Hotel allocation",
        currency: budgetCurrency.toUpperCase() || finance.currency,
        splitMode: "equal",
        notes: `${HOTEL_ALLOCATOR_NOTE_PREFIX} mode=${hotelSplitBy} count=${splitCount}`,
        createdAt: now,
        updatedAt: now,
      })
    }
    setHotelError("")
    setHotelOpen(false)
    toast.success("Hotel cost split across trip days.")
  }

  /* ── Render ── */
  const noBudget = summary.budgetTotal <= 0

  return (
    <div className="space-y-6">
      {/* ── 1. Summary hero ── */}
      <SummaryHero
        summary={summary}
        guardrail={guardrail}
        noBudget={noBudget}
        groupMode={finance.groupModeEnabled}
      />

      {/* ── 2. Quick-add expense ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusIcon className="size-4" />
            {editingExpenseId ? "Edit expense" : "Add expense"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
                placeholder="Lunch, subway fare…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft((c) => ({ ...c, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v: ExpenseCategory) => setDraft((c) => ({ ...c, category: v }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((c) => ({ ...c, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Advanced fields */}
          {advancedOpen ? (
            <div className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Payer</Label>
                <Input
                  value={draft.payerName}
                  onChange={(e) => setDraft((c) => ({ ...c, payerName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input
                  value={draft.currency}
                  maxLength={3}
                  onChange={(e) => setDraft((c) => ({ ...c, currency: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Split</Label>
                <Select
                  value={draft.splitMode}
                  onValueChange={(v: SplitMode) => setDraft((c) => ({ ...c, splitMode: v }))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Optional context"
                />
              </div>
              {draft.splitMode === "custom" ? (
                <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
                  {travelers.map((t) => (
                    <div key={t.id} className="space-y-1">
                      <Label className="text-xs">{t.label}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.splits[t.id] ?? ""}
                        onChange={(e) =>
                          setDraft((c) => ({ ...c, splits: { ...c.splits, [t.id]: e.target.value } }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveExpense}>
              {editingExpenseId ? "Update" : "Add"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdvancedOpen((p) => !p)}>
              {advancedOpen ? "Hide details" : "More details"}
              <ChevronDownIcon className={`ml-1 size-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </Button>
            {editingExpenseId ? (
              <Button variant="ghost" size="sm" onClick={resetDraft}>Cancel</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Expense list ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Expenses</h2>
        {groupedExpenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Add your first expense above to start tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedExpenses.map(([date, expenses]) => {
              const subtotal = expenses.reduce((s, e) => s + toBaseCurrency(e), 0)
              return (
                <div key={date} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatDateLabel(date)}
                    </h3>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatMoney(subtotal, finance.currency)}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">{expense.title}</p>
                            <p className="shrink-0 text-sm font-semibold tabular-nums">
                              {formatMoney(expense.amount, expense.currency || finance.currency)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabel(expense.category)}
                            </Badge>
                            {isFixedCost(expense) ? (
                              <Badge variant="secondary" className="text-[10px]">Fixed</Badge>
                            ) : null}
                            <span className="text-[11px] text-muted-foreground">{expense.payerName}</span>
                          </div>
                          {expense.notes ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">{expense.notes}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(expense)}>
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => removeExpense(expense.id)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 4. Category breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Where it goes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.fixedCostsSpent > 0 ? (
            <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Fixed costs (flights + hotels)</span>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(summary.fixedCostsSpent, finance.currency)}</span>
            </div>
          ) : null}
          <div className="space-y-3">
            {dailyCategoryTotals.map((row) => (
              <div key={row.value} className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(row.spent, finance.currency)}</span>
                </div>
                <Progress value={row.share} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Settings ── */}
      <div className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide"
          onClick={() => setSettingsOpen((p) => !p)}
        >
          <Settings2Icon className="size-3.5" />
          Settings
          <ChevronDownIcon className={`ml-auto size-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
        </button>

        {settingsOpen ? (
          <div className="space-y-4">
            {/* Budget */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Total budget</Label>
                    <Input
                      type="number"
                      min="0"
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotalState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Input
                      value={budgetCurrency}
                      maxLength={3}
                      onChange={(e) => setBudgetCurrency(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Group mode</p>
                    <p className="text-xs text-muted-foreground">Split per-person costs</p>
                  </div>
                  <Switch
                    checked={finance.groupModeEnabled}
                    onCheckedChange={(checked) => updateFinanceSettings(trip.id, { groupModeEnabled: checked })}
                  />
                </div>
                {finance.groupModeEnabled ? (
                  <div className="space-y-1.5">
                    <Label>Group size</Label>
                    <Input
                      type="number"
                      min="1"
                      value={finance.groupSize}
                      onChange={(e) => updateFinanceSettings(trip.id, { groupSize: Number(e.target.value || 1) })}
                    />
                  </div>
                ) : null}
                {currenciesInUse.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Conversion rates to {budgetCurrency || "CAD"}
                    </p>
                    {currenciesInUse.map((cur) => {
                      const isBase = cur === (budgetCurrency || "CAD").toUpperCase()
                      return (
                        <div key={cur} className="grid grid-cols-[4rem_1fr] items-center gap-2">
                          <span className="text-xs font-medium">{cur}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.0001"
                            disabled={isBase}
                            value={isBase ? "1" : rateDrafts[cur] ?? String(finance.exchangeRates[cur] || "")}
                            onChange={(e) => updateRate(cur, e.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : null}
                <Button className="w-full" onClick={saveBudget}>
                  <SaveIcon className="size-4" /> Save budget
                </Button>
              </CardContent>
            </Card>

            {/* Guardrails */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Guardrails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Enable guardrails</p>
                  <Switch
                    checked={finance.automation.enabled}
                    onCheckedChange={(checked) => {
                      updateFinanceAutomation(trip.id, { enabled: checked })
                      toast.success(checked ? "Guardrails enabled." : "Guardrails disabled.")
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Warn at %</Label>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={finance.automation.warnAtPercent}
                      onChange={(e) => updateFinanceAutomation(trip.id, { warnAtPercent: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Critical at %</Label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={finance.automation.criticalAtPercent}
                      onChange={(e) => updateFinanceAutomation(trip.id, { criticalAtPercent: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Daily pace alerts</p>
                  <Switch
                    checked={finance.automation.showDailyPaceAlerts}
                    onCheckedChange={(checked) => updateFinanceAutomation(trip.id, { showDailyPaceAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Cutback suggestions</p>
                  <Switch
                    checked={finance.automation.suggestCutbackCategories}
                    onCheckedChange={(checked) => updateFinanceAutomation(trip.id, { suggestCutbackCategories: checked })}
                  />
                </div>
                {guardrail.suggestions.length > 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <ul className="space-y-1">
                      {guardrail.suggestions.slice(0, 3).map((line) => (
                        <li key={line}>• {line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { runFinanceAutomationCheck(trip.id); toast.success("Check completed.") }}
                >
                  Run check now
                </Button>
              </CardContent>
            </Card>

            {/* Hotel allocator */}
            <Card>
              <CardHeader className="pb-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() => setHotelOpen((p) => !p)}
                >
                  <CardTitle className="text-base">Hotel cost split</CardTitle>
                  <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform ${hotelOpen ? "rotate-180" : ""}`} />
                </button>
              </CardHeader>
              {hotelOpen ? (
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Full stay price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hotelTotalInput}
                      onChange={(e) => setHotelTotalInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price is for</Label>
                    <Select value={hotelPricingMode} onValueChange={(v: HotelPricingMode) => setHotelPricingMode(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_person">One person</SelectItem>
                        <SelectItem value="x_people">X people</SelectItem>
                        <SelectItem value="full_booking">Entire booking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hotelPricingMode === "x_people" ? (
                    <div className="space-y-1.5">
                      <Label>People count</Label>
                      <Input type="number" min="1" value={hotelPeopleCount} onChange={(e) => setHotelPeopleCount(Number(e.target.value || 1))} />
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nights</Label>
                      <Input type="number" min="1" value={hotelNights} onChange={(e) => setHotelNights(Number(e.target.value || 1))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Days</Label>
                      <Input type="number" min="1" value={hotelDays} onChange={(e) => setHotelDays(Number(e.target.value || 1))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Split across</Label>
                    <Select value={hotelSplitBy} onValueChange={(v: HotelSplitBy) => setHotelSplitBy(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nights">Nights</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Start date</Label>
                    <Input type="date" value={hotelStartDate} onChange={(e) => setHotelStartDate(e.target.value)} />
                  </div>
                  {hotelError ? <p className="text-xs text-destructive">{hotelError}</p> : null}
                  <Button className="w-full" onClick={applyHotelAllocation}>
                    Apply hotel split
                  </Button>
                </CardContent>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ── Summary hero ── */

function SummaryHero({
  summary,
  guardrail,
  noBudget,
  groupMode,
}: {
  summary: FinanceSummary
  guardrail: ReturnType<typeof runFinanceGuardrails>
  noBudget: boolean
  groupMode: boolean
}) {
  if (noBudget) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold">Set your trip budget</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open Settings below to set a total budget and start tracking.
          </p>
        </CardContent>
      </Card>
    )
  }

  const remainingColor =
    summary.remaining < 0
      ? "text-red-600 dark:text-red-400"
      : summary.spentPercent > 80
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground"

  const paceColor =
    guardrail.status === "over"
      ? "text-red-600 dark:text-red-400"
      : guardrail.status === "watch"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400"

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* Top row: remaining + badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Remaining
            </p>
            <p className={`text-3xl font-bold tabular-nums tracking-tight ${remainingColor}`}>
              {formatMoney(summary.remaining, summary.currency)}
            </p>
          </div>
          <Badge className={`${STATUS_CLASSES[guardrail.status]} shrink-0`}>
            {guardrail.status === "over" ? (
              <AlertTriangleIcon className="mr-1 size-3" />
            ) : (
              <CheckCircle2Icon className="mr-1 size-3" />
            )}
            {STATUS_LABEL[guardrail.status]}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={summary.spentPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatMoney(summary.spent, summary.currency)} spent</span>
            <span>{formatMoney(summary.budgetTotal, summary.currency)} total</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
          <Stat
            label="Daily pace"
            value={formatMoney(summary.dailyActualPace, summary.currency)}
            sub={`of ${formatMoney(summary.dailyPlannedBudget, summary.currency)}/day`}
            className={paceColor}
          />
          <Stat
            label="Fixed costs"
            value={formatMoney(summary.fixedCostsSpent, summary.currency)}
            sub="flights + hotels"
          />
          {groupMode ? (
            <Stat
              label="Per person"
              value={formatMoney(summary.perPersonEstimate, summary.currency)}
              sub="total so far"
            />
          ) : (
            <Stat
              label="Expenses"
              value={String(summary.expenseCount)}
              sub={`across ${summary.totalTripDays} days`}
            />
          )}
        </div>

        {summary.missingRateCurrencies.length > 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Missing rate for {summary.missingRateCurrencies.join(", ")} — totals use 1:1 until set.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  sub,
  className = "",
}: {
  label: string
  value: string
  sub: string
  className?: string
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums leading-tight ${className}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}
