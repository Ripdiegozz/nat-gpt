"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";

export function useConvexUser() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Auto-create or update user when Clerk user is loaded
  useEffect(() => {
    if (isUserLoaded && user && convexUser === null) {
      // Only create user if query completed and returned null (user doesn't exist)
      createOrUpdateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || user.firstName || "",
        imageUrl: user.imageUrl,
      }).catch((error) => {
        console.error("Failed to create user:", error);
      });
    }
  }, [isUserLoaded, user, convexUser, createOrUpdateUser]);

  return {
    clerkUser: user,
    convexUser,
    isLoaded: isUserLoaded && convexUser !== undefined,
    isSignedIn: !!user,
  };
}

export function useUserPreferences() {
  const { convexUser } = useConvexUser();
  const updatePreferences = useMutation(api.users.updateUserPreferences);

  const updateUserPreferences = async (preferences: {
    theme?: "light" | "dark" | "system";
    aiModel?: string;
    language?: string;
    maxTokens?: number;
  }) => {
    if (!convexUser) throw new Error("User not found");

    return await updatePreferences({
      userId: convexUser._id,
      preferences,
    });
  };

  return {
    preferences: convexUser?.preferences,
    updatePreferences: updateUserPreferences,
  };
}
