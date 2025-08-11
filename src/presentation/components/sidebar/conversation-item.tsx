import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversationDTO } from "../../../application/dtos/conversation.dto";
import { cn } from "@/lib/utils";
import { MessageCircle, Trash2, MoreHorizontal, Edit3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface ConversationItemProps {
  conversation: ConversationDTO;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename?: (newTitle: string) => void;
  isCollapsed?: boolean;
  className?: string;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  isCollapsed = false,
  className,
}: ConversationItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNewTitle(conversation.title);
    setShowRenameDialog(true);
  };

  const confirmRename = () => {
    if (onRename && newTitle.trim() && newTitle.trim() !== conversation.title) {
      onRename(newTitle.trim());
    }
    setShowRenameDialog(false);
  };

  const cancelRename = () => {
    setShowRenameDialog(false);
    setNewTitle(conversation.title);
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
        "group relative rounded-base border-2 transition-all cursor-pointer w-full max-w-full overflow-hidden",
        isActive
          ? "bg-background border-border/30 hover:border-border/50"
          : "bg-secondary-background/50 text-foreground border-border/50",
        className
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 p-3 w-full">
        <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading truncate">
              {conversation.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="neutral"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-80 bg-transparent hover:bg-secondary-background/50"
              aria-label="More options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-background border-border/50"
          >
            <DropdownMenuItem
              onSelect={(e) => e.stopPropagation()}
              onClick={handleRename}
              className="bg-background text-foreground/80 hover:text-foreground"
            >
              <Edit3 className="h-3 w-3 mr-2 opacity-70" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.stopPropagation()}
              onClick={handleDelete}
              className="text-red-400/80 hover:text-red-500 hover:bg-red-50/50 focus:bg-red-50/50 bg-background"
            >
              <Trash2 className="h-3 w-3 mr-2 opacity-70" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  confirmRename();
                } else if (e.key === "Escape") {
                  cancelRename();
                }
              }}
              placeholder="Conversation name"
              className="w-full"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRename}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRename}
              disabled={
                !newTitle.trim() || newTitle.trim() === conversation.title
              }
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation "
              {conversation.title}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500/90 hover:bg-red-600/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
