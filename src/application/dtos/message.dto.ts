export interface MessageDTO {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  audioUrl?: string
  audioMetadata?: {
    duration: number
    transcribed: boolean
    originalAudio?: boolean
  }
}