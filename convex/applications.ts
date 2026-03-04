import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. The Application Action (Candidate Applies)
export const apply = mutation({
  args: {
    requirementId: v.id("requirements"),
    applicantId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate applications
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", args.applicantId))
      .filter((q) => q.eq(q.field("requirementId"), args.requirementId))
      .first();

    if (existing) {
      throw new Error("You have already applied for this requirement.");
    }

    // Insert the pending application
    return await ctx.db.insert("applications", {
      requirementId: args.requirementId,
      applicantId: args.applicantId,
      status: "pending",
      createdAt: Date.now(),
      // aiSummary will be patched in via a Convex action (Gemini) later
    });
  },
});

// 2. Creator Dashboard: Fetch applications for a specific node
export const getApplicationsForRequirement = query({
  args: { requirementId: v.id("requirements") },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_requirement", (q) =>
        q.eq("requirementId", args.requirementId),
      )
      .order("desc")
      .collect();

    // Join the applicant's profile data for the creator to review
    return await Promise.all(
      applications.map(async (app) => {
        const applicant = await ctx.db.get(app.applicantId);
        return {
          ...app,
          applicant: {
            githubUsername: applicant?.githubUsername,
            avatarUrl: applicant?.avatarUrl,
            topLanguages: applicant?.topLanguages,
            collegeName: applicant?.collegeName,
            branch: applicant?.branch,
          },
        };
      }),
    );
  },
});

// 3. Applicant Dashboard: Fetch my applications and securely reveal commsLink
export const getMyApplications = query({
  args: { applicantId: v.id("users") },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", args.applicantId))
      .order("desc")
      .collect();

    // Join requirement data, but STRICTLY gate the commsLink
    return await Promise.all(
      applications.map(async (app) => {
        const req = await ctx.db.get(app.requirementId);
        if (!req) return null;

        return {
          ...app,
          requirement: {
            title: req.title,
            techStack: req.techStack,
            status: req.status,
            // SECURITY BY OMISSION: Only reveal the link if accepted
            commsLink: app.status === "accepted" ? req.commsLink : null,
          },
        };
      }),
    );
  },
});

// 4. The Resolution: Creator accepts or rejects a candidate
export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, {
      status: args.status,
    });

    // If accepted, we also mark the underlying requirement as "filled"
    if (args.status === "accepted") {
      const application = await ctx.db.get(args.applicationId);
      if (application) {
        await ctx.db.patch(application.requirementId, { status: "filled" });

        // FUTURE: Fire push notification to the accepted applicant here
      }
    }
  },
});
