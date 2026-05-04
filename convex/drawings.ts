import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const q = ctx.db
      .query("drawings")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const results = await q.collect();
    return results;
  },
});

export const upsertDrawing = mutation({
  args: {
    clientId: v.string(),
    title: v.string(),
    data: v.string(),
    updatedAt: v.number(),
  },
  returns: v.id("drawings"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Try to find an existing drawing for this clientId
    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (existing) {
      // Only patch if remote is newer to avoid unnecessary writes
      const remoteUpdated = existing.updatedAt ?? 0;
      if (args.updatedAt > remoteUpdated) {
        await ctx.db.patch(existing._id, {
          data: args.data,
          title: args.title,
          updatedAt: args.updatedAt,
        });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("drawings", {
      clientId: args.clientId,
      title: args.title,
      data: args.data,
      userId,
      updatedAt: args.updatedAt,
    });

    return id;
  },
});

export const deleteDrawing = mutation({
  args: {
    clientId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("drawings")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});
