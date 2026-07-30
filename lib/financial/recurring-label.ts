export function recurringDisplayName(name: string, type: string) {
  if (type === "income" && /^monthly\s+salary$/i.test(name.trim())) return "Salary paycheck"
  return name
}

export function recurringFrequencyLabel(frequency: string) {
  if (frequency === "biweekly") return "Every two weeks"
  if (frequency === "weekly") return "Weekly"
  if (frequency === "monthly") return "Monthly"
  if (frequency === "annual") return "Annual"
  if (frequency === "irregular") return "No regular cadence"
  return frequency
}
