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
        "group relative rounded-base border-2 transition-all cursor-pointer w-full max-w-full overflow-hidden h-14",
        isActive
          ? "bg-background border-border/30 hover:border-border/50"
          : "bg-secondary-background/50 text-foreground border-border/50 hover:bg-secondary-background/70",
        className
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 px-3 py-2 h-full pr-16">
        <MessageCircle className="h-4 w-4 shrink-0" />

        <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
          <h3
            className="text-sm font-heading leading-tight"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {conversation.title.length > 22
              ? `${conversation.title.substring(0, 22)}...`
              : conversation.title}
          </h3>

          {/* Gradient fade effect for long text - adapts to background color */}
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-12 pointer-events-none",
              isActive
                ? "bg-gradient-to-l from-background to-transparent"
                : "bg-gradient-to-l from-secondary-background/50 group-hover:from-secondary-background/70 to-transparent"
            )}
          />
        </div>
      </div>

      {/* Actions - Always visible, positioned at the right */}
      <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-60 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="neutral"
              size="icon"
              className="h-6 w-6 bg-background hover:bg-background/80 border border-border/50 shadow-sm hover:shadow-md"
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
              This action cannot be undone. The conversation &ldquo;
              {conversation.title}&rdquo; will be permanently deleted.
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
