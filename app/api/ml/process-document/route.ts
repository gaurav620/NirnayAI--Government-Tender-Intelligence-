import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { processDocument, extractCriteria, checkMLHealth } from "@/lib/ml-pipeline";

/**
 * POST /api/ml/process-document
 * Proxies file upload to Railway ML pipeline for OCR + text extraction.
 * Accepts multipart/form-data with a 'file' field.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string || "process";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (action === "extract-criteria") {
      // Extract eligibility criteria from tender document
      const result = await extractCriteria(buffer, file.name);
      return NextResponse.json(result);
    } else {
      // Default: process document (OCR + text extraction)
      const result = await processDocument(buffer, file.name);
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline error";
    console.error("[ML Pipeline] process-document error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * GET /api/ml/process-document
 * Returns ML pipeline health status.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const health = await checkMLHealth();
    return NextResponse.json(health);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline unreachable";
    return NextResponse.json({ error: message, status: "down" }, { status: 502 });
  }
}
