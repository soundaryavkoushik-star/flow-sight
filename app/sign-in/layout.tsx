import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Cusp cash-flow forecast.",
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
