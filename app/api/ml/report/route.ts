import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateReport, getAuditStats, getBidderAuditTrail } from "@/lib/ml-pipeline";
import type { BatchEvaluationResult } from "@/lib/types";

/**
 * POST /api/ml/report
 *
 * Generate a structured evaluation report from batch evaluation results.
 * Body: { tender_title: string, evaluation_results: BatchEvaluationResult }
 *
 * Returns EvaluationReport with:
 *   - report_metadata: generated_at, tender_title, criteria_count, bidder_count, llm_provider
 *   - executive_summary: eligible/not_eligible/manual_review counts + bidder lists
 *   - criteria_reference: full criteria list with descriptions and thresholds
 *   - bidder_evaluations: per-bidder criterion-level verdict detail
 *   - audit_note: formal disclaimer for procurement use
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { tender_title, evaluation_results } = body as {
      tender_title: string;
      evaluation_results: BatchEvaluationResult;
    };

    if (!tender_title || !evaluation_results) {
      return NextResponse.json(
        { error: "Both tender_title and evaluation_results are required" },
        { status: 400 }
      );
    }

    const report = await generateReport(tender_title, evaluation_results);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML report error";
    console.error("[ML Pipeline] generate-report error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * GET /api/ml/report
 * Returns audit database statistics (decision counts, schema version).
 * Used to verify all decisions were logged after an evaluation run.
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const bidderFile = searchParams.get("bidder");

    if (bidderFile) {
      // Return full audit trail for a specific bidder
      const trail = await getBidderAuditTrail(bidderFile);
      return NextResponse.json(trail);
    }

    // Return aggregate audit stats
    const stats = await getAuditStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML audit error";
    console.error("[ML Pipeline] audit-stats error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
