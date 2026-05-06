/**
 * NirnayAI ML Pipeline Client
 *
 * Global configuration and helper functions for the Railway-deployed ML pipeline.
 * Pipeline: PDF Upload → OCR → Criteria Extraction → Bidder Matching → Results
 *
 * API Base: https://web-production-50a8f.up.railway.app
 * Endpoints:
 *   GET  /health            — Check Tesseract, LLM providers, cache
 *   POST /process-document  — Upload doc → OCR → extracted text + metadata
 *   POST /extract-criteria  — Upload tender doc → extract eligibility criteria (flat JSON array)
 *   POST /extract-values    — Upload bidder doc + criteria → extractions array
 *   GET  /cache-status      — Check cached LLM responses
 *   POST /precache          — Pre-cache LLM responses
 */

// --- Global ML Pipeline URL ---
export const ML_PIPELINE_URL =
  process.env.ML_PIPELINE_URL ||
  process.env.NEXT_PUBLIC_ML_PIPELINE_URL ||
  "https://web-production-50a8f.up.railway.app";

// --- Types ---

export interface MLHealthResponse {
  status: string;
  tesseract: string;
  cache_count: number;
  llm_providers_available: string[];
  active_provider: string;
  temp_dir: string;
}

/** Shape returned by POST /process-document */
export interface ProcessDocumentResponse {
  text: string;
  full_text: string;
  full_text_length: number;
  confidence: number;
  tier: string;
  pages: number;
  [key: string]: unknown;
}

/**
 * Single criterion as returned by POST /extract-criteria (flat array element).
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
  extractions: MLExtraction[];
  [key: string]: unknown;
}

// --- Server-side helper functions (use in API routes only) ---

/** Check ML pipeline health */
export async function checkMLHealth(): Promise<MLHealthResponse> {
  const res = await fetch(`${ML_PIPELINE_URL}/health`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ML health check failed: ${res.status}`);
  return res.json();
}

/**
 * Process a document through the ML pipeline (OCR + text extraction).
 * Returns tier (digital | scanned | photo | docx), confidence score, and
 * the extracted text in both `text` (truncated) and `full_text` (complete).
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
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML extract-values failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/** Get LLM response cache status */
export async function getCacheStatus(): Promise<{ cache_count: number }> {
  const res = await fetch(`${ML_PIPELINE_URL}/cache-status`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ML cache-status failed: ${res.status}`);
  return res.json();
}
