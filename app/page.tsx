"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Only redirect to chat if user is signed in
      // If not signed in, middleware will handle redirect to sign-in
      router.push("/chat");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while determining authentication status
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
        <p className="text-foreground/70 font-base">Loading...</p>
      </div>
    </div>
  );
}
