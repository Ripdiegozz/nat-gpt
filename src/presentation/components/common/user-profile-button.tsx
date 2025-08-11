"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexUser } from "@/src/presentation/hooks/use-convex-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, LogOutIcon, ChevronDownIcon } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const { clerkUser, isLoaded } = useConvexUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isLoaded || !clerkUser) {
    return (
      <div className="w-8 h-8 rounded-full bg-secondary-background border-2 border-border animate-pulse" />
    );
  }

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    router.push("/profile");
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  const userInitials =
    clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName[0]}${clerkUser.lastName[0]}`
      : clerkUser.fullName
      ? clerkUser.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
      : clerkUser.emailAddresses[0]?.emailAddress[0] || "U";

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="neutral"
        size="icon"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 touch-manipulation"
        aria-label="User menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
          <AvatarImage
            src={clerkUser.imageUrl}
            alt={clerkUser.fullName || "User avatar"}
          />
          <AvatarFallback className="text-xs sm:text-sm font-base bg-main text-main-foreground">
            {userInitials.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <ChevronDownIcon className="h-2 w-2 sm:h-3 sm:w-3 absolute -bottom-1 -right-1 bg-background rounded-full" />
      </Button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-secondary-background border-2 border-border rounded-base shadow-shadow z-50">
            <div className="p-3 border-b-2 border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={clerkUser.imageUrl}
                    alt={clerkUser.fullName || "User avatar"}
                  />
                  <AvatarFallback className="text-xs font-base bg-main text-main-foreground">
                    {userInitials.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-base text-foreground truncate">
                    {clerkUser.fullName || "User"}
                  </div>
                  <div className="text-xs text-foreground/60 truncate">
                    {clerkUser.emailAddresses[0]?.emailAddress}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-1">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-base text-foreground hover:bg-background rounded-base transition-colors touch-manipulation"
                aria-label="View profile"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-base text-foreground hover:bg-background rounded-base transition-colors touch-manipulation"
                aria-label="Sign out"
              >
                <LogOutIcon className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
