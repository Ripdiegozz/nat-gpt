export interface MessageDTO {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}