import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    descriptionBullets: v.array(v.string()), // Changed to array
    capacity: v.number(), // The hard limit
    hackathonLink: v.string(),
    techStack: v.array(v.string()),
    commsLink: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("requirements", {
      creatorId: args.creatorId,
      title: args.title,
      descriptionBullets: args.descriptionBullets,
      capacity: args.capacity,
      hackathonLink: args.hackathonLink,
      techStack: args.techStack,
      commsLink: args.commsLink,
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

// Add this to the bottom of convex/requirements.ts
export const deleteRequirement = mutation({
  args: {
    requirementId: v.id("requirements"),
    userId: v.id("users"), // To verify ownership
  },
  handler: async (ctx, args) => {
    const requirement = await ctx.db.get(args.requirementId);

    if (!requirement) {
      throw new Error("Node not found.");
    }

    if (requirement.creatorId !== args.userId) {
      throw new Error("Unauthorized: You do not own this node.");
    }

    // 1. Wipe all applications tied to this node to prevent orphaned data
    const linkedApplications = await ctx.db
      .query("applications")
      .withIndex("by_requirement", (q) =>
        q.eq("requirementId", args.requirementId),
      )
      .collect();

    for (const app of linkedApplications) {
      await ctx.db.delete(app._id);
    }

    // 2. Wipe the node itself
    await ctx.db.delete(args.requirementId);
  },
});

export const getRequirementById = query({
  args: { requirementId: v.id("requirements") },
  handler: async (ctx, args) => {
    const requirement = await ctx.db.get(args.requirementId);
    if (!requirement) return null;

    const creator = await ctx.db.get(requirement.creatorId);
    if (!creator) return null;

    return { ...requirement, creator };
  },
});