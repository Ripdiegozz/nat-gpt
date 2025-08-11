"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="min-w-screen max-w-md flex flex-col items-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-foreground mb-2">
            Join NatGPT
          </h1>
          <p className="text-foreground/70 font-base">
            Create your account to start chatting with AI
          </p>
        </div>

        <SignUp
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
          signInUrl="/sign-in"
          fallbackRedirectUrl="/chat"
        />
      </div>
    </div>
  );
}
