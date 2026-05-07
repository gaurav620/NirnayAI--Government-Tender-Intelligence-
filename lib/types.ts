export type EvaluationStatus = "Eligible" | "Not Eligible" | "Manual Review";

export type Criteria = {
  id: string;
  description: string;
  threshold: string | number;
  mandatory: boolean;
  confirmed?: boolean;
  // ML pipeline fields (optional — populated when criteria come from Railway ML)
  label?: string;
  type?: "financial" | "technical" | "compliance" | "documentation" | string;
  unit?: string;
  extractionConfidence?: number;
};

export type Evidence = {
  criterionName: string;
  extractedValue: string;
  requiredThreshold: string;
  sourceDocument: string;
  reason: string;
  confidence: number;
  status: EvaluationStatus;
  // ML pipeline fields (optional — populated when evidence comes from Railway ML)
  routing?: "PASS_TO_RULE_ENGINE" | "MANUAL_REVIEW";
  valueFound?: boolean;
  rawText?: string;
  ocrConfidence?: number;
};

export type VendorResult = {
  id: string;
  name: string;
  technicalStatus: EvaluationStatus;
  financialStatus: EvaluationStatus;
  complianceStatus: EvaluationStatus;
  finalVerdict: EvaluationStatus;
  evidence: Evidence[];
};

export type UploadResponse = {
  tenderFileId: string;
  vendorFileIds: string[];
};

export type Officer = {
  id: string;
  name: string;
  role: string;
};

export type SignatureDecision = "approve" | "reject" | "override";

export type Signature = {
  officer: Officer;
  decision: SignatureDecision;
  note: string;
  signedAt: string;
};

export type Report = {
  token: string;
  title: string;
  createdAt: string;
  createdBy: Officer;
  criteria: Criteria[];
  vendors: VendorResult[];
  signatures: Signature[];
  locked: boolean;
  lockedAt: string | null;
  lockedBy: Officer | null;
};

export type AuditEntry = {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  note: string;
  timestamp: string;
};

// ── v2: Rule engine verdict types ─────────────────────────────────────────────

/** Verdict for a single criterion from the rule engine */
export type CriterionVerdict = {
  criterion_id: string;
  criterion_label: string;
  /** Final verdict from the deterministic rule engine */
  verdict: "ELIGIBLE" | "NOT_ELIGIBLE" | "MANUAL_REVIEW";
  /** Human-readable reason explaining the verdict */
  reason: string;
  /** The value extracted from the bidder document */
  extracted_value: string;
  /** The threshold specified in the tender */
  threshold: string;
  /** Where in the bidder document the value was found */
  source_section: string;
  mandatory: boolean;
  /** Combined OCR × extraction confidence (0–1) */
  confidence: number;
};

/** Full evaluation result for one bidder from /evaluate-bidder */
export type BidderEvaluation = {
  bidder_file: string;
  overall_verdict: "ELIGIBLE" | "NOT_ELIGIBLE" | "MANUAL_REVIEW";
  overall_reason: string;
  eligible_count: number;
  not_eligible_count: number;
  manual_review_count: number;
  /** IDs of mandatory criteria that failed */
  mandatory_failed: string[];
  criteria_verdicts: CriterionVerdict[];
  /** OCR metadata */
  ocr_tier?: string;
  ocr_confidence?: number;
};

/** Summary counts from /evaluate-batch */
export type BatchSummary = {
  total_bidders: number;
  eligible_count: number;
  not_eligible_count: number;
  manual_review_count: number;
  eligible_bidders: string[];
  not_eligible_bidders: string[];
  manual_review_bidders: string[];
};

/** Full response from /evaluate-batch */
export type BatchEvaluationResult = {
  tender_file: string;
  tender_ocr_tier: string;
  criteria_count: number;
  criteria: Criteria[];
  bidder_count: number;
  summary: BatchSummary;
  bidder_results: BidderEvaluation[];
};

/** Structured report from /generate-report */
export type EvaluationReport = {
  report_metadata: {
    generated_at: string;
    tender_title: string;
    tender_file: string;
    criteria_count: number;
    bidder_count: number;
    api_version: string;
    llm_provider: string;
  };
  executive_summary: {
    total_bidders_evaluated: number;
    clearly_eligible: number;
    clearly_not_eligible: number;
    requires_manual_review: number;
    eligible_bidders: string[];
    not_eligible_bidders: string[];
    manual_review_bidders: string[];
  };
  criteria_reference: Array<{
    id: string;
    label: string;
    type: string;
    mandatory: boolean;
    threshold: string;
    description: string;
  }>;
  bidder_evaluations: Array<{
    bidder_file: string;
    overall_verdict: string;
    overall_reason: string;
    mandatory_failed: string[];
    eligible_count: number;
    not_eligible_count: number;
    manual_review_count: number;
    criterion_detail: CriterionVerdict[];
  }>;
  audit_note: string;
};

/** A single audit trail entry from /audit-trail/{bidder} */
export type AuditTrailEntry = {
  id: number;
  created_at: string;
  bidder_file: string;
  criterion_id: string;
  criterion_label: string;
  verdict: string;
  reason: string;
  extracted_value: string;
  threshold: string;
  mandatory: number;
  confidence: number;
  source_section: string;
};

/** Stats from /audit-stats */
export type AuditStats = {
  criteria_extractions: number;
  value_extractions: number;
  verdicts: number;
  bidder_summaries: number;
  db_path: string;
  schema_version: number;
};
