import { mockCriteria, mockResults } from "@/lib/mock-data";
import type {
  AuditEntry,
  Criteria,
  Officer,
  Report,
  SignatureDecision,
  UploadResponse,
  VendorResult,
} from "@/lib/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: isFormData
      ? options?.headers
      : { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

async function safeRequest<T>(path: string, options: RequestInit | undefined, fallback: T): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch (err) {
    // Network / backend down → fallback so demo still works
    console.warn(`[api] Falling back to mock for ${path}:`, err);
    return fallback;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await request<unknown>("/health", { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

export async function uploadTenderFiles(tenderFile: File, vendorFiles: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("tender_file", tenderFile);
  vendorFiles.forEach((file) => formData.append("vendor_files", file));

  return request<UploadResponse>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function extractCriteria(tenderFileId: string): Promise<Criteria[]> {
  return request<Criteria[]>("/extract-criteria", {
    method: "POST",
    body: JSON.stringify({ tender_file_id: tenderFileId }),
  });
}

export async function evaluateVendors(vendorFileIds: string[], criteria: Criteria[]): Promise<VendorResult[]> {
  return request<VendorResult[]>("/evaluate", {
    method: "POST",
    body: JSON.stringify({ vendor_file_ids: vendorFileIds, criteria }),
  });
}

export async function getResults(): Promise<VendorResult[]> {
  return safeRequest<VendorResult[]>("/results", { method: "GET" }, mockResults);
}

// Fallback helpers for offline demos
export function fallbackCriteria(): Criteria[] {
  return mockCriteria;
}

export function fallbackResults(): VendorResult[] {
  return mockResults;
}

// ────────── Reports (multi-officer sign + lock + share) ──────────

export async function createReport(
  title: string,
  officer: Officer,
  criteria: Criteria[],
  vendors: VendorResult[],
): Promise<Report> {
  return request<Report>("/reports", {
    method: "POST",
    body: JSON.stringify({ title, officer, criteria, vendors }),
  });
}

export async function getReport(token: string): Promise<Report> {
  return request<Report>(`/reports/${token}`, { method: "GET" });
}

export async function listReports(): Promise<Report[]> {
  return safeRequest<Report[]>("/reports", { method: "GET" }, []);
}

export async function signReport(
  token: string,
  officer: Officer,
  decision: SignatureDecision,
  note = "",
): Promise<Report> {
  return request<Report>(`/reports/${token}/sign`, {
    method: "POST",
    body: JSON.stringify({ officer, decision, note }),
  });
}

export async function lockReport(token: string, officer: Officer): Promise<Report> {
  return request<Report>(`/reports/${token}/lock`, {
    method: "POST",
    body: JSON.stringify({ officer }),
  });
}

// ────────── Audit log ──────────

export async function getAuditLog(limit = 50): Promise<AuditEntry[]> {
  return safeRequest<AuditEntry[]>(`/audit?limit=${limit}`, { method: "GET" }, []);
}
