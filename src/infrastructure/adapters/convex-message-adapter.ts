import { Message } from "../../domain/entities/message";
import { MessageId } from "../../domain/value-objects/message-id";
import { MessageRole } from "../../domain/enums/message-role";
import { Id } from "../../../convex/_generated/dataModel";
import { AIContextMessage } from "../services/client-ai-service-adapter";

export interface ConvexMessage {
  _id: Id<"messages">;
  _creationTime: number;
  conversationId: Id<"conversations">;
  userId: Id<"users">;
  clerkUserId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
    processingTime?: number;
  };
  isEdited?: boolean;
  editHistory?: Array<{
    content: string;
    editedAt: number;
  }>;
  reactions?: Array<{
    userId: string;
    type: "like" | "dislike" | "heart";
    createdAt: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export class ConvexMessageAdapter {
  static toDomainMessage(convexMessage: ConvexMessage): Message {
    const role =
      convexMessage.role === "user" ? MessageRole.USER : MessageRole.ASSISTANT;

    return new Message(
      new MessageId(convexMessage._id),
      convexMessage.content,
      role,
      new Date(convexMessage.createdAt)
    );
  }

  static toDomainMessages(convexMessages: ConvexMessage[]): Message[] {
    return convexMessages.map((msg) => this.toDomainMessage(msg));
  }

  static toAIServiceContext(
    convexMessages: ConvexMessage[]
  ): AIContextMessage[] {
    return convexMessages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));
  }
}
