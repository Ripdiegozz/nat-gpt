import { MessageDTO } from "./message.dto";

export interface ConversationDTO {
  id: string;
  title: string;
  messages: MessageDTO[];
  createdAt: string;
  updatedAt: string;
  messageCount?: number; // Add optional messageCount for display
}
