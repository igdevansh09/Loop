import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Create a new requirement (The Node)
export const create = mutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    hackathonLink: v.string(),
    techStack: v.array(v.string()),
    commsLink: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("requirements", {
      creatorId: args.creatorId,
      title: args.title,
      description: args.description,
      hackathonLink: args.hackathonLink,
      techStack: args.techStack,
      commsLink: args.commsLink, // The hidden handoff link
      status: "open",
      createdAt: Date.now(),
    });
  },
});

// 2. The Feed: Fetch only OPEN requirements and attach creator metadata
export const getOpenRequirements = query({
  handler: async (ctx) => {
    // Fetch only requirements that haven't been filled
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();

    // Join the creator's profile data so the frontend doesn't have to make N+1 queries
    const requirementsWithCreators = await Promise.all(
      requirements.map(async (req) => {
        const creator = await ctx.db.get(req.creatorId);

        // Strip out sensitive info like the pushToken before sending to the client
        return {
          ...req,
          creator: {
            githubUsername: creator?.githubUsername,
            avatarUrl: creator?.avatarUrl,
            collegeName: creator?.collegeName,
            branch: creator?.branch,
          },
        };
      }),
    );

    return requirementsWithCreators;
  },
});

// 3. Profile Dashboard: Fetch requirements created by a specific user
export const getRequirementsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requirements")
      .filter((q) => q.eq(q.field("creatorId"), args.userId))
      .order("desc")
      .collect();
  },
});
