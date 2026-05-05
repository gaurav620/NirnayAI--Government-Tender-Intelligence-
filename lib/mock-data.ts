import type { Criteria, VendorResult } from "@/lib/types";

export const mockCriteria: Criteria[] = [
  {
    id: "c-technical-score",
    description: "Minimum technical capability score based on past execution and staffing strength.",
    threshold: 75,
    mandatory: true,
    confirmed: true,
  },
  {
    id: "c-turnover",
    description: "Average annual turnover for the last three financial years in INR crores.",
    threshold: 50,
    mandatory: true,
    confirmed: true,
  },
  {
    id: "c-compliance",
    description: "Valid statutory registrations, declarations, and non-blacklisting certificate.",
    threshold: 1,
    mandatory: true,
    confirmed: true,
  },
  {
    id: "c-delivery",
    description: "Proposed delivery timeline compliance with tender schedule.",
    threshold: 90,
    mandatory: false,
    confirmed: false,
  },
];

export const mockResults: VendorResult[] = [
  {
    id: "vendor-1",
    name: "Aarav Infrastructure Ltd.",
    technicalStatus: "Eligible",
    financialStatus: "Eligible",
    complianceStatus: "Eligible",
    finalVerdict: "Eligible",
    evidence: [
      {
        criterionName: "Technical capability score",
        extractedValue: "82",
        requiredThreshold: ">= 75",
        sourceDocument: "aarav-technical.pdf",
        reason: "The proposal lists six comparable government deployments and certified project staff.",
        confidence: 0.94,
        status: "Eligible",
      },
      {
        criterionName: "Average annual turnover",
        extractedValue: "64 Cr",
        requiredThreshold: ">= 50 Cr",
        sourceDocument: "aarav-financials.pdf",
        reason: "Audited statements show turnover above the required threshold for the evaluated period.",
        confidence: 0.91,
        status: "Eligible",
      },
    ],
  },
  {
    id: "vendor-2",
    name: "Bharat Digital Systems",
    technicalStatus: "Manual Review",
    financialStatus: "Eligible",
    complianceStatus: "Eligible",
    finalVerdict: "Manual Review",
    evidence: [
      {
        criterionName: "Technical capability score",
        extractedValue: "Value unclear",
        requiredThreshold: ">= 75",
        sourceDocument: "bharat-capability.pdf",
        reason: "The AI found conflicting project completion counts across two pages and recommends officer verification.",
        confidence: 0.61,
        status: "Manual Review",
      },
    ],
  },
  {
    id: "vendor-3",
    name: "CivicCore Solutions Pvt. Ltd.",
    technicalStatus: "Eligible",
    financialStatus: "Not Eligible",
    complianceStatus: "Eligible",
    finalVerdict: "Not Eligible",
    evidence: [
      {
        criterionName: "Average annual turnover",
        extractedValue: "38 Cr",
        requiredThreshold: ">= 50 Cr",
        sourceDocument: "civiccore-audited.pdf",
        reason: "The extracted audited turnover is below the mandatory financial threshold.",
        confidence: 0.89,
        status: "Not Eligible",
      },
    ],
  },
];
