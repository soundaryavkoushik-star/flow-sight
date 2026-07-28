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
    default: "FlowSight — See what's next for your money",
    template: "%s · FlowSight",
  },
  description: "See your next 30 days, understand upcoming tight spots, and know what remains safe to spend.",
  applicationName: "FlowSight",
  keywords: ["cash flow forecast", "personal finance", "safe to spend", "upcoming bills"],
  openGraph: {
    type: "website",
    siteName: "FlowSight",
    title: "FlowSight — See what's next for your money",
    description: "See your next 30 days, understand upcoming tight spots, and know what remains safe to spend.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowSight — See what's next for your money",
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
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
