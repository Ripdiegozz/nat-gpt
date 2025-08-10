import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Message } from "../../../domain/entities/message"
import { Bot, User } from "lucide-react"

interface MessageComponentProps {
  message: Message
  className?: string
}

export function MessageComponent({ message, className }: MessageComponentProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          "text-xs font-heading",
          isUser ? "bg-main text-main-foreground" : "bg-secondary-background text-foreground"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <Card className={cn(
        "max-w-[80%] p-3",
        isUser 
          ? "bg-main text-main-foreground border-border" 
          : "bg-secondary-background text-foreground border-border"
      )}>
        <div className="text-sm font-base whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="text-xs opacity-70 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </Card>
    </div>
  )
}