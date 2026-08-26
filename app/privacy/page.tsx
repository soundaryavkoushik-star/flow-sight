import type { Metadata } from "next"
import { LegalArticleShell, LearnSection } from "@/components/learn-shell"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Cusp collects, uses, protects, exports, and deletes the information you provide.",
}

export default function PrivacyPage() {
  return <LegalArticleShell eyebrow="Privacy" title="Privacy should be as clear as the forecast." intro="This policy explains what Cusp collects, why it is needed, who helps us operate the service, and the choices you have over your information." updated="August 20, 2026">
    <LearnSection id="operator" title="1. Who operates Cusp">
      <p>Cusp is operated by Soundarya Vadlamani, an individual based in Massachusetts, United States. In this policy, “Cusp,” “we,” “us,” and “our” refer to that operator.</p>
      <p>This policy applies to cusp.sh and the Cusp web application.</p>
    </LearnSection>

    <LearnSection id="collected" title="2. Information we collect">
      <p><strong className="font-medium text-foreground">Account information.</strong> When you create an account, we receive information such as your name, email address, authentication identifiers, and account timestamps.</p>
      <p><strong className="font-medium text-foreground">Financial information you provide.</strong> This can include account names and types, balances and balance dates, transactions, categories, recurring income and bills, credit-card details used for forecasting, safety-buffer preferences, alert preferences, and other forecast settings.</p>
      <p><strong className="font-medium text-foreground">Imported information.</strong> If you upload a CSV, Cusp processes its column names and transaction rows so you can review and import them. Cusp does not require your bank username or password and cannot move money.</p>
      <p><strong className="font-medium text-foreground">Forecast information.</strong> We store forecast snapshots, projected events, balance observations, and related evidence so Cusp can explain calculations and measure forecast performance.</p>
      <p><strong className="font-medium text-foreground">Technical and support information.</strong> Our infrastructure providers may process basic request information such as IP address, browser or device information, timestamps, and error logs. If you contact support, we receive the message and information you choose to include.</p>
    </LearnSection>

    <LearnSection id="use" title="3. How we use information">
      <p>We use information to create and secure your account; calculate, display, and explain forecasts; import and organize transactions; identify recurring patterns and possible transfers; provide scenarios and alerts; support export and deletion requests; diagnose errors; prevent abuse; and improve Cusp.</p>
      <p>We do not use your financial information to make transactions on your behalf.</p>
    </LearnSection>

    <LearnSection id="sharing" title="4. When information is shared">
      <p>We do not sell personal or financial information, and Cusp is not supported by behavioral advertising.</p>
      <p>We share information only as needed with service providers that help operate Cusp, including Supabase for authentication and database infrastructure and the providers used to host and deliver the application. These providers process information for the services they supply to us.</p>
      <p>We may also disclose information when required by law, to protect Cusp or another person from fraud or harm, or as part of a future merger, financing, acquisition, or transfer of the service. If ownership changes, the successor would receive information subject to this policy or notice of materially different practices.</p>
    </LearnSection>

    <LearnSection id="cookies" title="5. Cookies and analytics">
      <p>Cusp uses essential browser storage and cookies to keep you signed in, protect sessions, and operate the application. Cusp does not currently use third-party advertising cookies or a third-party product-analytics service.</p>
      <p>If we later add non-essential analytics or similar tracking, this policy and any required consent controls will be updated before that use begins.</p>
    </LearnSection>

    <LearnSection id="retention" title="6. Retention and deletion">
      <p>We generally retain your information while your Cusp account remains active so the service can preserve your history and forecasts.</p>
      <p>The “Delete financial data” control in Settings permanently removes financial accounts, transactions, recurring activity, forecast history, categories, and preferences from Cusp’s active application database. It does not currently delete the separate authentication identity used to sign in. To request deletion of that identity as well, email support@cusp.sh from the address connected to your account.</p>
      <p>Limited residual copies may remain temporarily in encrypted provider backups, security logs, or records we must retain for legal purposes. Backup copies are removed according to the applicable provider’s normal retention cycle and are not used to provide the active service.</p>
    </LearnSection>

    <LearnSection id="choices" title="7. Your choices">
      <p>You can review and correct financial information inside Cusp, download a copy from Settings, delete financial data, stop using the service, or ask us about the information associated with your account.</p>
      <p>Depending on where you live, privacy law may provide additional rights to access, correct, delete, or receive a copy of personal information. Contact us to make a request. We may need to verify your identity before completing it.</p>
    </LearnSection>

    <LearnSection id="security" title="8. Security">
      <p>We use reasonable administrative and technical safeguards designed to protect information, including encrypted network connections, access controls, authenticated server-side data access, and database protections that restrict records by user.</p>
      <p>No internet service can guarantee absolute security. Keep your sign-in credentials private and contact us promptly if you believe your account has been accessed without permission.</p>
    </LearnSection>

    <LearnSection id="age" title="9. Age and location">
      <p>Cusp is intended for people who are at least 18 years old and is currently designed for a United States private beta. We do not knowingly collect personal information from children.</p>
    </LearnSection>

    <LearnSection id="changes" title="10. Changes to this policy">
      <p>We may update this policy as Cusp develops or legal requirements change. The date above identifies the current version. If a change materially affects how we use personal information, we will provide reasonable notice through Cusp or by email before it takes effect.</p>
    </LearnSection>

    <LearnSection id="contact" title="11. Contact">
      <p>For privacy questions or requests, email <a href="mailto:support@cusp.sh" className="font-medium text-foreground underline underline-offset-4">support@cusp.sh</a>.</p>
      <p>Soundarya Vadlamani<br />Cusp<br />Massachusetts, United States</p>
    </LearnSection>
  </LegalArticleShell>
}
