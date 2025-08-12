import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getOpenRouterConfig } from "@/src/infrastructure/config/openrouter";

// Force Node.js runtime
export const runtime = "nodejs";

// Get OpenRouter client configured for TTS
function getClient() {
  const config = getOpenRouterConfig();
  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, voice = "alloy" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate text length (max 4096 characters for most TTS services)
    if (text.length > 4096) {
      return NextResponse.json(
        { error: "Text too long. Maximum 4096 characters allowed." },
        { status: 400 }
      );
    }

    console.log("Converting text to speech:", {
      textLength: text.length,
      voice,
    });

    const client = getClient();

    // Generate speech with PlayAI TTS model
    const response = await client.audio.speech.create({
      model: "playai-tts", // PlayAI TTS model
      voice: voice as string, // Voice selection
      input: text,
      response_format: "mp3",
    });

    // Convert response to buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    console.log("TTS generation successful:", {
      audioSize: audioBuffer.length,
    });

    // Return audio as response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error: unknown) {
    console.error("TTS error:", error);

    const message = (error as Error)?.message || "Unknown error";

    // Handle specific errors
    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (message.includes("invalid model")) {
      return NextResponse.json(
        { error: "TTS model not available. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate speech. Please try again." },
      { status: 500 }
    );
  }
}
