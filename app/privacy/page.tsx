import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy - Ongevia",
  description:
    "How Ongevia collects, uses, stores, and deletes personal and Instagram business data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="This Privacy Policy explains how Ongevia (“we”, “us”, “our”) handles information when you use https://ongevia.com and related services that automate Instagram comment-to-DM workflows through Meta’s official APIs."
      updatedAt="August 7, 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p className="mt-3">
          Ongevia is operated by Nathaniel Mwaipopo. Contact for privacy
          requests:{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>
          . Website:{" "}
          <a href="https://ongevia.com">https://ongevia.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <p className="mt-3">Depending on how you use Ongevia, we may collect:</p>
        <ul>
          <li>
            <strong>Account data:</strong> phone number (for OTP login), optional
            name, admin email for platform operators, session identifiers.
          </li>
          <li>
            <strong>Workspace data:</strong> workspace name, members, invitations,
            campaign settings (keywords, messages, links, post IDs).
          </li>
          <li>
            <strong>Instagram / Meta data:</strong> Instagram professional account
            IDs and usernames, encrypted access tokens, webhook payloads (for
            example comments and messaging events needed to run campaigns), and
            delivery / status logs.
          </li>
          <li>
            <strong>Payment data:</strong> mobile-money phone numbers, order IDs,
            amounts, payment status, and wallet credit balances. We do not store
            full card numbers.
          </li>
          <li>
            <strong>Technical / security data:</strong> IP addresses (where
            logged for security or click tracking), timestamps, error diagnostics,
            and action audit logs.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use data</h2>
        <ul>
          <li>Authenticate users (phone OTP via SMS) and protect accounts.</li>
          <li>
            Connect Instagram professional accounts and send private replies /
            public comment replies through Meta’s official APIs.
          </li>
          <li>
            Match keywords, queue and rate-limit delivery, prevent duplicates, and
            show campaign analytics and logs.
          </li>
          <li>Process wallet top-ups and credit usage for messaging features.</li>
          <li>
            Operate, secure, debug, and improve the service; comply with law and
            Meta Platform Terms.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Instagram and Meta</h2>
        <p className="mt-3">
          Ongevia does not ask for Instagram passwords, does not scrape
          Instagram, and does not use browser automation. Access is granted via
          Meta Instagram Login / Business Login. Tokens are encrypted at rest and
          used only for actions you authorize (for example reading comments and
          sending private replies). You can disconnect Instagram at any time in
          Settings.
        </p>
      </section>

      <section>
        <h2>5. Legal bases (where applicable)</h2>
        <p className="mt-3">
          We process data to perform our contract with you, based on your
          consent (for example connecting Instagram), for legitimate interests
          such as security and fraud prevention, and where required by law.
        </p>
      </section>

      <section>
        <h2>6. Sharing and subprocessors</h2>
        <p className="mt-3">
          We share data only as needed to run Ongevia, including:
        </p>
        <ul>
          <li>
            <strong>Meta / Instagram</strong> — to authenticate and send API
            requests you authorize.
          </li>
          <li>
            <strong>SMS provider (Beem Africa)</strong> — to deliver login OTP
            codes.
          </li>
          <li>
            <strong>Payment provider (Swahilies)</strong> — to process
            mobile-money top-ups.
          </li>
          <li>
            <strong>Hosting infrastructure</strong> — servers, PostgreSQL, and
            Redis used to run the application.
          </li>
        </ul>
        <p className="mt-3">
          We do not sell personal data. We may disclose information if required
          by law or to protect rights, safety, and the integrity of the service.
        </p>
      </section>

      <section>
        <h2>7. Retention</h2>
        <p className="mt-3">
          We retain account, campaign, log, and payment records for as long as
          your account is active and as needed for security, billing disputes,
          and legal obligations. You may request deletion as described on our{" "}
          <a href="/data-deletion">Data Deletion</a> page.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p className="mt-3">
          We use industry-standard measures including encrypted Instagram tokens
          at rest, HTTPS in transit, access controls, and operational logging.
          No method of transmission or storage is 100% secure.
        </p>
      </section>

      <section>
        <h2>9. Your rights</h2>
        <p className="mt-3">
          Depending on your location, you may have rights to access, correct,
          export, or delete personal data, or to withdraw consent where
          processing is consent-based. Contact{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>{" "}
          to exercise these rights.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p className="mt-3">
          Ongevia is intended for businesses and adults. We do not knowingly
          collect personal data from children under 13 (or the applicable age in
          your jurisdiction).
        </p>
      </section>

      <section>
        <h2>11. Changes</h2>
        <p className="mt-3">
          We may update this policy from time to time. The “Last updated” date
          at the top will change when we do. Continued use of Ongevia after
          updates means you accept the revised policy.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p className="mt-3">
          Privacy questions and requests:{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
