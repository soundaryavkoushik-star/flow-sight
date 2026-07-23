"use client"

import { useState } from "react"
import Link from "next/link"
import { MONEY_IN_CATEGORIES, SPENDING_CATEGORIES, TRANSACTION_CATEGORIES } from "@/lib/analytics/categories"

export function TransactionFilters({ query, type, category }: { query?: string; type?: string; category?: string }) {
  const [direction, setDirection] = useState(type ?? "")
  const options = direction === "money_out"
    ? SPENDING_CATEGORIES
    : direction === "money_in"
      ? MONEY_IN_CATEGORIES
      : TRANSACTION_CATEGORIES
  const selectedCategory = options.some((option) => option.name === category) ? category : ""

  return <form className="flex flex-wrap items-center gap-2 mb-5" action="/app/transactions">
    <input name="q" defaultValue={query} placeholder="Search descriptions" className="h-9 min-w-[220px] flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
    <select name="type" value={direction} onChange={(event) => setDirection(event.target.value)} className="h-9 w-auto max-w-full rounded-lg border border-input bg-background px-3 text-sm">
      <option value="">All directions</option>
      <option value="money_out">Money out</option>
      <option value="money_in">Money in</option>
    </select>
    <select key={`${direction}:${selectedCategory}`} name="category" defaultValue={selectedCategory} className="h-9 w-auto max-w-full rounded-lg border border-input bg-background px-3 text-sm">
      <option value="">{direction ? "All matching categories" : "All categories"}</option>
      {options.map((option) => <option key={option.name} value={option.name}>{option.name}</option>)}
    </select>
    <button className="h-8 self-center rounded-md bg-primary text-primary-foreground px-3 text-xs font-medium">Filter</button>
    <Link href="/app/transactions" className="h-8 self-center inline-flex items-center justify-center rounded-md border border-input px-3 text-xs font-medium hover:bg-accent">Reset</Link>
  </form>
}
