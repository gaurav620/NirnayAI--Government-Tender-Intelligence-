"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, FileStack, Loader2, LockKeyhole, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApiError, extractCriteria, uploadTenderFiles } from "@/lib/api";

const trustBadges = [
  { label: "Encrypted intake", icon: LockKeyhole, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Evidence traceability", icon: FileStack, color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Faster review cycles", icon: TimerReset, color: "bg-amber-50 text-amber-700 border-amber-100" },
];

const workflowSteps = [
  "AI extracts criteria and thresholds",
  "Officer confirms mandatory requirements",
  "Rule engine evaluates vendors deterministically",
  "Evidence drawer shows source-backed reasoning",
];

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const [tenderFiles, setTenderFiles] = useState<File[]>([]);
  const [vendorFiles, setVendorFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function startAnalysis() {
    if (!tenderFiles[0]) {
      toast.warning("Tender file required", "Please upload the tender notice PDF.");
      return;
    }
    if (vendorFiles.length === 0) {
      toast.warning("Vendor files required", "Upload at least one vendor submission to proceed.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const upload = await uploadTenderFiles(tenderFiles[0], vendorFiles);
      toast.success("Documents uploaded", `${vendorFiles.length} vendor file(s) secured.`);

      const criteria = await extractCriteria(upload.tenderFileId);
      toast.success("Criteria extracted", `${criteria.length} requirements identified for review.`);

      sessionStorage.setItem("nirnayai-upload", JSON.stringify(upload));
      sessionStorage.setItem("nirnayai-criteria", JSON.stringify(criteria));
      router.push("/criteria");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unexpected error during analysis.";
      toast.error("Analysis failed", message);
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-[1.5rem] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI tender evaluation workflow
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Upload tender documents
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              NirnayAI extracts tender criteria, evaluates vendor submissions, and presents evidence-backed
              eligibility decisions for officer review.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 shadow-soft">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-600">Secure intake enabled</span>
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
        {/* Upload Area */}
        <Card className="aurora-card overflow-hidden border-slate-200/60 bg-white/85 shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Document intake</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Upload tender notice and vendor submissions to begin AI evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FileDropzone
              title="Tender PDF"
              description="Upload the official tender notice or bid document."
              files={tenderFiles}
              accept="application/pdf"
              onFilesChange={(files) => setTenderFiles(files.slice(0, 1))}
            />
            <FileDropzone
              title="Vendor files"
              description="Upload multiple vendor PDFs or ZIP archive."
              files={vendorFiles}
              multiple
              accept="application/pdf,.zip,application/zip"
              onFilesChange={setVendorFiles}
            />
          </CardContent>
          <CardContent className="grid gap-2.5 pt-0 sm:grid-cols-3">
            {trustBadges.map((item) => (
              <div
                key={item.label}
                className={`group flex items-center gap-3 rounded-xl border ${item.color.split(" ")[2]} ${item.color.split(" ")[0]} px-4 py-3 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-government`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${item.color.split(" ")[1]}`} />
                <p className="text-xs font-semibold">{item.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Workflow Panel */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white shadow-elevated">
          <CardHeader className="pb-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
              <BadgeCheck className="h-6 w-6 text-amber-300" />
            </div>
            <CardTitle className="text-2xl font-black">Secure workflow</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-blue-200/70">
              Every decision remains explainable and open to manual verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {workflowSteps.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.08]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-amber-300">
                  {i + 1}
                </div>
                {item}
              </div>
            ))}
            <Button
              className="mt-3 w-full rounded-xl bg-white text-slate-900 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-government"
              size="lg"
              onClick={startAnalysis}
              disabled={!tenderFiles[0] || vendorFiles.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel rounded-[1.75rem] p-10 text-center shadow-elevated">
            <div className="relative mx-auto mb-5 h-16 w-16">
              <Loader2 className="h-16 w-16 animate-spin text-blue-700" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-100/30" />
            </div>
            <p className="text-lg font-bold text-slate-950">AI analyzing documents...</p>
            <p className="mt-2 text-sm text-slate-500">Extracting criteria, thresholds, and submission metadata.</p>
            <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100 mx-auto">
              <div className="h-full w-1/3 rounded-full bg-blue-600 animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
