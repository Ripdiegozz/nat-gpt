import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for storing user preferences and settings
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        theme: v.optional(
          v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
        ),
        aiModel: v.optional(v.string()),
        language: v.optional(v.string()),
        maxTokens: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Conversations table
  conversations: defineTable({
    title: v.string(),
    userId: v.id("users"), // Reference to users table
    clerkUserId: v.string(), // For quick filtering without joins
    isArchived: v.optional(v.boolean()),
    isShared: v.optional(v.boolean()),
    sharedWith: v.optional(v.array(v.string())), // Array of user IDs who can access this conversation
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_shared", ["isShared"]),

  // Messages table
  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    clerkUserId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        processingTime: v.optional(v.number()),
      })
    ),
    isEdited: v.optional(v.boolean()),
    editHistory: v.optional(
      v.array(
        v.object({
          content: v.string(),
          editedAt: v.number(),
        })
      )
    ),
    reactions: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          type: v.union(
            v.literal("like"),
            v.literal("dislike"),
            v.literal("heart")
          ),
          createdAt: v.number(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_created", ["conversationId", "createdAt"])
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // User sessions for tracking active users and presence
  userSessions: defineTable({
    userId: v.id("users"),
    clerkUserId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    isActive: v.boolean(),
    lastActiveAt: v.number(),
    sessionData: v.optional(
      v.object({
        device: v.optional(v.string()),
        browser: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_conversation", ["conversationId"])
    .index("by_active", ["isActive"])
    .index("by_last_active", ["lastActiveAt"]),

  // Conversation shares for collaboration
  conversationShares: defineTable({
    conversationId: v.id("conversations"),
    sharedByUserId: v.id("users"),
    sharedWithUserId: v.id("users"),
    sharedWithEmail: v.optional(v.string()),
    permissions: v.object({
      canRead: v.boolean(),
      canWrite: v.boolean(),
      canShare: v.boolean(),
      canDelete: v.boolean(),
    }),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_shared_with", ["sharedWithUserId"])
    .index("by_shared_by", ["sharedByUserId"])
    .index("by_email", ["sharedWithEmail"]),
});
