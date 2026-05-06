import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ML_PIPELINE_URL } from "@/lib/ml-pipeline";

/**
 * POST /api/ml/chat
 * Proxies { system, message } to Railway ML /chat endpoint.
 * Used for tender overview generation, clarification Q&A, and
 * any conversational AI task that doesn't require a file upload.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { system, message } = body;

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const res = await fetch(`${ML_PIPELINE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: system || "", message }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ML /chat failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML chat error";
    console.error("[ML Pipeline] chat error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
