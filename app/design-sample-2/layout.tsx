import { DM_Mono, DM_Sans, Newsreader } from "next/font/google"

const newsreader = Newsreader({ subsets: ["latin"], variable: "--sample-editorial", display: "swap" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--sample-sans", display: "swap" })
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--sample-mono", display: "swap" })

export default function DesignSampleTwoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${newsreader.variable} ${dmSans.variable} ${dmMono.variable}`}>{children}</div>
}
