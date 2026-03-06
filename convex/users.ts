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

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    collegeName: v.optional(v.string()),
    topLanguages: v.optional(v.array(v.string())),
    topRepos: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          url: v.string(),
          stars: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...(args.collegeName !== undefined && { collegeName: args.collegeName }),
      ...(args.topLanguages !== undefined && {
        topLanguages: args.topLanguages,
      }),
      ...(args.topRepos !== undefined && { topRepos: args.topRepos }),
    });
  },
});


// Add this to the bottom of convex/users.ts
export const deleteAccount = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Wipe all outbound applications submitted by this user
    const outboundApps = await ctx.db
      .query("applications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", args.userId))
      .collect();
    for (const app of outboundApps) {
      await ctx.db.delete(app._id);
    }

    // 2. Wipe all nodes created by this user AND the applications attached to them
    const myNodes = await ctx.db
      .query("requirements")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
      
    for (const node of myNodes) {
      const inboundApps = await ctx.db
        .query("applications")
        .withIndex("by_requirement", (q) => q.eq("requirementId", node._id))
        .collect();
      for (const app of inboundApps) {
        await ctx.db.delete(app._id); // Delete the inbound applications
      }
      await ctx.db.delete(node._id); // Delete the node itself
    }

    // 3. Finally, wipe the user profile
    await ctx.db.delete(args.userId);
  },
});

// System Action: Binds the physical device hardware token to the user identity
export const updatePushToken = mutation({
  args: {
    clerkId: v.string(),
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by their Clerk authentication ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // If the user exists and the token is new or changed, patch the record
    if (user && user.pushToken !== args.pushToken) {
      await ctx.db.patch(user._id, {
        pushToken: args.pushToken,
      });
      console.log(`Hardware token synced for user: ${user.githubUsername}`);
    }
  },
});