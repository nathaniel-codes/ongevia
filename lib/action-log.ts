import { prisma } from "@/lib/db/client";
import type { ActionActorType, Prisma } from "@/app/generated/prisma/client";

export async function logAction(params: {
  actorUserId?: string | null;
  impersonatedUserId?: string | null;
  actorType?: ActionActorType;
  action: string;
  entityType?: string;
  entityId?: string;
  workspaceId?: string;
  ip?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.actionLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        impersonatedUserId: params.impersonatedUserId ?? null,
        actorType: params.actorType ?? "USER",
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        workspaceId: params.workspaceId,
        ip: params.ip ?? null,
        meta: params.meta,
      },
    });
  } catch (err) {
    console.error("[action-log]", err);
  }
}
