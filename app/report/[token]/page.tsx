"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  Loader2,
  Lock,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { VendorTable } from "@/components/vendor-table";
import { EvidencePanel } from "@/components/evidence-panel";
import { ApiError, getReport } from "@/lib/api";
import type { Report, SignatureDecision, VendorResult } from "@/lib/types";

const DECISION_CLASS: Record<SignatureDecision, string> = {
  approve: "bg-emerald-50 text-emerald-700 border-emerald-100",
  reject: "bg-red-50 text-red-700 border-red-100",
  override: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorResult | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await getReport(token);
        setReport(r);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Report not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-6 py-4 shadow-elevated">
          <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
          <span className="text-sm font-semibold text-slate-700">Loading report…</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-red-100 bg-white/90 shadow-elevated">
          <CardContent className="p-6 text-center">
            <FileWarning className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 text-lg font-bold text-slate-950">Report unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">{error ?? "This report link may be invalid or expired."}</p>
            <Button className="mt-5 rounded-xl" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = {
    eligible: report.vendors.filter((v) => v.finalVerdict === "Eligible").length,
    review: report.vendors.filter((v) => v.finalVerdict === "Manual Review").length,
    rejected: report.vendors.filter((v) => v.finalVerdict === "Not Eligible").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-[1.5rem] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Shared read-only report
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{report.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Created by <strong className="text-slate-800">{report.createdBy.name}</strong> ·{" "}
              {report.createdBy.role} · {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report.locked ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 shadow-soft">
                <Lock className="h-4 w-4" /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
                <ShieldCheck className="h-4 w-4" /> Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <MiniMetric title="Total vendors" value={report.vendors.length} />
        <MiniMetric title="Eligible" value={metrics.eligible} status="Eligible" />
        <MiniMetric title="Manual review" value={metrics.review} status="Manual Review" />
        <MiniMetric title="Not eligible" value={metrics.rejected} status="Not Eligible" />
      </div>

      {/* Vendor table */}
      <Card className="border-slate-100 bg-white/80 shadow-government">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ScrollText className="h-5 w-5 text-blue-700" />
            Vendor evaluation matrix
          </CardTitle>
          <CardDescription>Click a vendor to inspect source evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          <VendorTable vendors={report.vendors} onSelectVendor={setSelectedVendor} />
        </CardContent>
      </Card>

      {/* Criteria summary */}
      <Card className="border-slate-100 bg-white/80 shadow-government">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
            Criteria applied ({report.criteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {report.criteria.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold leading-5 text-slate-900">{c.description}</p>
                <Badge
                  variant={c.mandatory ? "danger" : "secondary"}
                  className={c.mandatory ? "bg-red-50 text-red-700 border-red-100" : "bg-slate-100 text-slate-600 border-slate-200"}
                >
                  {c.mandatory ? "Mandatory" : "Optional"}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Threshold: {c.threshold}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="border-slate-100 bg-white/80 shadow-government">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Signatures ({report.signatures.length})
          </CardTitle>
          <CardDescription>
            {report.locked
              ? `Locked by ${report.lockedBy?.name} on ${
                  report.lockedAt ? new Date(report.lockedAt).toLocaleString() : "—"
                }.`
              : "Live — additional officers may still sign via the dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.signatures.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center text-sm text-slate-400">
              No signatures yet.
            </p>
          ) : (
            <div className="space-y-3">
              {report.signatures.map((s, i) => (
                <div
                  key={`${s.officer.id}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-soft"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-xs font-black text-blue-700">
                    {s.officer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{s.officer.name}</p>
                      <span className="text-xs font-semibold text-slate-400">· {s.officer.role}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DECISION_CLASS[s.decision]}`}
                      >
                        {s.decision}
                      </span>
                    </div>
                    {s.note ? <p className="mt-1 text-sm italic text-slate-500">&ldquo;{s.note}&rdquo;</p> : null}
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {new Date(s.signedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EvidencePanel vendor={selectedVendor} open={Boolean(selectedVendor)} onClose={() => setSelectedVendor(null)} />
    </div>
  );
}

function MiniMetric({
  title,
  value,
  status,
}: {
  title: string;
  value: number;
  status?: "Eligible" | "Not Eligible" | "Manual Review";
}) {
  return (
    <Card className="border-slate-100 bg-white/70 shadow-soft">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        {status ? (
          <div className="mt-2">
            <StatusBadge status={status} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
