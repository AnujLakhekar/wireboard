import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});


export const sendImage = mutation({
  args: { storageId: v.id("_storage"), author: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hour default TTL
    const expiresAt = now + ttlMs;

    await ctx.db.insert("images", {
      url: args.storageId,
      storageId: args.storageId,
      ownerId: args.author,
      createdAt: now,
      expiresAt,
      permanent: false,
    });
  },
});

export const cleanupExpiredImages = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Query for expired images
    const now = Date.now();
    const expiredImages = await ctx.db
      .query("images")
      .filter((q) => q.and(q.lt(q.field("expiresAt"), now), q.eq(q.field("permanent"), false)))
      .collect();

    for (const img of expiredImages) {
      if (img.expiresAt && img.expiresAt < now && !img.permanent) {
        try {
          await ctx.storage.delete(img.storageId);
        } catch (err) {
          console.error("Failed to delete expired storage file:", err);
        }
        await ctx.db.delete(img._id);
      }
    }
  },
});


export const getStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});


export const getImageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

export const deleteStorageFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.storage.delete(args.storageId);
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete storage file:", error);
      return { ok: false, error: String(error) };
    }
  },
});