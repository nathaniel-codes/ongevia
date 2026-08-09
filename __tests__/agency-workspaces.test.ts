import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    instagramAccount: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    platformSetting: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/client", () => ({
  prisma: mockPrisma,
}));

import {
  canConnectInstagramAccount,
  getWorkspaceInstagramAccount,
} from "../lib/instagram-accounts";
import {
  buildInvitationUrl,
  normalizeInvitationEmail,
} from "../lib/workspace-invitations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("agency workspace helpers", () => {
  it("allows reconnecting an account already owned by the workspace", async () => {
    mockPrisma.instagramAccount.findUnique.mockResolvedValue({
      workspaceId: "workspace_123",
    });

    await expect(
      canConnectInstagramAccount({
        workspaceId: "workspace_123",
        instagramId: "ig_123",
      })
    ).resolves.toMatchObject({ allowed: true, reason: null });
  });

  it("blocks accounts already connected to another workspace", async () => {
    mockPrisma.instagramAccount.findUnique.mockResolvedValue({
      workspaceId: "workspace_other",
      isPlatformShared: false,
      username: "brand_ig",
    });
    mockPrisma.platformSetting.findUnique.mockResolvedValue(null);

    await expect(
      canConnectInstagramAccount({
        workspaceId: "workspace_123",
        instagramId: "ig_123",
      })
    ).resolves.toMatchObject({
      allowed: false,
      reason: "already_connected",
      username: "brand_ig",
    });
  });

  it("allows connecting additional accounts with no plan limit", async () => {
    mockPrisma.instagramAccount.findUnique.mockResolvedValue(null);
    mockPrisma.instagramAccount.findFirst.mockResolvedValue(null);

    await expect(
      canConnectInstagramAccount({
        workspaceId: "workspace_123",
        instagramId: "ig_123",
      })
    ).resolves.toMatchObject({ allowed: true, reason: null });
  });

  it("selects a requested workspace account or falls back to the latest account", async () => {
    mockPrisma.instagramAccount.findFirst.mockResolvedValue({ id: "account_1" });

    await getWorkspaceInstagramAccount("workspace_123", "account_1");
    expect(mockPrisma.instagramAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: "account_1",
        OR: [{ workspaceId: "workspace_123" }, { isPlatformShared: true }],
      },
    });

    await getWorkspaceInstagramAccount("workspace_123", "all");
    expect(mockPrisma.instagramAccount.findFirst).toHaveBeenLastCalledWith({
      where: { workspaceId: "workspace_123" },
      orderBy: { connectedAt: "desc" },
    });
  });

  it("normalizes invitation phones and builds invite URLs", () => {
    expect(normalizeInvitationEmail(" 0755123456 ")).toBe("255755123456");
    expect(buildInvitationUrl("token_123", "https://example.com/")).toBe(
      "https://example.com/invite/token_123"
    );
  });
});

