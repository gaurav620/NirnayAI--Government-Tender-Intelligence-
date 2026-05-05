"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, BarChart3, CheckCircle2, Clock3, FileWarning, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { AuditPanel } from "@/components/audit-panel";
import { EvidencePanel } from "@/components/evidence-panel";
import { DashboardSkeleton } from "@/components/loading-skeletons";
import { ReportActions } from "@/components/report-actions";
import { StatusBadge } from "@/components/status-badge";
import { VendorTable } from "@/components/vendor-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getResults } from "@/lib/api";
import type { Criteria, VendorResult } from "@/lib/types";

const metricConfigs = [
  { key: "total", title: "Total Vendors", icon: BarChart3, color: "bg-slate-100 text-slate-700", borderColor: "border-slate-100" },
  { key: "eligible", title: "Eligible", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700", borderColor: "border-emerald-100" },
  { key: "review", title: "Manual Review", icon: Clock3, color: "bg-amber-50 text-amber-700", borderColor: "border-amber-100" },
  { key: "rejected", title: "Not Eligible", icon: ShieldAlert, color: "bg-red-50 text-red-700", borderColor: "border-red-100" },
];

export default function DashboardPage() {
  const { success, error } = useToast();
  const [vendors, setVendors] = useState<VendorResult[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async (notify = false) => {
    setIsLoading(true);
    try {
      const stored = sessionStorage.getItem("nirnayai-results");
      const results = stored ? (JSON.parse(stored) as VendorResult[]) : await getResults();
      setVendors(results);
      const storedCriteria = sessionStorage.getItem("nirnayai-criteria");
      if (storedCriteria) setCriteria(JSON.parse(storedCriteria) as Criteria[]);
      if (notify) success("Dashboard refreshed", `${results.length} vendor result(s) loaded.`);
    } catch (err) {
      error("Could not load results", "Falling back to last cached data.");
    } finally {
      setIsLoading(false);
    }
  }, [success, error]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const metrics = useMemo(() => {
    return {
      eligible: vendors.filter((v) => v.finalVerdict === "Eligible").length,
      review: vendors.filter((v) => v.finalVerdict === "Manual Review").length,
      rejected: vendors.filter((v) => v.finalVerdict === "Not Eligible").length,
      total: vendors.length,
    };
  }, [vendors]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-[1.5rem] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Evaluation Results
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Tender Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Monitor vendor eligibility, inspect evidence, and identify cases requiring manual review.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadResults(true)}
            disabled={isLoading}
            className="rounded-xl border-slate-200 bg-white/80 shadow-soft transition-all duration-300 hover:bg-white hover:shadow-government"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Results
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        {metricConfigs.map((config) => (
          <MetricCard
            key={config.key}
            title={config.title}
            value={metrics[config.key as keyof typeof metrics]}
            icon={<config.icon className="h-5 w-5" />}
            colorClass={config.color}
            borderColor={config.borderColor}
            status={config.key !== "total" ? (config.key === "eligible" ? "Eligible" : config.key === "review" ? "Manual Review" : "Not Eligible") : undefined}
          />
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-100 bg-white/80 shadow-government">
        <CardHeader className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-blue-700" />
              Vendor Evaluation Matrix
            </CardTitle>
            <CardDescription className="text-sm">
              Click any vendor row to open the evidence drawer.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="Eligible" />
            <StatusBadge status="Not Eligible" />
            <StatusBadge status="Manual Review" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <VendorTable vendors={vendors} onSelectVendor={setSelectedVendor} />
          )}
        </CardContent>
      </Card>

      {/* Report actions + Audit log */}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <ReportActions criteria={criteria} vendors={vendors} />
        <AuditPanel />
      </div>

      {/* Warning */}
      <Card className="border-amber-100 bg-amber-50/70 shadow-soft">
        <CardContent className="flex gap-3 p-5 text-sm text-amber-900">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          Final procurement decisions should be approved by authorized officers after reviewing mandatory criteria and source evidence.
        </CardContent>
      </Card>

      <EvidencePanel vendor={selectedVendor} open={Boolean(selectedVendor)} onClose={() => setSelectedVendor(null)} />
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  colorClass,
  borderColor,
  status,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  colorClass: string;
  borderColor: string;
  status?: "Eligible" | "Not Eligible" | "Manual Review";
}) {
  return (
    <Card className={`group overflow-hidden border ${borderColor} bg-white/70 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-government`}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          {status ? (
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          ) : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass} shadow-soft transition-all duration-300 ease-smooth group-hover:scale-110`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
