import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Data Deletion Instructions - Ongevia",
  description:
    "How to disconnect Instagram and request deletion of your Ongevia account and related data (Meta App Review).",
};

export default function DataDeletionPage() {
  return (
    <LegalShell
      title="User Data Deletion"
      description="These instructions explain how users and Instagram account holders can remove data associated with Ongevia. This page is provided for Meta App Review and for customer privacy requests."
      updatedAt="August 7, 2026"
    >
      <section>
        <h2>1. Quick disconnect (Instagram)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            Sign in at{" "}
            <a href="https://ongevia.com/login">https://ongevia.com/login</a>.
          </li>
          <li>Open <strong>Settings</strong>.</li>
          <li>
            Find the connected Instagram account and choose{" "}
            <strong>Disconnect</strong>.
          </li>
        </ol>
        <p className="mt-3">
          Disconnecting removes the stored Instagram access token for that
          account and stops campaigns from sending private replies for it.
        </p>
      </section>

      <section>
        <h2>2. Request full account / data deletion</h2>
        <p className="mt-3">
          To delete your Ongevia user account and associated workspace data,
          email{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com?subject=Ongevia%20Data%20Deletion%20Request">
            nathanielmwaipopo@gmail.com
          </a>{" "}
          with subject line <strong>Ongevia Data Deletion Request</strong>.
        </p>
        <p className="mt-3">Include:</p>
        <ul>
          <li>The phone number used to sign in to Ongevia</li>
          <li>Workspace name (if known)</li>
          <li>Connected Instagram username(s)</li>
          <li>
            Confirmation that you want account deletion and/or Instagram data
            deletion
          </li>
        </ul>
      </section>

      <section>
        <h2>3. What we delete</h2>
        <p className="mt-3">When a verified deletion request is processed, we delete or anonymize:</p>
        <ul>
          <li>User account records (phone / profile)</li>
          <li>Workspace membership and invitations</li>
          <li>Campaign / automation configuration</li>
          <li>Instagram connection tokens and account links</li>
          <li>
            DM logs, webhook event records, and operational diagnostics tied to
            your workspace where practicable
          </li>
          <li>Wallet and payment order records except where retention is legally required</li>
        </ul>
      </section>

      <section>
        <h2>4. Verification and timing</h2>
        <p className="mt-3">
          We may verify that you control the phone number or Instagram business
          asset before deleting data. We aim to complete verified requests within{" "}
          <strong>30 days</strong> (often sooner). Some records may be retained
          longer when required for legal, security, fraud prevention, or
          accounting purposes, and will then be deleted or anonymized when no
          longer needed.
        </p>
      </section>

      <section>
        <h2>5. Meta / Instagram-side removal</h2>
        <p className="mt-3">
          Disconnecting or deleting data in Ongevia does not automatically remove
          permissions granted in Meta’s systems. You can also remove the Ongevia
          app from Instagram / Facebook settings for connected apps and websites
          if available on your account.
        </p>
      </section>

      <section>
        <h2>6. Contact</h2>
        <p className="mt-3">
          Data deletion and privacy:{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>
          .
        </p>
        <p className="mt-3">
          Related policies: <a href="/privacy">Privacy Policy</a> ·{" "}
          <a href="/terms">Terms of Service</a>.
        </p>
      </section>
    </LegalShell>
  );
}
