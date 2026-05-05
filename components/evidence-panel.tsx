"use client";

import { X, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { VendorResult } from "@/lib/types";

export function EvidencePanel({ vendor, open, onClose }: { vendor: VendorResult | null; open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        className={open ? "fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-md animate-fade-in" : "hidden"}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xl transform overflow-y-auto border-l border-slate-100 bg-white/95 shadow-2xl backdrop-blur transition-transform duration-300 ease-smooth ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Evidence Review</p>
              <h2 className="mt-1.5 text-xl font-black text-slate-950">{vendor?.name ?? "Vendor"}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </div>
        <div className="space-y-4 p-5">
          {vendor?.evidence.map((item) => (
            <Card key={`${item.criterionName}-${item.sourceDocument}`} className="overflow-hidden border-slate-100 bg-white shadow-soft transition-all duration-300 hover:shadow-government">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-bold text-slate-900">{item.criterionName}</CardTitle>
                  <StatusBadge status={item.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm sm:grid-cols-2 shadow-inner">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extracted value</p>
                    <p className="mt-1 font-bold text-slate-800">{item.extractedValue}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Required threshold</p>
                    <p className="mt-1 font-bold text-slate-800">{item.requiredThreshold}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-soft">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  Source: <span className="font-bold text-slate-800">{item.sourceDocument}</span>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-900 shadow-soft">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                    <Sparkles className="h-4 w-4" />
                    AI Reasoning
                  </div>
                  <p className="leading-relaxed text-sm">{item.reason}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 ${confidenceWidthClass(item.confidence)}`} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {!vendor?.evidence.length ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-400 text-center">
              No evidence available for this vendor.
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function confidenceWidthClass(confidence: number) {
  if (confidence >= 0.95) return "w-[95%]";
  if (confidence >= 0.9) return "w-[90%]";
  if (confidence >= 0.85) return "w-[85%]";
  if (confidence >= 0.8) return "w-[80%]";
  if (confidence >= 0.75) return "w-3/4";
  return "w-2/3";
}
