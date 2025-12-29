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
        base64Data: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Extract base64 data from data URL if present
          let base64Content = input.base64Data;
          if (base64Content.startsWith('data:')) {
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64Index = base64Content.indexOf('base64,');
            if (base64Index !== -1) {
              base64Content = base64Content.substring(base64Index + 7);
            }
          }
          
          // Use image generation API to remove background
          const { url: processedUrl } = await generateImage({
            prompt: "Remove background, keep subject, transparent PNG",
            originalImages: [{
              b64Json: base64Content,
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
