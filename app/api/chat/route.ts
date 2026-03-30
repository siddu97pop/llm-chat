import { cookies } from "next/headers";
import { openRouterHeaders, openRouterBody } from "@/lib/providers/openrouter";
import { ollamaBody } from "@/lib/providers/ollama";
import type { ChatRequestBody } from "@/lib/types";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  const { messages, model, provider, ollamaUrl } = body;

  if (!messages || !model || !provider) {
    return new Response(
      JSON.stringify({ error: "messages, model, and provider are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    if (provider === "openrouter") {
      // Read the API key from the httpOnly cookie (set via /api/settings)
      const cookieStore = await cookies();
      const apiKey = cookieStore.get("or-api-key")?.value ?? "";

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "OpenRouter API key not set. Open settings to add it." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const upstream = await fetch(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: openRouterHeaders(apiKey),
        body: openRouterBody(model, messages),
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        let errMessage = `OpenRouter error ${upstream.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMessage = errJson?.error?.message ?? errMessage;
        } catch {
          // keep default
        }
        return new Response(
          JSON.stringify({ error: errMessage }),
          { status: upstream.status, headers: { "Content-Type": "application/json" } }
        );
      }

      // Pipe the upstream SSE stream directly to the client
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no", // Prevents Nginx/Vercel from buffering the stream
        },
      });
    } else {
      // Ollama — server-to-server to avoid any client CORS issues
      const baseUrl =
        ollamaUrl ??
        process.env.NEXT_PUBLIC_OLLAMA_URL ??
        "http://localhost:11434";

      const upstream = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: ollamaBody(model, messages),
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        let errMessage = `Ollama error ${upstream.status}: ${errText}`;
        try {
          const errJson = JSON.parse(errText);
          errMessage = errJson?.error ?? errMessage;
        } catch {
          // keep default
        }
        return new Response(
          JSON.stringify({ error: errMessage }),
          { status: upstream.status, headers: { "Content-Type": "application/json" } }
        );
      }

      // Ollama streams NDJSON (one JSON object per line, no "data: " prefix)
      // We wrap each line in SSE format so the client can use a single parser
      const ollamaStream = upstream.body;
      if (!ollamaStream) {
        return new Response(
          JSON.stringify({ error: "Ollama returned no response body" }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const transformed = new TransformStream({
        transform(chunk, controller) {
          // Wrap each line in SSE "data: " format
          const text = new TextDecoder().decode(chunk);
          for (const line of text.split("\n")) {
            const trimmed = line.trim();
            if (trimmed) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${trimmed}\n\n`)
              );
            }
          }
        },
      });

      return new Response(ollamaStream.pipeThrough(transformed), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
