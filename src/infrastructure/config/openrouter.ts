// Server-only helper to read and validate OpenRouter environment variables
export type OpenRouterConfig = {
  apiKey: string;
  baseURL: string;
  referer: string;
  title: string;
};

export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const baseURL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const referer = process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
  const title = process.env.OPENROUTER_SITE_TITLE || "NatGPT";
  return { apiKey, baseURL, referer, title };
}

export function assertOpenRouterConfigured(): void {
  const { apiKey } = getOpenRouterConfig();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is required on the server"
    );
  }
}
