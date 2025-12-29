import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { createImage, updateImage, getImageById, getUserImages } from "./db";
import { nanoid } from "nanoid";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  bgRemoval: router({
    // Remove background directly without storing in database
    removeBackground: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Use image generation API to remove background
          const { url: processedUrl } = await generateImage({
            prompt: "Remove the background from this image, keep the subject intact with clean edges, output transparent PNG",
            originalImages: [{
              url: input.imageUrl,
              mimeType: input.mimeType,
            }],
          });
          
          if (!processedUrl) {
            throw new Error("Failed to generate processed image");
          }
          
          return { processedUrl, status: "completed" };
        } catch (error) {
          console.error("Background removal error:", error);
          throw new Error("Failed to remove background");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
