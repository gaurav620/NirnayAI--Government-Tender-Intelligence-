"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileCheck2, FileSearch, Loader2, ScanText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CriteriaSkeleton } from "@/components/loading-skeletons";
import { useToast } from "@/components/ui/toast";
import { ApiError, evaluateVendors } from "@/lib/api";
import { mockCriteria } from "@/lib/mock-data";
import type { Criteria, UploadResponse } from "@/lib/types";

export default function CriteriaPage() {
  const router = useRouter();
  const toast = useToast();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("nirnayai-criteria");
    setCriteria(stored ? (JSON.parse(stored) as Criteria[]) : mockCriteria);
    setIsLoading(false);
  }, []);

  function updateCriterion(id: string, confirmed: boolean) {
    setCriteria((items) => items.map((item) => (item.id === id ? { ...item, confirmed } : item)));
  }

  async function confirmCriteria() {
    const confirmed = criteria.filter((c) => c.confirmed);
    if (confirmed.length === 0) {
      toast.warning("No criteria confirmed", "Enable at least one criterion to run evaluation.");
      return;
    }

    setIsEvaluating(true);
    try {
      const upload = JSON.parse(sessionStorage.getItem("nirnayai-upload") ?? "null") as UploadResponse | null;
      const vendorIds = upload?.vendorFileIds ?? ["mock-vendor-1", "mock-vendor-2", "mock-vendor-3"];
      const results = await evaluateVendors(vendorIds, criteria);
      toast.success("Evaluation complete", `${results.length} vendor(s) evaluated against ${confirmed.length} criteria.`);
      sessionStorage.setItem("nirnayai-criteria", JSON.stringify(criteria));
      sessionStorage.setItem("nirnayai-results", JSON.stringify(results));
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Evaluation service unavailable.";
      toast.error("Evaluation failed", message);
      setIsEvaluating(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass-panel rounded-[1.5rem] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Human-in-the-loop verification
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Confirm AI extracted tender criteria</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Review the source document beside structured criteria before vendor evaluation begins.
            </p>
          </div>
          <Button
            size="lg"
            onClick={confirmCriteria}
            disabled={isEvaluating || isLoading}
            className="rounded-xl shadow-glow transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-elevated"
          >
            {isEvaluating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Confirm Criteria
          </Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="min-h-[600px] overflow-hidden border-slate-100 bg-white/80 shadow-government">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <FileSearch className="h-5 w-5 text-blue-700" />
              Tender PDF Viewer
            </CardTitle>
            <CardDescription className="text-sm">Mock source preview for extracted criteria validation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[460px] flex-col rounded-[1.5rem] border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 shadow-inner">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-soft">
                <div>
                  <p className="text-sm font-bold text-slate-900">Government of India Tender Document</p>
                  <p className="text-xs text-slate-400 mt-1">Procurement of AI-enabled tender scrutiny platform</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 shadow-soft">
                  <FileCheck2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-5 text-sm leading-7 text-slate-600 shadow-soft">
                <p><span className="rounded bg-amber-100/60 px-1.5 py-0.5 font-semibold text-amber-800">Minimum technical capability score shall be 75 marks.</span></p>
                <p><span className="rounded bg-amber-100/60 px-1.5 py-0.5 font-semibold text-amber-800">Average annual turnover shall not be less than INR 50 crores.</span></p>
                <p><span className="rounded bg-amber-100/60 px-1.5 py-0.5 font-semibold text-amber-800">Valid statutory registrations and non-blacklisting certificate are mandatory.</span></p>
                <p className="text-slate-500">Delivery timeline compliance may be considered for preference during final review.</p>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  { label: "Criteria found", value: "4" },
                  { label: "Mandatory", value: "3" },
                  { label: "Confidence", value: "91%" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-soft transition-all hover:bg-white hover:shadow-government">
                    <p className="text-lg font-black text-slate-900">{item.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-white/80 shadow-government">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <ScanText className="h-5 w-5 text-blue-700" />
              AI Extracted Criteria Checklist
            </CardTitle>
            <CardDescription className="text-sm">
              Toggle to confirm whether each criterion should be used by the rule engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CriteriaSkeleton />
            ) : (
              <div className="space-y-3">
                {criteria.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-government"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-6 text-slate-950">{item.description}</p>
                        <p className="mt-1.5 text-sm text-slate-400">Threshold: {item.threshold}</p>
                      </div>
                      <Badge
                        variant={item.mandatory ? "danger" : "secondary"}
                        className={item.mandatory ? "bg-red-50 text-red-700 border-red-100" : "bg-slate-100 text-slate-600 border-slate-200"}
                      >
                        {item.mandatory ? "Mandatory" : "Optional"}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-inner">
                      <span className="text-sm font-semibold text-slate-600">Confirm criterion</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">No</span>
                        <Switch
                          checked={Boolean(item.confirmed)}
                          onCheckedChange={(checked) => updateCriterion(item.id, checked)}
                        />
                        <span className="text-xs font-bold text-emerald-600">Yes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
