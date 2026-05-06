import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ML_PIPELINE_URL, MLExtraction } from "@/lib/ml-pipeline";
import type { Criteria, Evidence } from "@/lib/types";

/**
 * POST /api/ml/extract-values-json
 * Accepts pre-extracted text + criteria (no file re-upload).
 * Forwards to Railway ML /extract-values-json endpoint.
 *
 * Body: { document_text: string, criteria: MLCriterion[] }
 * Returns: { evidence: Evidence[], extractions: MLExtraction[] }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { document_text, criteria } = body;

    if (!document_text) {
      return NextResponse.json({ error: "document_text is required" }, { status: 400 });
    }
    if (!criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "criteria array is required" }, { status: 400 });
    }

    const res = await fetch(`${ML_PIPELINE_URL}/extract-values-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_text, criteria }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ML /extract-values-json failed (${res.status}): ${errText}`);
    }

    const mlResult = await res.json();
    const extractions: MLExtraction[] = mlResult.extractions || [];

    // Build criterion lookup for name/threshold resolution
    const criteriaById = new Map((criteria as Criteria[]).map((c) => [c.id, c]));

    const evidence: Evidence[] = extractions.map((ext: MLExtraction) => {
      const criterion = criteriaById.get(ext.criterion_id);
      const isManual = ext.routing === "MANUAL_REVIEW" || !ext.value_found;

      return {
        criterionName: (criterion as any)?.label || criterion?.description || ext.criterion_id,
        extractedValue: ext.extracted_value || "N/A",
        requiredThreshold: criterion?.threshold?.toString() || "N/A",
        sourceDocument: ext.source_section || "N/A",
        reason: ext.notes || (ext.value_found
          ? `Extracted '${ext.extracted_value}' from ${ext.source_section}.`
          : "Value not found in document."),
        confidence: ext.confidence,
        status: isManual ? "Manual Review" : "Eligible",
        routing: ext.routing,
        valueFound: ext.value_found,
        rawText: ext.raw_text,
        ocrConfidence: ext.ocr_confidence,
      };
    });

    return NextResponse.json({ evidence, extractions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline error";
    console.error("[ML Pipeline] extract-values-json error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
