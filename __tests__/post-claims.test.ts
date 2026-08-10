import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    platformSetting: { findUnique: vi.fn() },
    postClaim: { findFirst: vi.fn(), findMany: vi.fn() },
    instagramAccount: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/db/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/instagram-accounts", () => ({
  getPlatformSharedAccount: vi.fn(async () => ({
    id: "ig_shared",
    workspaceId: "ws_home",
    isPlatformShared: true,
    username: "ongeviadotcom",
  })),
}));

import {
  assertCanAutomatePlatformPost,
  buildClaimDmText,
  extractClaimCodeFromMessage,
  filterAutomationsByPlatformClaims,
} from "../lib/post-claims";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("claim DM phrase", () => {
  it("builds and extracts connect codes", () => {
    expect(buildClaimDmText("482913")).toBe("482913");
    expect(extractClaimCodeFromMessage("482913")).toBe("482913");
    expect(extractClaimCodeFromMessage("connect 482913")).toBe("482913");
    expect(extractClaimCodeFromMessage("hey CONNECT 482913 thanks")).toBe(
      "482913"
    );
    expect(extractClaimCodeFromMessage("hello there")).toBeNull();
  });
});

describe("assertCanAutomatePlatformPost", () => {
  it("allows own (non-shared) Instagram accounts without a claim", async () => {
    await expect(
      assertCanAutomatePlatformPost({
        workspaceId: "ws_1",
        account: {
          id: "ig_1",
          workspaceId: "ws_1",
          isPlatformShared: false,
        },
        postId: "media_1",
      })
    ).resolves.toEqual({ ok: true });
  });

  it("allows the platform account home workspace without a claim", async () => {
    await expect(
      assertCanAutomatePlatformPost({
        workspaceId: "ws_home",
        account: {
          id: "ig_shared",
          workspaceId: "ws_home",
          isPlatformShared: true,
        },
        postId: "media_1",
        matchAnyPost: true,
      })
    ).resolves.toEqual({ ok: true });
  });

  it("blocks collaborate guests without a verified claim", async () => {
    mockPrisma.platformSetting.findUnique.mockResolvedValue({
      value: "ig_shared",
    });
    mockPrisma.postClaim.findFirst.mockResolvedValue(null);

    const result = await assertCanAutomatePlatformPost({
      workspaceId: "ws_guest",
      account: {
        id: "ig_shared",
        workspaceId: "ws_home",
        isPlatformShared: true,
      },
      postId: "media_1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("allows collaborate guests with a verified claim", async () => {
    mockPrisma.platformSetting.findUnique.mockResolvedValue({
      value: "ig_shared",
    });
    mockPrisma.postClaim.findFirst.mockResolvedValue({ id: "claim_1" });

    await expect(
      assertCanAutomatePlatformPost({
        workspaceId: "ws_guest",
        account: {
          id: "ig_shared",
          workspaceId: "ws_home",
          isPlatformShared: true,
        },
        postId: "media_1",
      })
    ).resolves.toEqual({ ok: true });
  });
});

describe("filterAutomationsByPlatformClaims", () => {
  it("keeps home-workspace automations and drops unverified guest ones", async () => {
    mockPrisma.postClaim.findMany.mockResolvedValue([
      {
        workspaceId: "ws_guest",
        instagramAccountId: "ig_shared",
        mediaId: "media_ok",
      },
    ]);

    const filtered = await filterAutomationsByPlatformClaims([
      {
        workspaceId: "ws_home",
        postId: "media_any",
        matchAnyPost: false,
        instagramAccount: {
          id: "ig_shared",
          isPlatformShared: true,
          workspaceId: "ws_home",
        },
      },
      {
        workspaceId: "ws_guest",
        postId: "media_ok",
        matchAnyPost: false,
        instagramAccount: {
          id: "ig_shared",
          isPlatformShared: true,
          workspaceId: "ws_home",
        },
      },
      {
        workspaceId: "ws_guest",
        postId: "media_stolen",
        matchAnyPost: false,
        instagramAccount: {
          id: "ig_shared",
          isPlatformShared: true,
          workspaceId: "ws_home",
        },
      },
    ]);

    expect(filtered.map((a) => a.postId)).toEqual(["media_any", "media_ok"]);
  });
});
