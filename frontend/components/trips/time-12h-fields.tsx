"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  coerceToCanonicalTime12h,
  formatCanonicalTime12h,
  parseFlexibleTime12h,
  type Time12hParts,
} from "@/lib/time-12h"

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

type Meridiem = "AM" | "PM"

function partsFromValue(value: string): {
  hour: number | ""
  minute: string
  meridiem: Meridiem | ""
} {
  const p = parseFlexibleTime12h(value)
  if (!p) {
    return { hour: "", minute: "", meridiem: "" }
  }
  return {
    hour: p.hour,
    minute: String(p.minute).padStart(2, "0"),
    meridiem: p.meridiem,
  }
}

function emitIfComplete(
  hour: number | "",
  minute: string,
  meridiem: Meridiem | ""
): string {
  if (hour === "" || minute === "" || meridiem === "") return ""
  const parts: Time12hParts = {
    hour: hour as number,
    minute: parseInt(minute, 10),
    meridiem,
  }
  return formatCanonicalTime12h(parts)
}

export function Time12hFields({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (canonicalOrEmpty: string) => void
  disabled?: boolean
  className?: string
}) {
  const [hour, setHour] = React.useState<number | "">("")
  const [minute, setMinute] = React.useState("")
  const [meridiem, setMeridiem] = React.useState<Meridiem | "">("")

  React.useEffect(() => {
    const next = partsFromValue(coerceToCanonicalTime12h(value))
    setHour(next.hour)
    setMinute(next.minute)
    setMeridiem(next.meridiem)
  }, [value])

  const push = (nextHour: number | "", nextMinute: string, nextMer: Meridiem | "") => {
    setHour(nextHour)
    setMinute(nextMinute)
    setMeridiem(nextMer)
    onChange(emitIfComplete(nextHour, nextMinute, nextMer))
  }

  const selectClass =
    "border-input bg-background h-10 rounded-md border px-2 text-sm disabled:opacity-50"

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`${id}-hour`} className="text-sm font-medium">
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">
        12-hour time, saved as <span className="font-mono">hh:mm AM|PM</span> (e.g.{" "}
        <span className="font-mono">06:40 PM</span>).
      </p>
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label={label}
      >
        <select
          id={`${id}-hour`}
          aria-label={`${label} hour`}
          disabled={disabled}
          className={cn(selectClass, "min-w-[4.25rem]")}
          value={hour === "" ? "" : String(hour)}
          onChange={(e) => {
            const v = e.target.value
            const h = v === "" ? "" : parseInt(v, 10)
            push(h, minute, meridiem)
          }}
        >
          <option value="">—</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground text-sm" aria-hidden>
          :
        </span>
        <select
          id={`${id}-minute`}
          aria-label={`${label} minute`}
          disabled={disabled}
          className={cn(selectClass, "min-w-[4.25rem]")}
          value={minute}
          onChange={(e) => {
            push(hour, e.target.value, meridiem)
          }}
        >
          <option value="">—</option>
          {MINUTES.map((mm) => (
            <option key={mm} value={mm}>
              {mm}
            </option>
          ))}
        </select>
        <select
          id={`${id}-meridiem`}
          aria-label={`${label} AM or PM`}
          disabled={disabled}
          className={cn(selectClass, "min-w-[5.5rem]")}
          value={meridiem}
          onChange={(e) => {
            const v = e.target.value as Meridiem | ""
            push(hour, minute, v)
          }}
        >
          <option value="">—</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}
