"use client";

import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { useConvexUser } from "@/src/presentation/hooks/use-convex-user";
import { ChatSettingsPanel } from "@/src/presentation/components/settings/chat-settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { convexUser, isLoaded } = useConvexUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-foreground/70 font-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 lg:p-8 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-secondary-background rounded-base border-2 border-border touch-manipulation"
              aria-label="Go back"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading text-foreground mb-1 sm:mb-2">
                Profile & Settings
              </h1>
              <p className="text-sm sm:text-base text-foreground/70 font-base">
                Manage your account and chat preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="account"
              className="text-xs sm:text-sm hover:bg-secondary-background/50 hover:text-foreground/90 dark:hover:bg-white/10 dark:hover:text-white/90 transition-all duration-150 ease-out"
            >
              Account Settings
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="text-xs sm:text-sm hover:bg-secondary-background/50 hover:text-foreground/90 dark:hover:bg-white/10 dark:hover:text-white/90 transition-all duration-150 ease-out"
            >
              Chat Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account information, security settings, and
                  profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="w-full overflow-hidden max-w-full">
                  <UserProfile
                    appearance={{
                      elements: {
                        card: "shadow-none border-0 bg-transparent w-full max-w-none",
                        rootBox: "w-full",
                        headerTitle: "text-foreground font-heading",
                        headerSubtitle: "text-foreground/70 font-base",
                        formButtonPrimary:
                          "bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow transition-all",
                        formFieldInput:
                          "border-2 border-border rounded-base bg-secondary-background text-foreground focus:ring-2 focus:ring-black",
                        formFieldLabel: "text-foreground font-base",
                        profileSectionPrimaryButton:
                          "bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow transition-all",
                        profileSection: "w-full max-w-none",
                        profileSectionContent: "w-full max-w-none",
                        page: "w-full max-w-none",
                        navbar: "w-full max-w-none overflow-x-auto",
                        navbarButton: "whitespace-nowrap",
                      },
                      layout: {
                        unsafe_disableDevelopmentModeWarnings: true,
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <ChatSettingsPanel />

            {/* User Stats */}
            {convexUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details and usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/70 font-base">
                        Member since:
                      </span>
                      <span className="text-foreground font-base">
                        {new Date(convexUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/70 font-base">
                        Last updated:
                      </span>
                      <span className="text-foreground font-base">
                        {new Date(convexUser.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Navigation Back */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link
            href="/chat"
            className="inline-flex items-center px-4 py-2 bg-secondary-background text-foreground border-2 border-border rounded-base hover:bg-main hover:text-main-foreground transition-all font-base touch-manipulation"
          >
            ← Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
