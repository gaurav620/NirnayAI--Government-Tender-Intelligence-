import type { Officer } from "@/lib/types";

/**
 * Demo officer roster. In production this comes from an auth provider.
 */
export const DEMO_OFFICERS: Officer[] = [
  { id: "off-alice", name: "Alice Kumar", role: "Procurement Officer" },
  { id: "off-bob", name: "Bob Singh", role: "Legal Reviewer" },
  { id: "off-ravi", name: "Ravi Menon", role: "Finance Head" },
  { id: "off-priya", name: "Priya Sharma", role: "Technical Evaluator" },
];

const STORAGE_KEY = "nirnayai-active-officer";

export function getActiveOfficer(): Officer {
  if (typeof window === "undefined") return DEMO_OFFICERS[0];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Officer;
  } catch {
    // ignore
  }
  return DEMO_OFFICERS[0];
}

export function setActiveOfficer(officer: Officer): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(officer));
  // Broadcast for any listening component
  window.dispatchEvent(new CustomEvent("nirnayai-officer-change", { detail: officer }));
}
