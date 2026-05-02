// convex/users.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getAuthUserId(ctx);

    if (!identity) {
      return null;
    }

    const user = await ctx.db.get(identity);

    if (!user) {
      // If you are using the 'subject' specifically, check your schema
      // But for most wireboard flows, the email index is the winner.
      console.log("No user found for identity:", identity);
      return null;
    }

    return user;
  },
});
