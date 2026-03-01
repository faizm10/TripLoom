"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"

export type DestinationSuggestion = {
  id: string
  name: string
  displayName: string
  type: "city" | "airport"
  iataCode: string | null
  cityName: string | null
  countryCode: string | null
}

const DEBOUNCE_MS = 280
const MIN_QUERY_LENGTH = 2

async function searchDestinations(
  query: string,
  options?: { airportsOnly?: boolean }
): Promise<DestinationSuggestion[]> {
  const params = new URLSearchParams({ q: query })
  if (options?.airportsOnly) params.set("airports_only", "1")
  const res = await fetch(`/api/destinations/search?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? "Search failed")
  return json?.data ?? []
}

export function DestinationSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Where do you want to go?",
  className,
  airportsOnly = false,
  ...inputProps
}: {
  value?: string
  onChange?: (value: string) => void
  onSelect?: (suggestion: DestinationSuggestion) => void
  placeholder?: string
  className?: string
  /** When true, only airport suggestions are returned (for flight from/to). */
  airportsOnly?: boolean
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onSelect">) {
  const [inputValue, setInputValue] = useState(value ?? "")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DestinationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const syncFromProp = value !== undefined && value !== inputValue
  useEffect(() => {
    if (syncFromProp) setInputValue(value)
  }, [value, syncFromProp])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const raw = inputValue.trim()
    if (raw.length < MIN_QUERY_LENGTH) {
      setQuery("")
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      setQuery(raw)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue])

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const data = await searchDestinations(q, { airportsOnly })
        setResults(data)
        setHighlightIndex(0)
        setOpen(true)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    },
    [airportsOnly]
  )

  useEffect(() => {
    if (!query) return
    runSearch(query)
  }, [query, runSearch])

  const select = useCallback(
    (suggestion: DestinationSuggestion) => {
      const display = suggestion.displayName
      setInputValue(display)
      onChange?.(display)
      onSelect?.(suggestion)
      setOpen(false)
      setResults([])
    },
    [onChange, onSelect]
  )

  const showPopover = open && (loading || results.length > 0 || query.length >= MIN_QUERY_LENGTH)
  const list = results
  const canSelect = list.length > 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPopover || !canSelect) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % list.length)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((i) => (i - 1 + list.length) % list.length)
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const item = list[highlightIndex]
      if (item) select(item)
      return
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!listRef.current || !canSelect) return
    const el = listRef.current.querySelector(
      `[data-index="${highlightIndex}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex, canSelect])

  return (
    <Popover open={showPopover} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPopover}
          aria-autocomplete="list"
          aria-controls="destination-search-list"
          aria-activedescendant={
            canSelect ? `destination-option-${highlightIndex}` : undefined
          }
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            onChange?.(e.target.value)
          }}
          onFocus={() => {
            if (query && results.length > 0) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("w-full", className)}
          id={inputProps.id}
          disabled={inputProps.disabled}
        />
      </PopoverAnchor>
      <PopoverContent
        id="destination-search-list"
        role="listbox"
        className="w-(--radix-popover-trigger-width) max-h-64 overflow-auto p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="text-muted-foreground py-4 text-center text-xs">
            Searching…
          </div>
        ) : list.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center text-xs">
            No destinations found. Try a city or airport name.
          </div>
        ) : (
          <div ref={listRef} className="py-1">
            {list.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                id={`destination-option-${index}`}
                data-index={index}
                aria-selected={index === highlightIndex}
                className={cn(
                  "text-left w-full px-3 py-2 text-xs outline-none cursor-pointer",
                  index === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/70"
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => select(suggestion)}
              >
                <span className="font-medium">{suggestion.displayName}</span>
                {suggestion.type === "airport" && suggestion.cityName && (
                  <span className="text-muted-foreground block text-[11px]">
                    {suggestion.cityName}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
