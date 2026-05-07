/**
 * NirnayAI ML Pipeline Client — v2
 *
 * Global configuration and helper functions for the Railway-deployed ML pipeline.
 * Pipeline: PDF Upload → OCR → Criteria Extraction → Bidder Matching → Rule Engine → Results
 *
 * API Base: https://web-production-50a8f.up.railway.app
 *
 * v1 Endpoints (unchanged):
 *   GET  /health               — Check Tesseract, LLM providers, cache, audit DB
 *   POST /process-document     — Upload doc → OCR → extracted text + metadata + table_count
 *   POST /extract-criteria     — Upload tender doc → chunked LLM → criteria array
 *   POST /extract-values       — Upload bidder doc + criteria → extractions (routing only)
 *   POST /extract-values-json  — Same but pre-extracted text in JSON body
 *   POST /chat                 — { system, message } → LLM response
 *   GET  /cache-status         — Cached LLM response count
 *
 * v2 Endpoints (new):
 *   POST /evaluate-bidder      — Upload bidder doc + criteria → full ELIGIBLE/NOT_ELIGIBLE/MANUAL_REVIEW
 *   POST /evaluate-batch       — Upload tender + N bidder files → consolidated report data
 *   POST /generate-report      — Structured JSON report for PDF rendering
 *   GET  /audit-stats          — Aggregate counts from immutable audit DB
 *   GET  /audit-trail/{bidder} — Full decision log for a specific bidder
 */

import type {
  BidderEvaluation,
  BatchEvaluationResult,
  EvaluationReport,
  AuditStats,
  AuditTrailEntry,
} from "@/lib/types";

// --- Global ML Pipeline URL + auth ---
export const ML_PIPELINE_URL =
  process.env.ML_PIPELINE_URL ||
  process.env.NEXT_PUBLIC_ML_PIPELINE_URL ||
  "https://web-production-50a8f.up.railway.app";

/** Forwarded to Railway as X-API-Key when ML_API_KEY is set. Safe to omit. */
const ML_API_KEY = process.env.ML_API_KEY || "";

function mlHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (ML_API_KEY) h["X-API-Key"] = ML_API_KEY;
  return h;
}

// --- Types ---

export interface MLHealthResponse {
  status: string;
  api_version: string;
  tesseract: string;
  cache_count: number;
  llm_providers_available: string[];
  active_provider: string;
  max_upload_mb: number;
  audit_db: AuditStats;
}

/** Shape returned by POST /process-document */
export interface ProcessDocumentResponse {
  text: string;
  full_text: string;
  full_text_length: number;
  confidence: number;
  tier: string;
  pages: number;
  /** v2: number of tables extracted from the document */
  table_count: number;
  [key: string]: unknown;
}

/**
 * Single criterion as returned by POST /extract-criteria.
 * The ML pipeline returns `type` (not `category`) and includes `label`, `unit`,
 * and `extraction_confidence` fields absent from the legacy Python backend schema.
 */
export interface MLCriterion {
  id: string;
  label: string;
  description: string;
  type: "financial" | "technical" | "compliance" | "documentation" | string;
  mandatory: boolean;
  threshold: string;
  unit: string;
  extraction_confidence: number;
  [key: string]: unknown;
}

/**
 * POST /extract-criteria returns a flat JSON array of MLCriterion — NOT wrapped
 * in an object. The function signature reflects this directly.
 */
export type ExtractCriteriaResponse = MLCriterion[];

/**
 * Single extraction result inside POST /extract-values response.
 * routing == "PASS_TO_RULE_ENGINE" means the backend rule engine decides
 * Eligible/Not Eligible. routing == "MANUAL_REVIEW" means human must decide.
 * Use /evaluate-bidder to get final ELIGIBLE/NOT_ELIGIBLE verdicts directly.
 */
export interface MLExtraction {
  value_found: boolean;
  extracted_value: string;
  source_section: string;
  confidence: number;
  raw_text: string;
  notes: string;
  criterion_id: string;
  ocr_confidence: number;
  ocr_tier: string;
  routing: "PASS_TO_RULE_ENGINE" | "MANUAL_REVIEW";
}

/** Shape returned by POST /extract-values */
export interface ExtractValuesResponse {
  bidder_file: string;
  ocr_tier: string;
  ocr_confidence: number;
  table_count: number;
  extractions: MLExtraction[];
  [key: string]: unknown;
}

// --- Server-side helper functions (use in API routes only) ---

/** Check ML pipeline health (v2: includes audit_db stats) */
export async function checkMLHealth(): Promise<MLHealthResponse> {
  const res = await fetch(`${ML_PIPELINE_URL}/health`, {
    method: "GET",
    cache: "no-store",
    headers: mlHeaders(),
  });
  if (!res.ok) throw new Error(`ML health check failed: ${res.status}`);
  return res.json();
}

/**
 * Process a document through the ML pipeline (OCR + text extraction).
 * v2: also returns table_count for documents with tabular data.
 */
