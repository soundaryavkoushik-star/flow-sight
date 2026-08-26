import type { Metadata } from "next"
import Link from "next/link"
import { LegalArticleShell, LearnSection } from "@/components/learn-shell"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern access to and use of Cusp.",
}

export default function TermsPage() {
  return <LegalArticleShell eyebrow="Terms" title="Terms for using Cusp." intro="These terms set the boundaries for Cusp’s private beta, including what the forecast can—and cannot—promise." updated="August 20, 2026">
    <LearnSection id="agreement" title="1. Agreement">
      <p>These Terms of Service govern your access to and use of Cusp, a personal cash-flow forecasting service available through cusp.sh.</p>
      <p>Cusp is operated by Soundarya Vadlamani, an individual based in Massachusetts, United States. In these Terms, “Cusp,” “we,” “us,” and “our” refer to that operator.</p>
      <p>By creating an account or using Cusp, you agree to these Terms and acknowledge the <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">Privacy Policy</Link>. If you do not agree, do not use the service.</p>
    </LearnSection>

    <LearnSection id="service" title="2. What Cusp does">
      <p>Cusp helps you organize financial information and project how cash balances could change over time. It may use balances, transactions, income, bills, recurring patterns, credit-card timing, safety-buffer preferences, and hypothetical scenarios that you provide or confirm.</p>
      <p>Cusp cannot access or move money. It does not initiate transactions, pay bills, transfer funds, or control your financial accounts.</p>
    </LearnSection>

    <LearnSection id="beta" title="3. Private beta">
      <p>Cusp is currently offered as a private beta. Features may be incomplete, change without notice, or occasionally produce unexpected results. We may add, remove, suspend, reset, or discontinue beta functionality as the product develops.</p>
      <p>We do not guarantee uninterrupted or error-free availability. Cusp is free during the private beta. You will not be enrolled in a paid subscription automatically. If paid plans are introduced, pricing will be disclosed in advance and you will choose whether to subscribe.</p>
    </LearnSection>

    <LearnSection id="forecasts" title="4. Forecasts and estimates">
      <p>Cusp calculates forecasts from the information available in your account. A forecast may be incomplete or inaccurate when balances are outdated, transactions are missing, recurring events have changed, imported information is incorrect, or an account is not represented.</p>
      <p>Confirmed and estimated labels provide context; they do not guarantee that an amount, date, deposit, payment, or balance will occur as shown. Safe to Spend, projected low points, suggested purchase dates, alerts, and scenario results are informational calculations. You are responsible for reviewing the evidence and deciding whether to rely on them.</p>
    </LearnSection>

    <LearnSection id="advice" title="5. Not financial advice">
      <p>Cusp is an informational and organizational tool. It is not a bank, financial planner, investment adviser, broker, accountant, credit counselor, attorney, or tax adviser.</p>
      <p>Nothing provided by Cusp is financial, investment, legal, tax, accounting, lending, or credit advice. Before an important financial decision, independently verify the relevant information and consider consulting a qualified professional familiar with your circumstances.</p>
    </LearnSection>

    <LearnSection id="eligibility" title="6. Eligibility">
      <p>You must be at least 18 years old and legally capable of entering into a binding agreement. The private beta is intended for users in the United States and may not be appropriate for accounts, currencies, laws, or financial practices elsewhere.</p>
      <p>You may use Cusp only for your own lawful personal-finance purposes.</p>
    </LearnSection>

    <LearnSection id="account" title="7. Your account and information">
      <p>You are responsible for providing accurate information, keeping credentials secure, maintaining access to your account email, reviewing imported and calculated information, and notifying us if you suspect unauthorized access.</p>
      <p>You retain ownership of information you enter or import. You permit us to host, process, reproduce, and use it only as reasonably necessary to operate, secure, maintain, support, and improve Cusp, or as required by law. You represent that you have the right to provide any information you upload.</p>
    </LearnSection>

    <LearnSection id="acceptable-use" title="8. Acceptable use">
      <p>You may not use Cusp for unlawful, fraudulent, or abusive purposes; access another person’s account or information; interfere with service security; circumvent access controls or limits; introduce malicious code; create accounts or scrape the service through unauthorized automation; overwhelm the infrastructure; or misrepresent forecasts as guaranteed outcomes.</p>
      <p>We may restrict or suspend access when reasonably necessary to protect Cusp, its users, or others.</p>
    </LearnSection>

    <LearnSection id="ownership" title="9. Cusp materials and feedback">
      <p>Cusp’s software, interface, designs, branding, illustrations, text, and other original materials belong to the operator or are used with permission. You receive a limited, personal, non-exclusive, non-transferable, revocable right to use Cusp while following these Terms.</p>
      <p>If you send ideas or corrections, you permit us to use that feedback to improve Cusp without payment or obligation. This does not give us ownership of your financial information.</p>
    </LearnSection>

    <LearnSection id="providers" title="10. Third-party services">
      <p>Cusp relies on providers for authentication, hosting, database infrastructure, and application delivery. Those services may experience interruptions and apply their own terms and privacy practices. We are not responsible for third-party services outside our control.</p>
    </LearnSection>

    <LearnSection id="termination" title="11. Account closure and termination">
      <p>You may stop using Cusp at any time and can use the export and financial-data deletion controls in Settings. We may suspend or terminate access because of a Terms violation, unlawful or abusive activity, a security risk, a legal requirement, discontinuation of the beta, or conduct that could harm Cusp or another person.</p>
      <p>Where reasonable, we will provide notice before terminating access.</p>
    </LearnSection>

    <LearnSection id="disclaimers" title="12. Service disclaimers">
      <p>To the maximum extent permitted by law, Cusp is provided “as is” and “as available.” We do not guarantee that a forecast will match an actual balance; a recurring event will occur as shown; an import, category, transfer, or merchant will always be recognized correctly; an alert will arrive before an event; or the service will always be available and error-free.</p>
      <p>Nothing in these Terms excludes warranties or consumer rights that cannot legally be excluded.</p>
    </LearnSection>

    <LearnSection id="liability" title="13. Limitation of liability">
      <p>To the maximum extent permitted by law, Cusp and its operator will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from use of—or inability to use—the service. This includes losses connected with reliance on forecasts, delayed or missing income, bills, overdrafts, fees, credit or tax consequences, lost data, or service interruptions.</p>
      <p>To the maximum extent permitted by law, Cusp’s total liability for claims connected with the free private beta will not exceed $100. Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.</p>
    </LearnSection>

    <LearnSection id="changes" title="14. Changes to these Terms">
      <p>We may update these Terms as Cusp develops. The date above identifies the latest version. If a change materially affects your rights, we will provide reasonable notice through Cusp or by email before it takes effect. Continuing to use Cusp after updated Terms take effect means you accept them.</p>
    </LearnSection>

    <LearnSection id="law" title="15. Governing law">
      <p>These Terms are governed by the laws of the Commonwealth of Massachusetts and applicable United States federal law, without regard to conflict-of-law principles. Disputes that are not resolved informally will be handled by a court with appropriate jurisdiction in Massachusetts, unless applicable law requires otherwise.</p>
    </LearnSection>

    <LearnSection id="contact" title="16. Contact">
      <p>Questions about these Terms may be sent to <a href="mailto:support@cusp.sh" className="font-medium text-foreground underline underline-offset-4">support@cusp.sh</a>.</p>
      <p>Soundarya Vadlamani<br />Cusp<br />Massachusetts, United States</p>
    </LearnSection>
  </LegalArticleShell>
}
