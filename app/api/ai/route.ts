import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { getOpenRouterConfig } from "@/src/infrastructure/config/openrouter";
import { readFile } from "fs/promises";
import { join } from "path";

// Force Node.js runtime so the OpenAI SDK can run server-side
export const runtime = "nodejs";

const MODEL_DEFAULT = "compound-beta";

// Load NatGPT system prompt
async function getSystemPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), "docs", "natgpt-system-prompt.md");
    const content = await readFile(promptPath, "utf-8");
    // Remove markdown headers but keep the content
    return content
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .trim();
  } catch (error) {
    console.warn("Could not load system prompt, using fallback:", error);
    return `You are NatGPT, an advanced AI assistant that provides helpful, accurate, and engaging responses. You maintain a consistent personality and high service quality across all interactions.

IMPORTANT: Never mention which AI model you are or reference any specific AI technology (GPT, Gemini, Claude, etc.). Simply respond as NatGPT without revealing your underlying technology.

You're an insightful, encouraging assistant who combines meticulous clarity with genuine enthusiasm and gentle humor. Be direct and actionable, avoid hedging questions at the end of responses.`;
  }
}

function getClient(): OpenAI {
  const { apiKey, baseURL, referer, title } = getOpenRouterConfig();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is required on the server"
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
    getClient();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { ok: false, error: "AI service not configured:", e },
      { status: 503 }
    );
  }
}

type PostBody = {
  prompt: string;
  context?: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  isFirstMessage?: boolean; // Flag to indicate if this is the first message in a conversation
};

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const {
      prompt,
      context = [],
      model,
      isFirstMessage = false
    } = (await req.json()) as PostBody;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const client = getClient();
    const selectedModel = model || MODEL_DEFAULT;

    // Use the system prompt and modify for first message if needed
    let systemPrompt = await getSystemPrompt();
    
    // For first messages, add title generation instruction
    if (isFirstMessage) {
      systemPrompt += `\n\nIMPORTANT: Since this is the first message in a new conversation, please start your response with a conversation title on the first line in the format "Title: [Your Title Here]" followed by a blank line, then your main response. The title should be concise (2-6 words) and capture the main topic or question.`;
    }

    // Build messages array with system prompt first
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];

    // Add conversation context for regular chat
    for (const msg of context) {
      if (msg && (msg.role === "user" || msg.role === "assistant")) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    // Add current user prompt
    messages.push({ role: "user", content: prompt });

    // Retry logic for rate limiting
    let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        completion = await client.chat.completions.create({
          model: selectedModel,
          messages,
          temperature: 0.7,
          // max_tokens is optional; OpenRouter enforces model caps
        });
        break; // Success, exit retry loop
      } catch (error: unknown) {
        const apiError = error as { status?: number; message?: string };
        if (apiError.status === 429 && retries < maxRetries - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(
            `Rate limited, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error; // Re-throw if not 429 or max retries reached
        }
      }
    }

    // Check if completion was successful
    if (!completion) {
      return NextResponse.json(
        { error: "Failed to get response from AI service after retries" },
        { status: 503 }
      );
    }

    const choice = completion.choices?.[0]?.message;
    const raw = choice?.content ?? "";
    const text = Array.isArray(raw)
      ? raw
          .map((p: unknown) =>
            typeof p === "string" ? p : (p as { text?: string })?.text ?? ""
          )
          .join(" ")
          .trim()
      : String(raw || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    // Extract title if present (for first messages or when user explicitly requests it)
    let responseText = text;
    let title: string | undefined;

    // Check if AI provided a title line (for first messages)
    if (text.startsWith("Title: ") || text.startsWith("Subject: ")) {
      const lines = text.split("\n");
      const titleLine = lines[0];

      // Extract title from "Title: Title Here" or "Subject: Title Here" format
      title = titleLine.replace(/^(Title|Subject): /, "").trim();

      // Remove the title line from the response
      responseText = lines.slice(1).join("\n").trim();

      // Remove any leading empty lines
      responseText = responseText.replace(/^\n+/, "");
    }

    const response: { text: string; title?: string } = { text: responseText };
    if (title) {
      response.title = title;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.log("AI request error:", error);
    const message = (error as Error)?.message || "Unknown error";
    const errorStatus = (error as { status?: number })?.status;

    let status = 500;
    let userMessage = message;

    if (message.toLowerCase().includes("api key") || message.includes("401")) {
      status = 401;
    } else if (errorStatus === 429) {
      status = 429;
      userMessage =
        "The AI service is currently experiencing high demand. Please try again in a few moments.";
    } else if (errorStatus) {
      status = errorStatus;
    }

    return NextResponse.json({ error: userMessage }, { status });
  }
}
