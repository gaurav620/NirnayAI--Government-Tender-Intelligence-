/**
 * NirnayAI ML Pipeline Client
 * 
 * Global configuration and helper functions for the Railway-deployed ML pipeline.
 * Pipeline: PDF Upload → OCR → Criteria Extraction → Bidder Matching → Results
 * 
 * API Base: https://web-production-50a8f.up.railway.app
 * Endpoints:
 *   GET  /health           — Check Tesseract, LLM providers, cache
 *   POST /process-document — Upload doc → OCR → extracted text + metadata
 *   POST /extract-criteria — Upload tender doc → extract eligibility criteria
 *   POST /extract-values   — Upload bidder doc + criteria → extract matching values
 *   GET  /cache-status     — Check cached LLM responses
 *   POST /precache         — Pre-cache LLM responses
 */

// --- Global ML Pipeline URL ---
export const ML_PIPELINE_URL = process.env.ML_PIPELINE_URL || process.env.NEXT_PUBLIC_ML_PIPELINE_URL || 'https://web-production-50a8f.up.railway.app';

// --- Types ---
export interface MLHealthResponse {
  status: string;
  tesseract: string;
  cache_count: number;
  llm_providers_available: string[];
  active_provider: string;
  temp_dir: string;
}

export interface ProcessDocumentResponse {
  extracted_text: string;
  metadata: Record<string, unknown>;
  page_count?: number;
  [key: string]: unknown;
}

export interface ExtractCriteriaResponse {
  criteria: Array<{
    id: string;
    description: string;
    category: string;
    mandatory: boolean;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface ExtractValuesResponse {
  values: Array<{
    criteria_id: string;
    extracted_value: string;
    confidence: string;
    source_page?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// --- Server-side helper functions (use in API routes only) ---

/**
 * Check ML pipeline health
 */
export async function checkMLHealth(): Promise<MLHealthResponse> {
  const res = await fetch(`${ML_PIPELINE_URL}/health`, { 
    method: 'GET',
    cache: 'no-store' 
  });
  if (!res.ok) throw new Error(`ML health check failed: ${res.status}`);
  return res.json();
}

/**
 * Process a document through the ML pipeline (OCR + text extraction)
 * @param file - File buffer or Blob
 * @param filename - Original filename
 */
export async function processDocument(file: Buffer | Blob, filename: string): Promise<ProcessDocumentResponse> {
  const formData = new FormData();
  const blob = file instanceof Buffer ? new Blob([file]) : file;
  formData.append('file', blob, filename);

  const res = await fetch(`${ML_PIPELINE_URL}/process-document`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML process-document failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Extract eligibility criteria from a tender document
 * @param file - File buffer or Blob
 * @param filename - Original filename
 */
export async function extractCriteria(file: Buffer | Blob, filename: string): Promise<ExtractCriteriaResponse> {
  const formData = new FormData();
  const blob = file instanceof Buffer ? new Blob([file]) : file;
  formData.append('file', blob, filename);

  const res = await fetch(`${ML_PIPELINE_URL}/extract-criteria`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML extract-criteria failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Extract values from a bidder document against given criteria
 * @param file - File buffer or Blob
 * @param filename - Original filename
 * @param criteria - JSON string of criteria to match against
 */
export async function extractValues(file: Buffer | Blob, filename: string, criteria: string): Promise<ExtractValuesResponse> {
  const formData = new FormData();
  const blob = file instanceof Buffer ? new Blob([file]) : file;
  formData.append('file', blob, filename);
  formData.append('criteria', criteria);

  const res = await fetch(`${ML_PIPELINE_URL}/extract-values`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ML extract-values failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Get cache status
 */
export async function getCacheStatus(): Promise<{ cache_count: number }> {
  const res = await fetch(`${ML_PIPELINE_URL}/cache-status`, { 
    method: 'GET',
    cache: 'no-store' 
  });
  if (!res.ok) throw new Error(`ML cache-status failed: ${res.status}`);
  return res.json();
}
