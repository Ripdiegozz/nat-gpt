import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversationDTO } from "../../../application/dtos/conversation.dto";
import { cn } from "@/lib/utils";
import { MessageCircle, Trash2, MoreHorizontal } from "lucide-react";

interface ConversationItemProps {
  conversation: ConversationDTO;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isCollapsed?: boolean;
  className?: string;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  isCollapsed = false,
  className,
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const getPreviewText = () => {
    if (conversation.messages.length === 0) {
      return "New conversation";
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return (
      lastMessage.content.slice(0, 50) +
      (lastMessage.content.length > 50 ? "..." : "")
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (isCollapsed) {
    return (
      <Button
        variant={isActive ? "default" : "neutral"}
        size="icon"
        onClick={onSelect}
        className={cn("w-full h-12", className)}
        aria-label={`Select conversation: ${conversation.title}`}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-base border-2 transition-all cursor-pointer",
        isActive
          ? "bg-main text-main-foreground border-border shadow-shadow"
          : "bg-background hover:bg-secondary-background border-border hover:shadow-shadow",
        className
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3 p-3">
        <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-heading truncate">
              {conversation.title}
            </h3>
            <span className="text-xs opacity-70 shrink-0 ml-2">
              {formatDate(conversation.updatedAt)}
            </span>
          </div>

          <p className="text-xs opacity-70 line-clamp-2 font-base">
            {getPreviewText()}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-50">
              {conversation.messages.length} message
              {conversation.messages.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="neutral"
            size="icon"
            onClick={handleDelete}
            className="h-6 w-6 opacity-70 hover:opacity-100"
            aria-label="Delete conversation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
