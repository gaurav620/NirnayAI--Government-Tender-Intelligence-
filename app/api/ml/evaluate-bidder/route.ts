import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { evaluateBidder } from "@/lib/ml-pipeline";
import type { BidderEvaluation, EvaluationStatus } from "@/lib/types";

/**
 * Map a rule engine verdict string to the frontend EvaluationStatus type.
 */
function verdictToStatus(verdict: string): EvaluationStatus {
  if (verdict === "ELIGIBLE") return "Eligible";
  if (verdict === "NOT_ELIGIBLE") return "Not Eligible";
  return "Manual Review";
}

/**
 * POST /api/ml/evaluate-bidder
 *
 * Full pipeline proxy: OCR → value extraction → rule engine → verdict.
 * Accepts multipart/form-data with:
 *   - file:     Bidder document (PDF, DOCX, XLSX, CSV, JPG, PNG)
 *   - criteria: JSON string of MLCriterion[]
 *
 * Returns BidderEvaluation with:
 *   - overall_verdict: ELIGIBLE | NOT_ELIGIBLE | MANUAL_REVIEW
 *   - overall_reason: human-readable explanation
 *   - criteria_verdicts[]: per-criterion verdict with reason, extracted_value, threshold
 *   - mandatory_failed[]: IDs of mandatory criteria that failed
 *   - eligible_count, not_eligible_count, manual_review_count
 *
 * All decisions are automatically audit-logged in the ML pipeline's SQLite DB.
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
    const result: BidderEvaluation = await evaluateBidder(buffer, file.name, criteriaJson);

    // Enrich with frontend-friendly status field for each criterion verdict
    const enriched = {
      ...result,
      overall_status: verdictToStatus(result.overall_verdict),
      criteria_verdicts: result.criteria_verdicts.map((cv) => ({
        ...cv,
        status: verdictToStatus(cv.verdict),
      })),
    };

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline error";
    console.error("[ML Pipeline] evaluate-bidder error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
