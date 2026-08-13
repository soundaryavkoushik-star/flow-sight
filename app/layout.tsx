import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cusp — Personal Cash Flow Forecast | Safe to Spend & Upcoming Bills",
    template: "%s · Cusp",
  },
  description: "See your next 30 days, understand upcoming tight spots, and know what remains safe to spend.",
  applicationName: "Cusp",
  icons: {
    icon: [
      { url: "/cusp-tab-icon-v1.svg", type: "image/svg+xml" },
      { url: "/cusp-favicon-v1.ico", type: "image/x-icon", sizes: "32x32" },
    ],
    shortcut: "/cusp-tab-icon-v1.svg",
    apple: "/apple-icon.png?v=8",
  },
  keywords: ["cash flow forecast", "personal finance", "safe to spend", "upcoming bills"],
  openGraph: {
    type: "website",
    siteName: "Cusp",
    title: "Cusp — Personal Cash Flow Forecast | Safe to Spend & Upcoming Bills",
    description: "See your next 30 days, understand upcoming tight spots, and know what remains safe to spend.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cusp — Personal Cash Flow Forecast | Safe to Spend & Upcoming Bills",
    description: "See your next 30 days, understand upcoming tight spots, and know what remains safe to spend.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