export async function processDocument(
  file: Uint8Array | Blob,
  filename: string
): Promise<ProcessDocumentResponse> {
  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
  formData.append("file", blob, filename);

  const res = await fetch(`${ML_PIPELINE_URL}/process-document`, {
    method: "POST",
    headers: mlHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML process-document failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Extract eligibility criteria from a tender document.
 * v2: Uses chunked extraction — handles 200-page tenders correctly.
 * Returns a flat array of MLCriterion — no wrapper object.
 */
export async function extractCriteria(
  file: Uint8Array | Blob,
  filename: string
): Promise<ExtractCriteriaResponse> {
  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
  formData.append("file", blob, filename);

  const res = await fetch(`${ML_PIPELINE_URL}/extract-criteria`, {
    method: "POST",
    headers: mlHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML extract-criteria failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Extract values from a bidder document against given criteria.
 * Returns PASS_TO_RULE_ENGINE or MANUAL_REVIEW routing per criterion.
 * Use evaluateBidder() for final ELIGIBLE/NOT_ELIGIBLE verdicts.
 * @param criteria - JSON string of MLCriterion[] to match against
 */
export async function extractValues(
  file: Uint8Array | Blob,
  filename: string,
  criteria: string
): Promise<ExtractValuesResponse> {
  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
  formData.append("file", blob, filename);
  formData.append("criteria", criteria);

  const res = await fetch(`${ML_PIPELINE_URL}/extract-values`, {
    method: "POST",
    headers: mlHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML extract-values failed (${res.status}): ${errText}`);
  }
  return res.json();
}

// ── v2: New functions ─────────────────────────────────────────────────────────

/**
 * [v2] Full single-bidder evaluation pipeline.
 * OCR → value extraction → rule engine → ELIGIBLE/NOT_ELIGIBLE/MANUAL_REVIEW verdict.
 * All decisions are automatically audit-logged in the ML pipeline's SQLite DB.
 *
 * @param file     - Bidder document (PDF, DOCX, XLSX, CSV, JPG, PNG)
 * @param filename - Original filename
 * @param criteria - JSON string of MLCriterion[] from extract-criteria
 */
export async function evaluateBidder(
  file: Uint8Array | Blob,
  filename: string,
  criteria: string
): Promise<BidderEvaluation> {
  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file as unknown as BlobPart]);
  formData.append("file", blob, filename);
  formData.append("criteria", criteria);

  const res = await fetch(`${ML_PIPELINE_URL}/evaluate-bidder`, {
    method: "POST",
    headers: mlHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML evaluate-bidder failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * [v2] Batch evaluation — one tender + N bidder files → consolidated results.
 * Runs the full pipeline (OCR → extraction → rule engine) for all bidders.
 * Returns summary counts + per-bidder criterion-level verdicts.
 *
 * @param tenderFile   - Tender document file
 * @param bidderFiles  - Array of bidder document files
 */
export async function evaluateBatch(
  tenderFile: { data: Uint8Array | Blob; filename: string },
  bidderFiles: Array<{ data: Uint8Array | Blob; filename: string }>
): Promise<BatchEvaluationResult> {
  const formData = new FormData();

  const tenderBlob =
    tenderFile.data instanceof Blob
      ? tenderFile.data
      : new Blob([tenderFile.data as unknown as BlobPart]);
  formData.append("tender_file", tenderBlob, tenderFile.filename);

  for (const bf of bidderFiles) {
    const blob =
      bf.data instanceof Blob ? bf.data : new Blob([bf.data as unknown as BlobPart]);
    formData.append("bidder_files", blob, bf.filename);
  }

  const res = await fetch(`${ML_PIPELINE_URL}/evaluate-batch`, {
    method: "POST",
    headers: mlHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML evaluate-batch failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * [v2] Generate a structured evaluation report from batch results.
 * Returns a JSON document suitable for rendering as PDF/HTML.
 * Includes executive summary, criterion-by-criterion detail, and audit note.
 *
 * @param tenderTitle       - Human-readable tender name
 * @param evaluationResults - Output from evaluateBatch()
 */
export async function generateReport(
  tenderTitle: string,
  evaluationResults: BatchEvaluationResult
): Promise<EvaluationReport> {
  const res = await fetch(`${ML_PIPELINE_URL}/generate-report`, {
    method: "POST",
    headers: { ...mlHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ tender_title: tenderTitle, evaluation_results: evaluationResults }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML generate-report failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * [v2] Get aggregate decision counts from the immutable audit database.
 * Use to verify all decisions were logged and to display audit health.
 */
export async function getAuditStats(): Promise<AuditStats> {
  const res = await fetch(`${ML_PIPELINE_URL}/audit-stats`, {
    method: "GET",
    cache: "no-store",
    headers: mlHeaders(),
  });
  if (!res.ok) throw new Error(`ML audit-stats failed: ${res.status}`);
  return res.json();
}

/**
 * [v2] Get the full audit trail for a specific bidder file.
 * Returns every criterion-level decision that was logged for that bidder.
 *
 * @param bidderFile - Filename of the bidder document (URL-encoded internally)
 */
export async function getBidderAuditTrail(
  bidderFile: string
): Promise<{ bidder_file: string; decisions: AuditTrailEntry[]; count: number }> {
  const encoded = encodeURIComponent(bidderFile);
  const res = await fetch(`${ML_PIPELINE_URL}/audit-trail/${encoded}`, {
    method: "GET",
    cache: "no-store",
    headers: mlHeaders(),
  });
  if (!res.ok) throw new Error(`ML audit-trail failed: ${res.status}`);
  return res.json();
}

/** Get LLM response cache status */
export async function getCacheStatus(): Promise<{ cache_count: number }> {
  const res = await fetch(`${ML_PIPELINE_URL}/cache-status`, {
    method: "GET",
    cache: "no-store",
    headers: mlHeaders(),
  });
  if (!res.ok) throw new Error(`ML cache-status failed: ${res.status}`);
  return res.json();
}
