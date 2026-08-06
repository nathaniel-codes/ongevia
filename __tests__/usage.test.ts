import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockTx, mockSpend, mockRefund } = vi.hoisted(() => {
  const tx = {
    workspace: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockSpend: vi.fn(),
    mockRefund: vi.fn(),
    mockPrisma: {
      $transaction: vi.fn((callback: (txArg: typeof tx) => unknown) =>
        callback(tx)
      ),
      workspace: {
        updateMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/db/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/wallet", () => ({
  spendDmCredits: mockSpend,
  refundDmCredits: mockRefund,
  getDmCreditCost: vi.fn(async () => 1),
}));

import {
  releaseWorkspaceDMReservation,
  reserveWorkspaceDMSend,
} from "../lib/billing/usage";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  mockSpend.mockResolvedValue({ allowed: true, remaining: 99, cost: 1 });
  mockRefund.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reserveWorkspaceDMSend", () => {
  it("reserves when wallet credits allow", async () => {
    const periodStart = new Date("2026-05-01T00:00:00.000Z");
    mockTx.workspace.updateMany.mockResolvedValueOnce({ count: 0 });
    mockTx.workspace.findUnique.mockResolvedValueOnce({
      usagePeriodStart: periodStart,
      dmsSentThisPeriod: 99,
    });
    mockTx.workspace.update.mockResolvedValueOnce({});

    const result = await reserveWorkspaceDMSend("workspace_123");

    expect(result.allowed).toBe(true);
    expect(result.reserved).toBe(true);
    expect(result.remaining).toBe(99);
    expect(mockSpend).toHaveBeenCalledWith("workspace_123");
  });

  it("denies when wallet has insufficient credits", async () => {
    mockSpend.mockResolvedValueOnce({ allowed: false, remaining: 0, cost: 1 });

    const result = await reserveWorkspaceDMSend("workspace_123");

    expect(result.allowed).toBe(false);
    expect(result.reserved).toBe(false);
    expect(mockTx.workspace.findUnique).not.toHaveBeenCalled();
  });
});

describe("releaseWorkspaceDMReservation", () => {
  it("refunds credits and decrements usage", async () => {
    const periodStart = new Date("2026-05-01T00:00:00.000Z");
    mockPrisma.workspace.updateMany.mockResolvedValue({ count: 1 });

    await releaseWorkspaceDMReservation("workspace_123", periodStart);

    expect(mockRefund).toHaveBeenCalledWith("workspace_123");
    expect(mockPrisma.workspace.updateMany).toHaveBeenCalledWith({
      where: {
        id: "workspace_123",
        usagePeriodStart: periodStart,
        dmsSentThisPeriod: { gt: 0 },
      },
      data: { dmsSentThisPeriod: { decrement: 1 } },
    });
  });
});
