import { NextResponse } from "next/server";
import { fetchOpenRouterModels } from "@/lib/providers/openrouter";
import { fetchOllamaModels } from "@/lib/providers/ollama";
import type { Provider } from "@/lib/types";

// GET /api/models?provider=openrouter|ollama[&ollamaUrl=...]
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider | null;
  const ollamaUrl =
    searchParams.get("ollamaUrl") ||
    process.env.NEXT_PUBLIC_OLLAMA_URL ||
    "http://localhost:11434";

  if (!provider || (provider !== "openrouter" && provider !== "ollama")) {
    return NextResponse.json(
      { error: "provider must be 'openrouter' or 'ollama'" },
      { status: 400 }
    );
  }

  try {
    if (provider === "openrouter") {
      const models = await fetchOpenRouterModels();
      return NextResponse.json({ models });
    } else {
      const models = await fetchOllamaModels(ollamaUrl);
      return NextResponse.json({ models });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch models";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
