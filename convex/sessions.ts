import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create or update user session
export const createOrUpdateSession = mutation({
  args: {
    clerkUserId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    sessionData: v.optional(
      v.object({
        device: v.optional(v.string()),
        browser: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find existing active session
    const existingSession = await ctx.db
      .query("userSessions")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const now = Date.now();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        conversationId: args.conversationId,
        lastActiveAt: now,
        sessionData: args.sessionData,
        updatedAt: now,
      });
      return existingSession._id;
    } else {
      // Create new session
      const sessionId = await ctx.db.insert("userSessions", {
        userId: user._id,
        clerkUserId: args.clerkUserId,
        conversationId: args.conversationId,
        isActive: true,
        lastActiveAt: now,
        sessionData: args.sessionData,
        createdAt: now,
        updatedAt: now,
      });
      return sessionId;
    }
  },
});

// Update session activity
export const updateSessionActivity = mutation({
  args: {
    clerkUserId: v.string(),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        conversationId: args.conversationId,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// End user session
export const endSession = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get active users in a conversation
export const getActiveUsersInConversation = query({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user has access to the conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const hasAccess =
      conversation.clerkUserId === args.clerkUserId ||
      conversation.sharedWith?.includes(args.clerkUserId);

    if (!hasAccess) {
      throw new Error("Access denied to this conversation");
    }

    // Get sessions active in the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const sessions = await ctx.db
      .query("userSessions")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("lastActiveAt"), fiveMinutesAgo)
        )
      )
      .collect();

    // Get user details for each session
    const activeUsers = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return user
          ? {
              userId: user._id,
              clerkId: user.clerkId,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              lastActiveAt: session.lastActiveAt,
              sessionData: session.sessionData,
            }
          : null;
      })
    );

    return activeUsers.filter(Boolean);
  },
});

// Get user's current session
export const getCurrentSession = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!session) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    let conversation = null;

    if (session.conversationId) {
      conversation = await ctx.db.get(session.conversationId);
    }

    return {
      ...session,
      user,
      conversation,
    };
  },
});

// Clean up old inactive sessions
export const cleanupInactiveSessions = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Mark sessions as inactive if last active more than 1 hour ago
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const inactiveSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_last_active", (q) => q.lt("lastActiveAt", oneHourAgo))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of inactiveSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    return inactiveSessions.length;
  },
});

// Get user activity statistics
export const getUserActivityStats = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all user sessions
    const sessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Calculate statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.isActive).length;

    // Calculate total time spent (approximate)
    let totalTimeSpent = 0;
    sessions.forEach((session) => {
      if (!session.isActive) {
        // For inactive sessions, calculate time difference
        const sessionDuration = session.updatedAt - session.createdAt;
        totalTimeSpent += sessionDuration;
      } else {
        // For active sessions, calculate time since creation
        const currentSessionTime = Date.now() - session.createdAt;
        totalTimeSpent += currentSessionTime;
      }
    });

    // Get last 30 days activity
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter((s) => s.createdAt > thirtyDaysAgo);

    return {
      totalSessions,
      activeSessions,
      totalTimeSpent,
      recentSessions: recentSessions.length,
      averageSessionDuration:
        totalSessions > 0 ? totalTimeSpent / totalSessions : 0,
      lastActiveAt: Math.max(...sessions.map((s) => s.lastActiveAt), 0),
    };
  },
});
