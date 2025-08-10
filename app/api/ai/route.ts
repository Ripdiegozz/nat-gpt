import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenRouterConfig } from "@/src/infrastructure/config/openrouter";
import { readFile } from "fs/promises";
import { join } from "path";

// Force Node.js runtime so the OpenAI SDK can run server-side
export const runtime = "nodejs";

const MODEL_DEFAULT = "google/gemini-2.0-flash-exp:free";

// Load NatGPT system prompt
async function getSystemPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), "docs", "natgpt-system-prompt.md");
    const content = await readFile(promptPath, "utf-8");
    // Remove the markdown formatting and just return the content
    return content
      .replace(/^# .*$/gm, "")
      .replace(/^## .*$/gm, "")
      .trim();
  } catch (error) {
    console.warn("Could not load system prompt, using fallback:", error);
    return `You are NatGPT, an advanced AI assistant that provides access to multiple state-of-the-art language models through a unified, intelligent interface. You dynamically leverage the best model for each task while maintaining consistent personality and service quality.

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
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, context = [], model } = (await req.json()) as PostBody;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const client = getClient();
    const systemPrompt = await getSystemPrompt();
    const selectedModel = model || MODEL_DEFAULT;

    // Build messages array with system prompt first
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];

    // Add conversation context
    for (const msg of context) {
      if (msg && (msg.role === "user" || msg.role === "assistant")) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user prompt
    messages.push({ role: "user", content: prompt });

    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages,
      temperature: 0.7,
      // max_tokens is optional; OpenRouter enforces model caps
    });

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

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.log("AI request error:", error);
    const message = (error as Error)?.message || "Unknown error";
    const status =
      message.toLowerCase().includes("api key") || message.includes("401")
        ? 401
        : (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
