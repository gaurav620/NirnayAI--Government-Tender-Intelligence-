import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { processDocument, extractCriteria, checkMLHealth, MLCriterion } from "@/lib/ml-pipeline";
import type { Criteria } from "@/lib/types";

/**
 * Transform a flat MLCriterion (from Railway ML /extract-criteria) into the
 * frontend Criteria type, preserving all ML-specific optional fields.
 */
function mlCriterionToFrontend(c: MLCriterion): Criteria {
  return {
    id: c.id,
    description: c.description,
    threshold: c.threshold,
    mandatory: c.mandatory,
    confirmed: true,
    // ML-specific optional fields
    label: c.label,
    type: c.type,
    unit: c.unit,
    extractionConfidence: c.extraction_confidence,
  };
}

/**
 * POST /api/ml/process-document
 * Proxies file upload to Railway ML pipeline for OCR + text extraction.
 * Accepts multipart/form-data with a 'file' field.
 *
 * action=process (default) → returns ProcessDocumentResponse (OCR text + confidence + tier)
 * action=extract-criteria  → returns Criteria[] (ML flat array transformed to frontend type)
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const action = (formData.get("action") as string) || "process";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    if (action === "extract-criteria") {
      // ML returns a flat MLCriterion[] — transform to frontend Criteria[]
      const mlCriteria = await extractCriteria(buffer, file.name);
      const criteria: Criteria[] = mlCriteria.map(mlCriterionToFrontend);
      return NextResponse.json(criteria);
    } else {
      // Default: process document (OCR + text extraction)
      // ML returns { text, full_text, confidence, tier, pages }
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
