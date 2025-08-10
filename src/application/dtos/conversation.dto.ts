import { MessageDTO } from './message.dto'

export interface ConversationDTO {
  id: string
  title: string
  messages: MessageDTO[]
  createdAt: string
  updatedAt: string
}