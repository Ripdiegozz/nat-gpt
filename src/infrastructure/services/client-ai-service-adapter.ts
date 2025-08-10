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

  constructor(config: ClientAIConfig = {}) {
    this.endpoint = config.endpoint ?? "/api/ai";
  }

  async generateResponse(
    prompt: string,
    context: Message[] | AIContextMessage[],
    options?: { model?: string }
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

    const data = (await res.json()) as { text: string };
    if (!data.text) throw new Error("Empty response from AI");
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
}
