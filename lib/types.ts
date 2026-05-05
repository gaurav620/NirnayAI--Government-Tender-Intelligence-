export type EvaluationStatus = "Eligible" | "Not Eligible" | "Manual Review";

export type Criteria = {
  id: string;
  description: string;
  threshold: string | number;
  mandatory: boolean;
  confirmed?: boolean;
};

export type Evidence = {
  criterionName: string;
  extractedValue: string;
  requiredThreshold: string;
  sourceDocument: string;
  reason: string;
  confidence: number;
  status: EvaluationStatus;
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
