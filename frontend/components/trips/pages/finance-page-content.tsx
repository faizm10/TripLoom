"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  SaveIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { useTripFinanceActions } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type {
  ExpenseCategory,
  FinanceGuardrailStatus,
  SplitMode,
  Trip,
  TripExpense,
  TripExpenseSplit,
} from "@/lib/trips"
import { getFinanceSummary, getTripFinance, runFinanceGuardrails } from "@/lib/trips"

const majorExpenseCategories: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "flights", label: "Flights" },
  { value: "hotels", label: "Hotels" },
  { value: "transit", label: "Transit" },
  { value: "food", label: "Food (Estimated)" },
  { value: "activities", label: "Activities" },
]

const statusTone: Record<FinanceGuardrailStatus, string> = {
  on_track: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20",
  watch: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  over: "bg-red-600/10 text-red-700 border-red-600/20",
}

const statusLabel: Record<FinanceGuardrailStatus, string> = {
  on_track: "On Track",
  watch: "Watch",
  over: "Over",
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

function formatDateLabel(date: string): string {
  if (!date) return "Date TBD"
  const [year, month, day] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt)
}

function formatDateShort(date: string): string {
  if (!date) return "TBD"
  const [year, month, day] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt)
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
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

export function FinancePageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp
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

  const [budgetTotal, setBudgetTotalState] = React.useState(String(finance.budgetTotal || ""))
  const [budgetCurrency, setBudgetCurrency] = React.useState(finance.currency || "CAD")
  const [budgetBuffer, setBudgetBuffer] = React.useState("10")
  const [rateDrafts, setRateDrafts] = React.useState<Record<string, string>>({})
  const [hotelPopoverOpen, setHotelPopoverOpen] = React.useState(
    !finance.expenses.some((expense) => expense.category === "hotels")
  )
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
  const [draft, setDraft] = React.useState<ExpenseDraft>(() =>
    defaultDraft(trip, finance.currency || "CAD")
  )
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState("")
  const previousStatusRef = React.useRef<FinanceGuardrailStatus | undefined>(
    finance.automation.lastStatus
  )
  const exchangeRatesSignature = React.useMemo(
    () => JSON.stringify(finance.exchangeRates),
    [finance.exchangeRates]
  )

  React.useEffect(() => {
    setBudgetTotalState(String(finance.budgetTotal || ""))
    setBudgetCurrency(finance.currency || "CAD")
    setDraft((current) => ({
      ...current,
      currency: finance.currency || "CAD",
    }))
  }, [finance.budgetTotal, finance.currency])

  React.useEffect(() => {
    const nextRates: Record<string, string> = {}
    for (const [currency, rate] of Object.entries(finance.exchangeRates)) {
      nextRates[currency] = String(rate)
    }
    setRateDrafts((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(nextRates)
      if (prevKeys.length !== nextKeys.length) return nextRates
      for (const key of nextKeys) {
        if (prev[key] !== nextRates[key]) return nextRates
      }
      return prev
    })
  }, [exchangeRatesSignature, finance.exchangeRates])

  React.useEffect(() => {
    const prev = previousStatusRef.current
    const next = finance.automation.lastStatus
    previousStatusRef.current = next
    if (!finance.automation.showDailyPaceAlerts || !prev || !next || prev === next) return
    if (next === "watch") {
      toast.warning("Budget pacing moved to Watch.")
      return
    }
    if (next === "over") {
      toast.error("Budget pacing moved to Over.")
      return
    }
    toast.success("Budget pacing is back on track.")
  }, [finance.automation.lastStatus, finance.automation.showDailyPaceAlerts])

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

  const hasHotelExpense = React.useMemo(
    () => finance.expenses.some((expense) => expense.category === "hotels"),
    [finance.expenses]
  )

  const toBaseCurrency = React.useCallback(
    (expense: Pick<TripExpense, "amount" | "currency">): number => {
      const expenseCurrency = (expense.currency || finance.currency).toUpperCase()
      const rate = finance.exchangeRates[expenseCurrency] || 1
      return expense.amount * rate
    },
    [finance.currency, finance.exchangeRates]
  )

  const majorCategoryTotals = React.useMemo(() => {
    return majorExpenseCategories.map((category) => {
      const spent = finance.expenses
        .filter((expense) => expense.category === category.value)
        .reduce((sum, expense) => sum + toBaseCurrency(expense), 0)
      const share = summary.budgetTotal > 0 ? Math.min(100, (spent / summary.budgetTotal) * 100) : 0
      return { ...category, spent, share }
    })
  }, [finance.expenses, summary.budgetTotal, toBaseCurrency])

  const currenciesInUse = React.useMemo(() => {
    const set = new Set<string>([finance.currency.toUpperCase()])
    for (const expense of finance.expenses) {
      set.add((expense.currency || finance.currency).toUpperCase())
    }
    return Array.from(set).sort()
  }, [finance.currency, finance.expenses])

  function resetDraft() {
    setDraft(defaultDraft(trip, finance.currency || "CAD"))
    setEditingExpenseId(null)
    setFormError("")
  }

  function buildSplits(): TripExpenseSplit[] | undefined {
    if (draft.splitMode !== "custom") return undefined
    return travelers.map((traveler) => ({
      travelerId: traveler.id,
      amount: Number(draft.splits[traveler.id] ?? 0),
    }))
  }

  function validateExpense(): string | null {
    const amount = Number(draft.amount)
    if (!draft.date) return "Expense date is required."
    if (!draft.title.trim()) return "Expense title is required."
    if (!draft.payerName.trim()) return "Payer name is required."
    if (!draft.currency.trim()) return "Currency is required."
    if (!Number.isFinite(amount) || amount <= 0) return "Amount must be greater than 0."
    if (draft.splitMode === "custom") {
      const sum = travelers.reduce(
        (total, traveler) => total + Number(draft.splits[traveler.id] ?? 0),
        0
      )
      if (Math.abs(sum - amount) > 0.01) {
        return "Custom split must add up to the expense total."
      }
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
    if (validationError) {
      setFormError(validationError)
      return
    }
    const now = new Date().toISOString()
    const amount = Number(draft.amount)
    const splits = buildSplits()
    const baseExpense: TripExpense = {
      id:
        editingExpenseId ||
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
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
        ...baseExpense,
        id: editingExpenseId,
        createdAt: finance.expenses.find((item) => item.id === editingExpenseId)?.createdAt || now,
      })
      toast.success("Expense updated.")
    } else {
      addTripExpense(trip.id, baseExpense)
      toast.success("Expense saved.")
    }
    resetDraft()
  }

  function startEdit(expense: TripExpense) {
    setEditingExpenseId(expense.id)
    const splits: Record<string, string> = {}
    for (const split of expense.splits ?? []) {
      splits[split.travelerId] = String(split.amount)
    }
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

  function removeExpense(expenseId: string) {
    deleteTripExpense(trip.id, expenseId)
    toast.success("Expense deleted.")
  }

  function toggleAutomation(enabled: boolean) {
    updateFinanceAutomation(trip.id, { enabled })
    toast.success(enabled ? "Automation enabled." : "Automation disabled.")
  }

  function toggleGroupMode(enabled: boolean) {
    updateFinanceSettings(trip.id, { groupModeEnabled: enabled })
    toast.success(enabled ? "Group mode enabled." : "Group mode disabled.")
  }

  function runAutomationNow() {
    runFinanceAutomationCheck(trip.id)
    toast.success("Guardrail check completed.")
  }

  function updateRate(currency: string, value: string) {
    setRateDrafts((current) => ({ ...current, [currency]: value }))
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) return
    updateFinanceSettings(trip.id, {
      exchangeRates: {
        [currency]: numeric,
      },
    })
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
    if (hotelPricingMode === "one_person") {
      bookingTotal = enteredTotal * Math.max(1, travelerCount)
    } else if (hotelPricingMode === "x_people") {
      bookingTotal = enteredTotal * peopleCount
    }

    const existingAutoHotel = finance.expenses.filter(
      (expense) =>
        expense.category === "hotels" &&
        typeof expense.notes === "string" &&
        expense.notes.startsWith(HOTEL_ALLOCATOR_NOTE_PREFIX)
    )
    for (const item of existingAutoHotel) {
      deleteTripExpense(trip.id, item.id)
    }

    const totalCents = Math.round(bookingTotal * 100)
    const baseCents = Math.floor(totalCents / splitCount)
    const remainder = totalCents - baseCents * splitCount
    const now = new Date().toISOString()

    for (let index = 0; index < splitCount; index++) {
      const cents = baseCents + (index < remainder ? 1 : 0)
      const amount = cents / 100
      addTripExpense(trip.id, {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        tripId: trip.id,
        date: addUtcDays(hotelStartDate, index),
        title: `Hotel stay ${index + 1}/${splitCount}`,
        amount,
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
    setHotelPopoverOpen(false)
    toast.success("Hotel cost split across trip days.")
  }

  const paceTone =
    guardrail.status === "on_track"
      ? "text-emerald-600"
      : guardrail.status === "watch"
        ? "text-amber-600"
        : "text-red-600"

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Where you stand</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Budget</CardDescription>
              <CardTitle className="text-lg">{formatMoney(summary.budgetTotal, finance.currency)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Spent</CardDescription>
              <CardTitle className="text-lg">{formatMoney(summary.spent, finance.currency)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Remaining</CardDescription>
              <CardTitle className={`text-lg ${summary.remaining < 0 ? "text-red-600" : ""}`}>
                {formatMoney(summary.remaining, finance.currency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Daily Pace</CardDescription>
              <CardTitle className={`text-lg ${paceTone}`}>
                {formatMoney(summary.actualDaily, finance.currency)}/day
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Planned {formatMoney(summary.plannedDaily, finance.currency)}/day
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Per Person</CardDescription>
              <CardTitle className="text-lg">
                {formatMoney(summary.perPersonEstimate, finance.currency)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        {summary.missingRateCurrencies.length > 0 ? (
          <div className="rounded-none border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-700">
            Missing conversion rate for: {summary.missingRateCurrencies.join(", ")}. Totals use 1:1 until set.
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Major expenses</h2>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[180px]">Budget share</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {majorCategoryTotals.map((row) => (
                  <TableRow key={row.value}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-none">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMoney(row.spent, finance.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Control budget</h2>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 pt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-none">
                  <Settings2Icon /> Budget Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[22rem] max-w-[92vw]">
                <PopoverHeader>
                  <PopoverTitle>Budget Settings</PopoverTitle>
                  <PopoverDescription>Budget, currency, and group.</PopoverDescription>
                </PopoverHeader>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Total budget</label>
                  <Input
                    type="number"
                    min="0"
                    value={budgetTotal}
                    onChange={(event) => setBudgetTotalState(event.target.value)}
                  />
                  <label className="text-xs font-medium">Currency</label>
                  <Input
                    value={budgetCurrency}
                    maxLength={3}
                    onChange={(event) => setBudgetCurrency(event.target.value.toUpperCase())}
                  />
                  <p className="text-[11px] text-muted-foreground">Base currency for totals and guardrails.</p>
                  <label className="text-xs font-medium">Buffer %</label>
                  <Input
                    type="number"
                    min="0"
                    value={budgetBuffer}
                    onChange={(event) => setBudgetBuffer(event.target.value)}
                  />
                  <div className="grid gap-2 rounded-none border p-2">
                    <label className="flex items-center justify-between text-xs font-medium">
                      Group mode
                      <Switch
                        checked={finance.groupModeEnabled}
                        onCheckedChange={toggleGroupMode}
                      />
                    </label>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Group size</label>
                      <Input
                        type="number"
                        min="1"
                        value={finance.groupSize}
                        disabled={!finance.groupModeEnabled}
                        onChange={(event) =>
                          updateFinanceSettings(trip.id, {
                            groupSize: Number(event.target.value || 1),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-none border p-2">
                    <p className="text-xs font-medium">Conversion rates to {budgetCurrency || "CAD"}</p>
                    {currenciesInUse.map((currency) => {
                      const isBase = currency === (budgetCurrency || "CAD").toUpperCase()
                      return (
                        <div key={currency} className="grid grid-cols-[64px_1fr] items-center gap-2">
                          <span className="text-xs font-medium">{currency}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.0001"
                            disabled={isBase}
                            value={isBase ? "1" : rateDrafts[currency] ?? String(finance.exchangeRates[currency] || "")}
                            onChange={(event) => updateRate(currency, event.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <Button className="w-full rounded-none" onClick={saveBudget}>
                    <SaveIcon /> Save Budget
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-none">
                  <SparklesIcon /> Guardrails
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[22rem] max-w-[92vw]">
                <PopoverHeader>
                  <PopoverTitle>Automation Guardrails</PopoverTitle>
                  <PopoverDescription>Pace checks and alerts.</PopoverDescription>
                </PopoverHeader>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-medium">
                    Enable guardrails
                    <Switch
                      checked={finance.automation.enabled}
                      onCheckedChange={toggleAutomation}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Warn %</label>
                      <Input
                        type="number"
                        min="1"
                        max="200"
                        value={finance.automation.warnAtPercent}
                        onChange={(event) =>
                          updateFinanceAutomation(trip.id, {
                            warnAtPercent: Number(event.target.value || 0),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Critical %</label>
                      <Input
                        type="number"
                        min="1"
                        max="300"
                        value={finance.automation.criticalAtPercent}
                        onChange={(event) =>
                          updateFinanceAutomation(trip.id, {
                            criticalAtPercent: Number(event.target.value || 0),
                          })
                        }
                      />
                    </div>
                  </div>
                  <label className="flex items-center justify-between text-xs font-medium">
                    Daily pace alerts
                    <Switch
                      checked={finance.automation.showDailyPaceAlerts}
                      onCheckedChange={(checked) =>
                        updateFinanceAutomation(trip.id, { showDailyPaceAlerts: checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium">
                    Cutback suggestions
                    <Switch
                      checked={finance.automation.suggestCutbackCategories}
                      onCheckedChange={(checked) =>
                        updateFinanceAutomation(trip.id, { suggestCutbackCategories: checked })
                      }
                    />
                  </label>
                  <div className="rounded-none border p-2 text-xs text-muted-foreground">
                    {guardrail.projectedExceedDay
                      ? `May exceed by Day ${guardrail.projectedExceedDay}.`
                      : "Pace is within budget range."}
                  </div>
                  <Button variant="outline" className="w-full rounded-none" onClick={runAutomationNow}>
                    <SparklesIcon /> Run Check Now
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={hotelPopoverOpen} onOpenChange={setHotelPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-none">
                  Hotel Split
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[24rem] max-w-[92vw]">
                <PopoverHeader>
                  <PopoverTitle>Hotel Cost Allocator</PopoverTitle>
                  <PopoverDescription>Enter full stay cost, people, and split range.</PopoverDescription>
                </PopoverHeader>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Full stay price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hotelTotalInput}
                    onChange={(event) => setHotelTotalInput(event.target.value)}
                  />

                  <label className="text-xs font-medium">Price entered for</label>
                  <Select
                    value={hotelPricingMode}
                    onValueChange={(value: HotelPricingMode) => setHotelPricingMode(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_person">One person</SelectItem>
                      <SelectItem value="x_people">X people</SelectItem>
                      <SelectItem value="full_booking">Entire booking total</SelectItem>
                    </SelectContent>
                  </Select>

                  {hotelPricingMode === "x_people" ? (
                    <>
                      <label className="text-xs font-medium">People count</label>
                      <Input
                        type="number"
                        min="1"
                        value={hotelPeopleCount}
                        onChange={(event) => setHotelPeopleCount(Number(event.target.value || 1))}
                      />
                    </>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nights</label>
                      <Input
                        type="number"
                        min="1"
                        value={hotelNights}
                        onChange={(event) => setHotelNights(Number(event.target.value || 1))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Days</label>
                      <Input
                        type="number"
                        min="1"
                        value={hotelDays}
                        onChange={(event) => setHotelDays(Number(event.target.value || 1))}
                      />
                    </div>
                  </div>

                  <label className="text-xs font-medium">Split across</label>
                  <Select
                    value={hotelSplitBy}
                    onValueChange={(value: HotelSplitBy) => setHotelSplitBy(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nights">Nights</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>

                  <label className="text-xs font-medium">Start date</label>
                  <Input
                    type="date"
                    value={hotelStartDate}
                    onChange={(event) => setHotelStartDate(event.target.value)}
                  />

                  {hotelError ? <p className="text-xs text-red-600">{hotelError}</p> : null}
                  <Button className="w-full rounded-none" onClick={applyHotelAllocation}>
                    Apply hotel split
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {!hasHotelExpense ? (
              <p className="w-full text-xs text-muted-foreground">
                Add hotel split first: nights, days, and people.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Track spend</h2>
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Expense Ledger</CardTitle>
                <CardDescription>Quick add with optional advanced fields.</CardDescription>
              </div>
              <Badge className={`rounded-none border ${statusTone[guardrail.status]}`}>
                {statusLabel[guardrail.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-none border p-3 text-xs ${statusTone[guardrail.status]}`}>
              <div className="flex items-center gap-2 font-medium">
                {guardrail.status === "over" ? <AlertTriangleIcon className="size-4" /> : <CheckCircle2Icon className="size-4" />}
                Guardrail Insights
              </div>
              <ul className="mt-2 space-y-1">
                {guardrail.suggestions.slice(0, 3).map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-none border p-3">
              <div className="grid gap-2 md:grid-cols-10">
                <Input
                  className="md:col-span-2"
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                />
                <Input
                  className="md:col-span-3"
                  placeholder="Expense title"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                />
                <Input
                  className="md:col-span-2"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={draft.amount}
                  onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                />
                <Select
                  value={draft.category}
                  onValueChange={(value: ExpenseCategory) =>
                    setDraft((current) => ({ ...current, category: value }))
                  }
                >
                  <SelectTrigger className="w-full md:col-span-2">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {majorExpenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="md:col-span-1">
                  <Button className="w-full rounded-none" onClick={saveExpense}>
                    {editingExpenseId ? "Update" : "Save"}
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                  onClick={() => setAdvancedOpen((prev) => !prev)}
                >
                  {advancedOpen ? "Hide advanced" : "Advanced fields"}
                </Button>
                {editingExpenseId ? (
                  <Button variant="ghost" size="sm" className="rounded-none" onClick={resetDraft}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>

              {advancedOpen ? (
                <div className="mt-3 grid gap-3 rounded-none border p-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Payer</label>
                    <Input
                      value={draft.payerName}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, payerName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Currency</label>
                    <Input
                      value={draft.currency}
                      maxLength={3}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          currency: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Split mode</label>
                    <Select
                      value={draft.splitMode}
                      onValueChange={(value: SplitMode) =>
                        setDraft((current) => ({ ...current, splitMode: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Equal split</SelectItem>
                        <SelectItem value="custom">Custom split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium">Notes</label>
                    <Textarea
                      rows={2}
                      value={draft.notes}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional notes for context"
                    />
                  </div>

                  {draft.splitMode === "custom" ? (
                    <div className="md:col-span-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {travelers.map((traveler) => (
                        <div key={traveler.id} className="space-y-1">
                          <label className="text-xs font-medium">{traveler.label}</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.splits[traveler.id] ?? ""}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                splits: {
                                  ...current.splits,
                                  [traveler.id]: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {formError ? <p className="mt-2 text-xs text-red-600">{formError}</p> : null}
            </div>

            {groupedExpenses.length === 0 ? (
              <div className="rounded-none border border-dashed p-6 text-center text-sm text-muted-foreground">
                No expenses saved yet. Add your first expense to activate full finance tracking.
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Split</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedExpenses.map(([date, expenses]) => {
                    const subtotal = expenses.reduce((sum, item) => sum + toBaseCurrency(item), 0)
                    return (
                      <React.Fragment key={date}>
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={8} className="text-xs font-medium">
                            {formatDateLabel(date)} • Day subtotal {formatMoney(subtotal, finance.currency)}
                          </TableCell>
                        </TableRow>
                        {expenses.map((expense) => {
                          const impact =
                            expense.category !== "flights" &&
                            summary.plannedDaily > 0 &&
                            expense.amount > summary.plannedDaily
                          return (
                            <TableRow key={expense.id}>
                              <TableCell>{formatDateShort(expense.date)}</TableCell>
                              <TableCell>{expense.title}</TableCell>
                              <TableCell>
                                {majorExpenseCategories.find((item) => item.value === expense.category)?.label ||
                                  expense.category}
                              </TableCell>
                              <TableCell>{expense.payerName}</TableCell>
                              <TableCell>
                                {expense.splitMode === "equal"
                                  ? "Equal"
                                  : `Custom (${expense.splits?.length || 0})`}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`rounded-none ${impact ? "border-red-500/30 text-red-700" : ""}`}
                                >
                                  {impact ? "High-impact" : "Normal"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatMoney(expense.amount, expense.currency || finance.currency)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-none"
                                    onClick={() => startEdit(expense)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-none text-red-700"
                                    onClick={() => removeExpense(expense.id)}
                                  >
                                    <Trash2Icon />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
