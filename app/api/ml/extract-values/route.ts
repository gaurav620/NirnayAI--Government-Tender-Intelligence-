import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { extractValues, MLExtraction } from "@/lib/ml-pipeline";
import type { Criteria, Evidence, EvaluationStatus } from "@/lib/types";

/**
 * Derive a frontend EvaluationStatus from an ML extraction's routing field.
 * The ML pipeline never outputs Eligible/Not Eligible — that decision belongs
 * to the rule engine. When routing == PASS_TO_RULE_ENGINE and value_found,
 * we defer to the caller; otherwise fall back to Manual Review.
 */
function routingToStatus(extraction: MLExtraction): EvaluationStatus {
  if (extraction.routing === "MANUAL_REVIEW" || !extraction.value_found) {
    return "Manual Review";
  }
  // PASS_TO_RULE_ENGINE: rule engine (Python backend) will finalize verdict.
  // Frontend shows Eligible as default pass-through display until backend confirms.
  return "Eligible";
}

/**
 * Transform a single MLExtraction + its matching Criteria into a frontend Evidence object.
 */
function mlExtractionToEvidence(
  extraction: MLExtraction,
  criterion: Criteria | undefined
): Evidence {
  return {
    criterionName: criterion?.label || criterion?.description || extraction.criterion_id,
    extractedValue: extraction.extracted_value || "N/A",
    requiredThreshold: criterion?.threshold?.toString() || "N/A",
    sourceDocument: extraction.source_section || "N/A",
    reason: extraction.notes || (extraction.value_found
      ? `Extracted '${extraction.extracted_value}' from ${extraction.source_section}.`
      : "Value not found in document."),
    confidence: extraction.confidence,
    status: routingToStatus(extraction),
    // ML-specific optional fields
    routing: extraction.routing,
    valueFound: extraction.value_found,
    rawText: extraction.raw_text,
    ocrConfidence: extraction.ocr_confidence,
  };
}

/**
 * POST /api/ml/extract-values
 * Proxies bidder document + criteria to Railway ML pipeline for value extraction.
 * Accepts multipart/form-data with 'file' and 'criteria' fields.
 *
 * Returns:
 *   { evidence: Evidence[], ocrTier: string, ocrConfidence: number, bidderFile: string }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const criteriaJson = formData.get("criteria") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!criteriaJson) {
      return NextResponse.json({ error: "No criteria provided" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const mlResult = await extractValues(buffer, file.name, criteriaJson);

    // Build criterion lookup by id for name/threshold resolution
    let criteriaList: Criteria[] = [];
    try {
      criteriaList = JSON.parse(criteriaJson) as Criteria[];
    } catch {
      // criteriaJson might be ML format; proceed without lookup
    }
    const criteriaById = new Map(criteriaList.map((c) => [c.id, c]));

    const evidence: Evidence[] = mlResult.extractions.map((ext: MLExtraction) =>
      mlExtractionToEvidence(ext, criteriaById.get(ext.criterion_id))
    );

    return NextResponse.json({
      evidence,
      ocrTier: mlResult.ocr_tier,
      ocrConfidence: mlResult.ocr_confidence,
      bidderFile: mlResult.bidder_file,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline error";
    console.error("[ML Pipeline] extract-values error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
