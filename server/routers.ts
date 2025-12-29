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
    // Upload original image to S3
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        base64Data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const buffer = Buffer.from(input.base64Data, "base64");
        
        // Upload to S3 with random suffix to prevent enumeration
        const fileKey = `${userId}/originals/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        
        // Create database record
        const imageId = await createImage({
          userId,
          originalUrl: url,
          originalKey: fileKey,
          status: "processing",
          fileSize: input.fileSize,
          mimeType: input.fileType,
        });
        
        return { imageId, originalUrl: url };
      }),
    
    // Remove background using image generation API
    removeBackground: protectedProcedure
      .input(z.object({
        imageId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const image = await getImageById(input.imageId);
        
        if (!image || image.userId !== userId) {
          throw new Error("Image not found or unauthorized");
        }
        
        try {
          // Use image generation API to remove background
          const { url: processedUrl } = await generateImage({
            prompt: "Remove the background from this image, keep the subject intact with clean edges, output transparent PNG",
            originalImages: [{
              url: image.originalUrl,
              mimeType: image.mimeType || "image/png",
            }],
          });
          
          // Download the processed image and upload to our S3
          if (!processedUrl) {
            throw new Error("Failed to generate processed image");
          }
          const response = await fetch(processedUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Upload processed image to S3
          const processedKey = `${userId}/processed/${nanoid()}-processed.png`;
          const { url: finalUrl } = await storagePut(processedKey, buffer, "image/png");
          
          // Update database record
          await updateImage(input.imageId, {
            processedUrl: finalUrl,
            processedKey,
            status: "completed",
          });
          
          return { processedUrl: finalUrl, status: "completed" };
        } catch (error) {
          await updateImage(input.imageId, { status: "failed" });
          throw error;
        }
      }),
    
    // Get user's images
    listImages: protectedProcedure.query(async ({ ctx }) => {
      return getUserImages(ctx.user.id);
    }),
    
    // Get single image
    getImage: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .query(async ({ ctx, input }) => {
        const image = await getImageById(input.imageId);
        if (!image || image.userId !== ctx.user.id) {
          throw new Error("Image not found or unauthorized");
        }
        return image;
      }),
  }),
});

export type AppRouter = typeof appRouter;
