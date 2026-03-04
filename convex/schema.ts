import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    githubUsername: v.string(), // Must be enforced via Clerk OAuth
    avatarUrl: v.string(),
    topLanguages: v.array(v.string()), // To be populated via GitHub API
    collegeName: v.optional(v.string()), // e.g., "NSUT" - localized trust network
    branch: v.optional(v.string()),
    pushToken: v.optional(v.string()), // For Expo/FCM push notifications
  }).index("by_clerkId", ["clerkId"]),

  requirements: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    hackathonLink: v.string(), // Verification proof
    techStack: v.array(v.string()), // e.g., ["Go", "React Native"]
    commsLink: v.string(), // Hidden Discord/WhatsApp invite
    status: v.union(v.literal("open"), v.literal("filled")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  applications: defineTable({
    requirementId: v.id("requirements"),
    applicantId: v.id("users"),
    aiSummary: v.optional(v.string()), // Gemini's evaluation of the applicant
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
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
