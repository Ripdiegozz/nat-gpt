import { AIService } from "../../domain/services/ai-service";
import { Message } from "../../domain/entities/message";
import { MessageRole } from "../../domain/enums/message-role";

export interface ClientAIConfig {
  endpoint?: string; // default /api/ai
}

// Simple message interface for AI context
export interface AIContextMessage {
  role: "user" | "assistant";
  content: string;
}

export class ClientAIServiceAdapter implements AIService {
  private readonly endpoint: string;
  private lastGeneratedTitle: string | null = null;

  constructor(config: ClientAIConfig = {}) {
    this.endpoint = config.endpoint ?? "/api/ai";
  }

  async generateResponse(
    prompt: string,
    context: Message[] | AIContextMessage[],
    options?: { model?: string; isFirstMessage?: boolean }
  ): Promise<string> {
    if (!prompt.trim()) throw new Error("Prompt cannot be empty");

    // Convert context to the correct format
    let contextMessages: AIContextMessage[];

    if (context.length > 0 && "id" in context[0]) {
      // It's Message[] - convert to AIContextMessage[]
      contextMessages = (context as Message[]).map((m) => ({
        role: m.role === MessageRole.USER ? "user" : "assistant",
        content: m.content,
      }));
    } else {
      // It's already AIContextMessage[]
      contextMessages = context as AIContextMessage[];
    }

    const body = {
      prompt,
      context: contextMessages,
      isFirstMessage: options?.isFirstMessage || false,
      ...(options?.model && { model: options.model }),
    };

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `AI request failed with ${res.status}`);
    }

    const data = (await res.json()) as { text: string; title?: string };
    if (!data.text) throw new Error("Empty response from AI");

    // Store title for later retrieval if this was the first message
    if (options?.isFirstMessage && data.title) {
      this.lastGeneratedTitle = data.title;
    }

    return data.text;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(this.endpoint, { method: "GET" });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data?.ok;
    } catch {
      return false;
    }
  }

  getMaxTokens(): number {
    // Mirror server config default
    return 8192;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate a conversation title based on the first message
   * Now optimized to use title from combined response when available
   */
  async generateTitle(prompt: string, model?: string): Promise<string> {
    if (!prompt.trim()) throw new Error("Prompt cannot be empty");

    // If we have a recently generated title from a combined response, use it
    if (this.lastGeneratedTitle) {
      const title = this.lastGeneratedTitle;
      this.lastGeneratedTitle = null; // Clear it after use
      return title;
    }

    // Fallback: make a request with isFirstMessage flag to get combined response
    // This should generally not happen if the UI correctly sets isFirstMessage
    const body = {
      prompt,
      context: [], // No context for title generation
      isFirstMessage: true,
      ...(model && { model }),
    };

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();
    if (!data.title && !data.text) {
      throw new Error("Invalid response format");
    }

    // Use extracted title if available, otherwise generate from response
    let title = data.title || data.text.split("\n")[0] || "New Conversation";

    // Clean up the title and ensure it's reasonable length
    title = title.trim();

    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, "");

    // Limit to reasonable length
    if (title.length > 50) {
      title = title.substring(0, 50).trim();
      // Try to end at a word boundary
      const lastSpace = title.lastIndexOf(" ");
      if (lastSpace > 20) {
        title = title.substring(0, lastSpace);
      }
    }

    return title || "New Conversation"; // Fallback title
  }
}
