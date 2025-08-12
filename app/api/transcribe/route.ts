import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenRouterConfig } from "@/src/infrastructure/config/openrouter";

// Force Node.js runtime for file handling
export const runtime = "nodejs";

function getClient(): OpenAI {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (openaiApiKey) {
    console.log("🎤 [TRANSCRIBE] Using direct OpenAI API for transcription");
    return new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  // Use OpenRouter for transcription (it does support whisper models)
  console.log("🎤 [TRANSCRIBE] Using OpenRouter for transcription");
  const { apiKey, baseURL, referer, title } = getOpenRouterConfig();
  if (!apiKey) {
    throw new Error(
      "Neither OPENAI_API_KEY nor OPENROUTER_API_KEY environment variable is set"
    );
  }

  return new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": referer,
      "X-Title": title,
    },
  });
}

export async function GET() {
  try {
    // Simple availability check
    console.log("🎤 [TRANSCRIBE] Checking service availability...");
    getClient();
    console.log("🎤 [TRANSCRIBE] Service available");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("🎤 [TRANSCRIBE] Service not available:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Transcription service not configured. Need OPENAI_API_KEY or OPENROUTER_API_KEY.",
      },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("🎤 [TRANSCRIBE] Starting transcription request");

  try {
    console.log("🎤 [TRANSCRIBE] Parsing form data...");
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "auto"; // Get language preference

    console.log("🎤 [TRANSCRIBE] Audio file received:", {
      name: audioFile?.name,
      size: audioFile?.size,
      type: audioFile?.type,
      hasFile: !!audioFile,
    });

    if (!audioFile) {
      console.log("🎤 [TRANSCRIBE] ERROR: No audio file provided");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for OpenAI Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    console.log("🎤 [TRANSCRIBE] File size check:", {
      size: audioFile.size,
      maxSize,
      sizeInMB: (audioFile.size / 1024 / 1024).toFixed(2),
    });

    if (audioFile.size > maxSize) {
      console.log("🎤 [TRANSCRIBE] ERROR: File too large");
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Validate file type (support formats with and without codecs)
    const allowedTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ];

    // Check if the main type is supported (ignore codec specifications)
    const mainType = audioFile.type.split(";")[0];
    console.log("🎤 [TRANSCRIBE] File type check:", {
      originalType: audioFile.type,
      mainType,
      isAllowed: allowedTypes.includes(mainType),
      allowedTypes,
    });

    if (!allowedTypes.includes(mainType)) {
      console.log("🎤 [TRANSCRIBE] ERROR: Unsupported audio format");
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}` },
        { status: 400 }
      );
    }

    console.log("🎤 [TRANSCRIBE] Getting OpenAI client...");
    const client = getClient();
    console.log("🎤 [TRANSCRIBE] OpenAI client created successfully");

    // Convert File to the format expected by OpenAI
    console.log("🎤 [TRANSCRIBE] Converting file format...");
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

    // Create a File object with proper extension
    const extension = audioFile.type.split("/")[1]?.split(";")[0] || "webm";
    const fileName = `audio.${extension}`;
    const file = new File([audioBlob], fileName, { type: audioFile.type });

    console.log("🎤 [TRANSCRIBE] File prepared for OpenAI:", {
      fileName,
      extension,
      fileSize: file.size,
      fileType: file.type,
    });

    // Use OpenAI Whisper for transcription
    console.log("🎤 [TRANSCRIBE] Calling OpenAI Whisper API...");

    // Determine which model and settings to use based on the API
    const isDirectOpenAI = !!process.env.OPENAI_API_KEY;
    const model = isDirectOpenAI ? "whisper-1" : "whisper-large-v3-turbo";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transcriptionParams: any = {
      file: file,
      model: model,
      response_format: "verbose_json", // Get confidence scores
    };

    // ONLY support Spanish and English - force one of these languages
    const supportedLanguages = ["en", "es"];
    if (language && supportedLanguages.includes(language)) {
      transcriptionParams.language = language;
      console.log("🎤 [TRANSCRIBE] Using specified language:", language);
    } else {
      // Force English as default - NO auto-detection to prevent other languages
      transcriptionParams.language = "en";
      console.log(
        "🎤 [TRANSCRIBE] Forcing English language (only EN/ES supported)"
      );
    }

    const transcription = await client.audio.transcriptions.create(
      transcriptionParams
    );

    console.log("🎤 [TRANSCRIBE] OpenAI response received:", {
      hasText: !!transcription.text,
      textLength: transcription.text?.length || 0,
      textPreview: transcription.text?.substring(0, 100) + "...",
    });

    if (!transcription.text || transcription.text.trim().length === 0) {
      console.log("🎤 [TRANSCRIBE] ERROR: No speech detected");
      return NextResponse.json(
        { error: "No speech detected in audio" },
        { status: 400 }
      );
    }

    const response = {
      text: transcription.text.trim(),
      language: transcriptionParams.language, // Use the language we specified
      duration: 0, // Duration not available in basic response
      confidence: 0.9, // Default high confidence for successful transcriptions
    };

    console.log("🎤 [TRANSCRIBE] SUCCESS: Returning transcription result");
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("🎤 [TRANSCRIBE] ERROR: Transcription failed:", error);
    console.error("🎤 [TRANSCRIBE] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cause: (error as any)?.cause,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (error as any)?.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code: (error as any)?.code,
    });

    const message = (error as Error)?.message || "Unknown error";
    let status = 500;
    let userMessage = "Failed to transcribe audio";

    if (message.toLowerCase().includes("api key") || message.includes("401")) {
      status = 401;
      userMessage = "Authentication failed";
      console.log("🎤 [TRANSCRIBE] ERROR TYPE: Authentication failed");
    } else if (message.includes("429")) {
      status = 429;
      userMessage = "Too many requests. Please try again later.";
      console.log("🎤 [TRANSCRIBE] ERROR TYPE: Rate limited");
    } else if (message.includes("file")) {
      status = 400;
      userMessage = message;
      console.log("🎤 [TRANSCRIBE] ERROR TYPE: File error");
    } else {
      console.log("🎤 [TRANSCRIBE] ERROR TYPE: Unknown server error");
    }

    console.log("🎤 [TRANSCRIBE] Returning error response:", {
      status,
      userMessage,
    });
    return NextResponse.json({ error: userMessage }, { status });
  }
}
