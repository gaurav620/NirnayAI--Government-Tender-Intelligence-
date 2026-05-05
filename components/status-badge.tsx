import { Badge } from "@/components/ui/badge";
import type { EvaluationStatus } from "@/lib/types";

const statusVariant: Record<EvaluationStatus, "success" | "danger" | "warning"> = {
  Eligible: "success",
  "Not Eligible": "danger",
  "Manual Review": "warning",
};

export function StatusBadge({ status }: { status: EvaluationStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}
