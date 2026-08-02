import type { Metadata } from "next"
import { ArticleShell, LearnSection } from "@/components/learn-shell"

export const metadata: Metadata = { title: "Privacy", description: "How FlowSight stores, exports, and deletes the information you provide." }

export default function PrivacyPage() {
  return <ArticleShell eyebrow="Privacy" title="Your data stays understandable, too." intro="FlowSight stores the information needed to build your forecast. We aim to make that data visible, exportable, and removable.">
    <LearnSection id="stored" title="What is stored"><p>Your account identity, account names and balances, imported or manually entered transactions, recurring items, forecast preferences, and saved forecast observations are stored so FlowSight can calculate and explain your forecast.</p></LearnSection>
    <LearnSection id="connections" title="Connection-free setup"><p>You can use FlowSight without connecting a bank. CSV files and manual entries are reviewed before they are saved. FlowSight cannot move money or make transactions on your behalf.</p></LearnSection>
    <LearnSection id="export" title="Export your information"><p>You can download a copy of your FlowSight financial data from Settings. The export is designed to keep your information portable rather than locked inside the product.</p></LearnSection>
    <LearnSection id="deletion" title="Delete financial data"><p>Settings also provides a confirmed deletion action for accounts, transactions, recurring activity, and preferences. Deleting financial data does not automatically delete the separate sign-in identity.</p></LearnSection>
  </ArticleShell>
}
