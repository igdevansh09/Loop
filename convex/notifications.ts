import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Fetch notifications for the logged-in user
export const getMyNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Enrich with requirement details and trigger user info
    return await Promise.all(
      notifications.map(async (notif) => {
        const requirement = await ctx.db.get(notif.requirementId);
        const triggerUser = notif.triggeredByUserId
          ? await ctx.db.get(notif.triggeredByUserId)
          : null;

        return {
          ...notif,
          requirement: requirement ? { title: requirement.title } : null,
          triggerUser: triggerUser
            ? {
                githubUsername: triggerUser.githubUsername,
                avatarUrl: triggerUser.avatarUrl,
              }
            : null,
        };
      }),
    );
  },
});

// 2. Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});
