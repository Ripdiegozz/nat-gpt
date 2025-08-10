import { MessageDTO } from "./message.dto";

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  model?: string;
}

export interface SendMessageResponse {
  userMessage: MessageDTO;
  aiMessage: MessageDTO;
  conversationId: string;
}
