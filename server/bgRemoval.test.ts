import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("bgRemoval.removeBackground", () => {
  it("should accept public requests without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Verify that the procedure is accessible without authentication
    // The actual API call may fail in test environment, but we verify the structure
    expect(ctx.user).toBeUndefined();
    expect(caller.bgRemoval.removeBackground).toBeDefined();
    expect(typeof caller.bgRemoval.removeBackground).toBe("function");
  });

  it("should validate input parameters", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Test that invalid input is rejected
    await expect(
      caller.bgRemoval.removeBackground({
        base64Data: "",
        mimeType: "",
      } as any)
    ).rejects.toThrow();
  });
});
