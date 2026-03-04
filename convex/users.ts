import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Sync the user from Clerk to Convex upon login
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    githubUsername: v.string(),
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // If they exist, return their Convex ID
      return existingUser._id;
    }

    // If new, insert them into the database
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      githubUsername: args.githubUsername,
      avatarUrl: args.avatarUrl,
      topLanguages: [], // This will be updated later via the GitHub API action
    });
  },
});

// 2. Fetch the current logged-in user's profile
export const getCurrentUser = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.clerkId) return null;
    
    // Extract to a constant so TypeScript locks in the 'string' type for the closure
    const validClerkId = args.clerkId;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", validClerkId))
      .first();
  },
});

// 3. Update User Profile (College, Branch)
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    collegeName: v.string(),
    branch: v.string(),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      collegeName: args.collegeName,
      branch: args.branch,
      pushToken: args.pushToken,
    });
  },
});
