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
            prompt: "Remove background completely, keep only the main subject with clean edges",
            originalImages: [{
              b64Json: base64Content,
              mimeType: input.mimeType,
            }],
          });
          
          if (!processedUrl) {
            throw new Error("Failed to generate processed image");
          }
          
          // Download the transparent image and composite it on white background
          const response = await fetch(processedUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Use sharp to composite transparent image on white background
          const sharp = (await import('sharp')).default;
          const image = sharp(buffer);
          const metadata = await image.metadata();
          
          // Create white background and composite the transparent image on top
          const withWhiteBg = await sharp({
            create: {
              width: metadata.width || 1024,
              height: metadata.height || 1024,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
          })
          .composite([{ input: buffer }])
          .png()
          .toBuffer();
          
          // Upload the final image with white background to S3
          const finalKey = `public/processed/${nanoid()}.png`;
          const { url: finalUrl } = await storagePut(finalKey, withWhiteBg, "image/png");
          
          return { processedUrl: finalUrl, status: "completed" };
        } catch (error) {
          console.error("Background removal error:", error);
          throw new Error("Failed to remove background");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
