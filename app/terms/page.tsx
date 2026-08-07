import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service - Ongevia",
  description:
    "Terms governing use of Ongevia’s Instagram comment-to-DM automation service.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description="These Terms of Service (“Terms”) govern your access to and use of Ongevia at https://ongevia.com. By creating an account or using the service, you agree to these Terms."
      updatedAt="August 7, 2026"
    >
      <section>
        <h2>1. The service</h2>
        <p className="mt-3">
          Ongevia helps businesses automate Instagram comment-to-DM and related
          messaging workflows using Meta’s official APIs. Features may include
          campaigns, keyword matching, private replies, public comment replies,
          tracked links, wallet credits, team workspaces, and admin tools.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and accounts</h2>
        <ul>
          <li>You must be able to form a binding contract and use the service lawfully.</li>
          <li>
            User accounts authenticate with a phone number and one-time SMS code.
            You are responsible for that phone number and for activity under your
            account.
          </li>
          <li>
            You may only connect Instagram professional accounts you own or are
            authorized to manage.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <p className="mt-3">You agree not to:</p>
        <ul>
          <li>Violate Meta Platform Terms, Instagram policies, or applicable law.</li>
          <li>
            Send spam, deceptive, harmful, or unauthorized marketing messages.
          </li>
          <li>
            Attempt to bypass rate limits, abuse APIs, reverse engineer the
            service in a way that harms us or Meta, or interfere with other users.
          </li>
          <li>
            Use scraped credentials, unofficial Instagram clients, or any method
            that violates Meta’s rules.
          </li>
        </ul>
        <p className="mt-3">
          We may suspend or terminate accounts or campaigns that create abuse,
          security, deliverability, or compliance risk.
        </p>
      </section>

      <section>
        <h2>4. Your content and campaigns</h2>
        <p className="mt-3">
          You are solely responsible for campaign keywords, messages, links,
          media references, and any content you configure. You represent that you
          have rights to use that content and that it does not infringe others’
          rights.
        </p>
      </section>

      <section>
        <h2>5. Meta and third-party services</h2>
        <p className="mt-3">
          Ongevia depends on Meta/Instagram, SMS, payments, hosting, and other
          providers. Their outages, policy changes, rate limits, or account
          actions may affect Ongevia. We are not responsible for Meta’s or other
          third parties’ decisions about your Instagram account.
        </p>
      </section>

      <section>
        <h2>6. Fees and credits</h2>
        <p className="mt-3">
          Some features may consume wallet credits purchased via mobile money or
          granted by an administrator. Fees, credit rates, and limits may change
          with notice in the product or these Terms. Payments are processed by
          third-party payment providers; refunds follow their rules and our
          written policy where applicable.
        </p>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p className="mt-3">
          Ongevia’s branding, UI, and software (excluding your content and
          third-party IP) are owned by us or our licensors. You receive a limited,
          non-exclusive, non-transferable right to use the service as offered.
        </p>
      </section>

      <section>
        <h2>8. Privacy</h2>
        <p className="mt-3">
          Our <a href="/privacy">Privacy Policy</a> describes how we handle
          personal data. Data deletion instructions are at{" "}
          <a href="/data-deletion">/data-deletion</a>.
        </p>
      </section>

      <section>
        <h2>9. Disclaimers</h2>
        <p className="mt-3">
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT
          PERMITTED BY LAW.
        </p>
      </section>

      <section>
        <h2>10. Limitation of liability</h2>
        <p className="mt-3">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONGEVIA AND ITS OPERATOR WILL
          NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR BUSINESS
          INTERRUPTION. OUR TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE
          IS LIMITED TO THE AMOUNTS YOU PAID TO US FOR THE SERVICE IN THE THREE
          (3) MONTHS BEFORE THE CLAIM.
        </p>
      </section>

      <section>
        <h2>11. Termination</h2>
        <p className="mt-3">
          You may stop using Ongevia at any time and may request account deletion
          via the Data Deletion page. We may suspend or terminate access for
          breach of these Terms, legal risk, or non-payment.
        </p>
      </section>

      <section>
        <h2>12. Changes</h2>
        <p className="mt-3">
          We may update these Terms. The “Last updated” date will change when we
          do. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p className="mt-3">
          Questions about these Terms:{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
