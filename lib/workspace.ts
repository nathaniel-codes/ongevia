import { prisma } from "@/lib/db/client";
import type { Workspace, WorkspaceRole } from "@/app/generated/prisma/client";
import { normalizePhone } from "@/lib/phone";

export async function acceptPendingInvitationsForUser(
  userId: string,
  phoneOrEmail?: string | null
): Promise<void> {
  if (!phoneOrEmail) return;

  const phone = normalizePhone(phoneOrEmail);
  if (!phone) return;

  const now = new Date();
  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      phone,
      status: "PENDING",
      expiresAt: { gt: now },
    },
  });

  for (const invitation of invitations) {
    await prisma.$transaction([
      prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
        update: {
          role: invitation.role,
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
        },
      }),
    ]);
  }
}

export async function getWorkspaceMembership(userId: string): Promise<{
  workspace: Workspace;
  role: WorkspaceRole;
} | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;

  return {
    workspace: membership.workspace,
    role: membership.role,
  };
}

export async function ensureWorkspaceForUser(
  userId: string,
  phoneOrEmail?: string | null
): Promise<Workspace> {
  await acceptPendingInvitationsForUser(userId, phoneOrEmail);

  const existingMembership = await getWorkspaceMembership(userId);
  if (existingMembership) {
    return existingMembership.workspace;
  }

  const phone = phoneOrEmail ? normalizePhone(phoneOrEmail) : null;
  const workspaceName = phone
    ? `Workspace ${phone.slice(-4)}`
    : phoneOrEmail?.includes("@")
      ? `${phoneOrEmail.split("@")[0]}'s workspace`
      : "My workspace";

  return prisma.workspace.create({
    data: {
      name: workspaceName,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });
}

export async function getPrimaryWorkspace(userId: string): Promise<Workspace | null> {
  const membership = await getWorkspaceMembership(userId);
  return membership?.workspace ?? null;
}
