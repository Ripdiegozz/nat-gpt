import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new conversation
export const createConversation = mutation({
  args: {
    title: v.string(),
    clerkUserId: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    // First, get the user by Clerk ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      // Auto-create user if they don't exist (fallback for edge cases)
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkUserId,
        email: "", // Will be updated by user sync
        name: "",
        imageUrl: "",
        preferences: {
          theme: "system",
          aiModel: "compound-beta",
          language: "en",
          maxTokens: 8192,
        },
        createdAt: now,
        updatedAt: now,
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      userId: user._id,
      clerkUserId: args.clerkUserId,
      isArchived: false,
      isShared: false,
      metadata: args.metadata || {
        model: "compound-beta",
        temperature: 0.7,
        maxTokens: 8192,
        tags: [],
      },
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

// Get all conversations for a user
export const getUserConversations = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    // Get message count for each conversation
    const conversationsWithCount = await Promise.all(
      conversations.map(async (conversation) => {
        const messageCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        return {
          ...conversation,
          messageCount: messageCount.length,
        };
      })
    );

    return conversationsWithCount;
  },
});

// Get a specific conversation with its messages
export const getConversationWithMessages = query({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    // Return null instead of throwing error if conversation doesn't exist
    if (!conversation) {
      return null;
    }

    // Check if user has access to this conversation
    const hasAccess =
      conversation.clerkUserId === args.clerkUserId ||
      conversation.sharedWith?.includes(args.clerkUserId) ||
      conversation.isShared;

    if (!hasAccess) {
      throw new Error("Access denied to this conversation");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return {
      ...conversation,
      messages,
    };
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    // If conversation doesn't exist, return null instead of throwing error
    if (!conversation) {
      return null;
    }

    if (conversation.clerkUserId !== args.clerkUserId) {
      throw new Error(
        "Access denied: You can only edit your own conversations"
      );
    }

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Archive/delete conversation
export const archiveConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    // If conversation doesn't exist, consider it already archived
    if (!conversation) {
      return { success: true, message: "Conversation already archived" };
    }

    if (conversation.clerkUserId !== args.clerkUserId) {
      throw new Error(
        "Access denied: You can only archive your own conversations"
      );
    }

    await ctx.db.patch(args.conversationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

// Permanently delete conversation
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    // If conversation doesn't exist, consider it already deleted (success)
    if (!conversation) {
      return { success: true, message: "Conversation already deleted" };
    }

    if (conversation.clerkUserId !== args.clerkUserId) {
      throw new Error(
        "Access denied: You can only delete your own conversations"
      );
    }

    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete conversation shares
    const shares = await ctx.db
      .query("conversationShares")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

// Share conversation with another user
export const shareConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    sharedWithEmail: v.string(),
    clerkUserId: v.string(),
    permissions: v.object({
      canRead: v.boolean(),
      canWrite: v.boolean(),
      canShare: v.boolean(),
      canDelete: v.boolean(),
    }),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.clerkUserId !== args.clerkUserId) {
      throw new Error(
        "Access denied: You can only share your own conversations"
      );
    }

    // Find the user to share with
    const sharedWithUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.sharedWithEmail))
      .first();

    if (!sharedWithUser) {
      throw new Error("User not found with that email address");
    }

    const sharedByUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!sharedByUser) {
      throw new Error("Sharing user not found");
    }

    // Check if already shared
    const existingShare = await ctx.db
      .query("conversationShares")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("sharedWithUserId"), sharedWithUser._id))
      .first();

    const now = Date.now();

    if (existingShare) {
      // Update existing share
      await ctx.db.patch(existingShare._id, {
        permissions: args.permissions,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return existingShare._id;
    } else {
      // Create new share
      const shareId = await ctx.db.insert("conversationShares", {
        conversationId: args.conversationId,
        sharedByUserId: sharedByUser._id,
        sharedWithUserId: sharedWithUser._id,
        sharedWithEmail: args.sharedWithEmail,
        permissions: args.permissions,
        expiresAt: args.expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      // Update conversation to mark as shared
      await ctx.db.patch(args.conversationId, {
        isShared: true,
        sharedWith: [
          ...(conversation.sharedWith || []),
          sharedWithUser.clerkId,
        ],
        updatedAt: now,
      });

      return shareId;
    }
  },
});

// Get shared conversations for a user
export const getSharedConversations = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      // Return empty array instead of throwing error for new users
      return [];
    }

    const shares = await ctx.db
      .query("conversationShares")
      .withIndex("by_shared_with", (q) => q.eq("sharedWithUserId", user._id))
      .collect();

    const conversations = await Promise.all(
      shares.map(async (share) => {
        const conversation = await ctx.db.get(share.conversationId);
        const sharedByUser = await ctx.db.get(share.sharedByUserId);

        if (conversation && sharedByUser) {
          return {
            ...conversation,
            sharedBy: sharedByUser,
            permissions: share.permissions,
            sharedAt: share.createdAt,
          };
        }
        return null;
      })
    );

    return conversations.filter(Boolean);
  },
});
