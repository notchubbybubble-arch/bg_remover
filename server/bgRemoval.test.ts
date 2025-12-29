import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
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

describe("bgRemoval.uploadImage", () => {
  it("should upload an image and return imageId and originalUrl", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small test image in base64
    const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.bgRemoval.uploadImage({
      fileName: "test.png",
      fileType: "image/png",
      fileSize: 100,
      base64Data: testBase64,
    });

    expect(result).toHaveProperty("imageId");
    expect(result).toHaveProperty("originalUrl");
    expect(typeof result.imageId).toBe("number");
    expect(typeof result.originalUrl).toBe("string");
    expect(result.originalUrl).toMatch(/^https?:\/\//);
  });

  it("should reject upload without authentication", async () => {
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

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bgRemoval.uploadImage({
        fileName: "test.png",
        fileType: "image/png",
        fileSize: 100,
        base64Data: "test",
      })
    ).rejects.toThrow();
  });
});

describe("bgRemoval.listImages", () => {
  it("should return an array of images for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bgRemoval.listImages();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject without authentication", async () => {
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

    const caller = appRouter.createCaller(ctx);

    await expect(caller.bgRemoval.listImages()).rejects.toThrow();
  });
});
