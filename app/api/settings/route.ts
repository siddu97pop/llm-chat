import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/settings — saves the OpenRouter API key as an httpOnly cookie
export async function POST(request: Request) {
  const body = await request.json();
  const { apiKey } = body as { apiKey?: string };

  const cookieStore = await cookies();

  if (apiKey !== undefined) {
    if (apiKey === "") {
      cookieStore.delete("or-api-key");
    } else {
      cookieStore.set("or-api-key", apiKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // 1 year expiry
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/settings — returns whether an API key is currently set (not the key itself)
export async function GET() {
  const cookieStore = await cookies();
  const hasKey = cookieStore.has("or-api-key");
  return NextResponse.json({ hasKey });
}
