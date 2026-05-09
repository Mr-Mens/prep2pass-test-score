import "server-only";

const DEFAULT_MODEL = "gpt-5.4-mini";
/** Sufficient for a few rate-limit retries; insufficient_quota fails fast (no long retry chain). */
const DEFAULT_TIMEOUT_MS = 25000;

export function getOpenAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

/** OpenAI returns JSON `{ error: { message, code, type } }` on failures. */
async function parseOpenAiErrorResponse(
  response: Response,
): Promise<{ summary: string; code?: string }> {
  const text = await response.text();
  if (!text.trim()) return { summary: "(empty response body)" };
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string; code?: string; type?: string } };
    const e = parsed.error;
    if (e?.message) {
      const parts = [e.code, e.type].filter(Boolean).join(" / ");
      return {
        code: e.code,
        summary: parts ? `${parts}: ${e.message}` : e.message,
      };
    }
  } catch {
    /* not JSON */
  }
  return { summary: text.length > 800 ? `${text.slice(0, 800)}…` : text };
}

export async function createOpenAiJsonCompletion(messages: ChatMessage[]): Promise<string> {
  const config = getOpenAiConfig();
  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  const body = JSON.stringify({
    model: config.model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages,
  });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const max429Attempts = 5;
  let attempt = 0;

  try {
    while (attempt < max429Attempts) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (response.status === 429) {
        const err = await parseOpenAiErrorResponse(response);
        if (err.code === "insufficient_quota") {
          throw new Error(
            `OpenAI insufficient_quota (add billing / credits; retries do not help): ${err.summary}`,
          );
        }
        if (attempt < max429Attempts - 1) {
          const retryAfter = response.headers.get("retry-after");
          const parsed = retryAfter ? Number.parseFloat(retryAfter) : NaN;
          const fromHeader = Number.isFinite(parsed)
            ? Math.min(20_000, Math.max(800, parsed * 1000))
            : null;
          const exponential = Math.min(16_000, 2000 * 2 ** attempt);
          const waitMs = fromHeader ?? exponential;
          console.warn("[openai] HTTP 429:", err.summary, "| retry after ms:", waitMs, "attempt:", attempt + 1);
          await sleep(waitMs);
          attempt += 1;
          continue;
        }
        throw new Error(`OpenAI request failed (429): ${err.summary}`);
      }

      if (!response.ok) {
        const err = await parseOpenAiErrorResponse(response);
        throw new Error(`OpenAI request failed (${response.status}): ${err.summary}`);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };

      const content = json.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("OpenAI returned an empty completion");
      }

      return content;
    }

    throw new Error("OpenAI unexpected: request loop exited without result");
  } finally {
    clearTimeout(timeout);
  }
}
