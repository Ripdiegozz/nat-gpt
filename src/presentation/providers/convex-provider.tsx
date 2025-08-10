"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-main text-main-foreground border-2 border-border rounded-base hover:shadow-shadow transition-all",
          card: "shadow-shadow border-2 border-border rounded-base bg-background",
          headerTitle: "text-foreground font-heading",
          headerSubtitle: "text-foreground/70 font-base",
          socialButtonsBlockButton:
            "border-2 border-border rounded-base bg-secondary-background text-foreground hover:bg-main hover:text-main-foreground transition-all",
          formFieldInput:
            "border-2 border-border rounded-base bg-secondary-background text-foreground focus:ring-2 focus:ring-black",
          formFieldLabel: "text-foreground font-base",
          footerActionLink: "text-main hover:text-main/80",
          dividerLine: "bg-border",
          dividerText: "text-foreground/60 font-base",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
