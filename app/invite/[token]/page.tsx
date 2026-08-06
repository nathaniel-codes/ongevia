import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvitationAcceptCard from "@/components/invitation-accept-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Accept Workspace Invitation - Ongevia",
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const [session, invitation] = await Promise.all([
    auth(),
    prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { name: true } },
      },
    }),
  ]);

  if (!invitation || invitation.status !== "PENDING") {
    notFound();
  }

  const expired = invitation.expiresAt <= new Date();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 font-display text-2xl font-semibold text-foreground">
          Ongevia
        </Link>
        <section className="panel rounded-xl p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Workspace invitation
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">
            Join {invitation.workspace.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            You were invited as {invitation.role.toLowerCase()} for{" "}
            {invitation.phone}.
          </p>
          <div className="mt-8">
            {expired ? (
              <p className="text-sm text-error">
                This invitation has expired. Ask the workspace owner to resend it.
              </p>
            ) : (
              <InvitationAcceptCard
                token={token}
                isSignedIn={Boolean(session?.user?.id)}
                invitedPhone={invitation.phone}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
