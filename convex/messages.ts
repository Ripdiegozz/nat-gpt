import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Add a new message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
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
  },
  handler: async (ctx, args) => {
    // Verify the conversation exists and user has access
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check access permissions
    const hasWriteAccess = conversation.clerkUserId === args.clerkUserId;

    if (!hasWriteAccess) {
      // Check if user has write permissions through sharing
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
        .first();

      if (user) {
        const share = await ctx.db
          .query("conversationShares")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", args.conversationId)
          )
          .filter((q) => q.eq(q.field("sharedWithUserId"), user._id))
          .first();

        if (!share || !share.permissions.canWrite) {
          throw new Error(
            "Access denied: You don't have permission to add messages to this conversation"
          );
        }
      } else {
        throw new Error("User not found");
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: user._id,
      clerkUserId: args.clerkUserId,
      role: args.role,
      content: args.content,
      metadata: args.metadata,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation's updatedAt timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: now,
    });

    return messageId;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify access to conversation
    const conversation = await ctx.db.get(args.conversationId);
    
    // Return empty array if conversation doesn't exist (instead of throwing error)
    if (!conversation) {
      return [];
    }

    const hasAccess =
      conversation.clerkUserId === args.clerkUserId ||
      conversation.sharedWith?.includes(args.clerkUserId);

    if (!hasAccess) {
      // Check sharing permissions
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
        .first();

      if (user) {
        const share = await ctx.db
          .query("conversationShares")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", args.conversationId)
          )
          .filter((q) => q.eq(q.field("sharedWithUserId"), user._id))
          .first();

        if (!share || !share.permissions.canRead) {
          throw new Error("Access denied to this conversation");
        }
      } else {
        throw new Error("Access denied to this conversation");
      }
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only the message author can edit their messages
    if (message.clerkUserId !== args.clerkUserId) {
      throw new Error("Access denied: You can only edit your own messages");
    }

    const now = Date.now();

    // Add current content to edit history
    const editHistory = message.editHistory || [];
    editHistory.push({
      content: message.content,
      editedAt: now,
    });

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true,
      editHistory,
      updatedAt: now,
    });

    // Update conversation timestamp
    await ctx.db.patch(message.conversationId, {
      updatedAt: now,
    });
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check permissions - user can delete their own messages, or if they have delete permissions on the conversation
    let canDelete = message.clerkUserId === args.clerkUserId;

    if (!canDelete) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
        .first();

      if (user) {
        const share = await ctx.db
          .query("conversationShares")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", message.conversationId)
          )
          .filter((q) => q.eq(q.field("sharedWithUserId"), user._id))
          .first();

        canDelete = share?.permissions.canDelete || false;
      }
    }

    if (!canDelete) {
      throw new Error(
        "Access denied: You don't have permission to delete this message"
      );
    }

    await ctx.db.delete(args.messageId);

    // Update conversation timestamp
    await ctx.db.patch(message.conversationId, {
      updatedAt: Date.now(),
    });
  },
});

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    clerkUserId: v.string(),
    type: v.union(v.literal("like"), v.literal("dislike"), v.literal("heart")),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user has access to the conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const hasAccess =
      conversation.clerkUserId === args.clerkUserId ||
      conversation.sharedWith?.includes(args.clerkUserId);

    if (!hasAccess) {
      throw new Error("Access denied to this conversation");
    }

    const reactions = message.reactions || [];
    const existingReactionIndex = reactions.findIndex(
      (r) => r.userId === args.clerkUserId
    );

    if (existingReactionIndex >= 0) {
      // Update existing reaction
      reactions[existingReactionIndex] = {
        userId: args.clerkUserId,
        type: args.type,
        createdAt: Date.now(),
      };
    } else {
      // Add new reaction
      reactions.push({
        userId: args.clerkUserId,
        type: args.type,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.messageId, {
      reactions,
      updatedAt: Date.now(),
    });
  },
});

// Remove reaction from a message
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const reactions = (message.reactions || []).filter(
      (r) => r.userId !== args.clerkUserId
    );

    await ctx.db.patch(args.messageId, {
      reactions,
      updatedAt: Date.now(),
    });
  },
});

// Get message statistics for a conversation
export const getMessageStats = query({
  args: {
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify access
    const conversation = await ctx.db.get(args.conversationId);
    
    // Return empty stats if conversation doesn't exist
    if (!conversation) {
      return {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        systemMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
      };
    }

    const hasAccess =
      conversation.clerkUserId === args.clerkUserId ||
      conversation.sharedWith?.includes(args.clerkUserId);

    if (!hasAccess) {
      throw new Error("Access denied to this conversation");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const stats = {
      totalMessages: messages.length,
      userMessages: messages.filter((m) => m.role === "user").length,
      assistantMessages: messages.filter((m) => m.role === "assistant").length,
      totalTokens: messages.reduce(
        (sum, m) => sum + (m.metadata?.tokens || 0),
        0
      ),
      averageResponseTime: 0,
      editedMessages: messages.filter((m) => m.isEdited).length,
    };

    // Calculate average response time
    const responseTimes = messages
      .filter((m) => m.metadata?.processingTime)
      .map((m) => m.metadata!.processingTime!);

    if (responseTimes.length > 0) {
      stats.averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;
    }

    return stats;
  },
});
