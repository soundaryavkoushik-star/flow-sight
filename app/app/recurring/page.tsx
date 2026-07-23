import { redirect } from "next/navigation"

export default function RecurringPage() {
  redirect("/app/transactions?tab=recurring")
}
