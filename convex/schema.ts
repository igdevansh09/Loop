import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    githubUsername: v.string(),
    avatarUrl: v.string(),
    topLanguages: v.optional(v.array(v.string())),
    collegeName: v.optional(v.string()),
    branch: v.optional(v.string()),
    pushToken: v.optional(v.string()),
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
  }).index("by_clerkId", ["clerkId"]),

  requirements: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    descriptionBullets: v.array(v.string()),
    hackathonLink: v.string(),
    techStack: v.array(v.string()),
    commsLink: v.string(),
    capacity: v.number(), // NEW: The explicit team size limit
    status: v.union(v.literal("open"), v.literal("filled")), // Prevents deletion, maintains history
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"]),

  applications: defineTable({
    requirementId: v.id("requirements"),
    applicantId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    aiSummary: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_requirement", ["requirementId"])
    .index("by_applicant", ["applicantId"]),

  notifications: defineTable({
    userId: v.id("users"), // The recipient
    type: v.union(
      v.literal("new_application"),
      v.literal("application_accepted"),
      v.literal("application_rejected"),
    ),
    requirementId: v.id("requirements"), // Deep link to the project
    triggeredByUserId: v.optional(v.id("users")), // Who caused this event
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
