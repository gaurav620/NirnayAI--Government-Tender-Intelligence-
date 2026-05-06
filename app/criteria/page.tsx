"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Shield, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

interface Criterion {
  id: string;
  label?: string;
  description: string;
  type?: string;
  mandatory: boolean;
  threshold: string;
  unit?: string;
  extractionConfidence?: number;
  confirmed?: boolean;
}

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    financial: "bg-emerald-100 text-emerald-800 border-emerald-200",
    technical: "bg-blue-100 text-blue-800 border-blue-200",
    compliance: "bg-purple-100 text-purple-800 border-purple-200",
    documentation: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const cls = map[type?.toLowerCase() || ""] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest border ${cls}`}>
      {type || "General"}
    </span>
  );
}

function ConfBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 h-1.5 rounded-full">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function CriteriaPage() {
  const { isSignedIn } = useUser();
  const params = useSearchParams();
  const workspaceId = params.get("workspace");

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/workspaces/${workspaceId}`)
      .then(r => r.json())
      .then(ws => {
        const extracted: Criterion[] = ws?.tenderOverview?.extractedCriteria || [];
        setCriteria(extracted);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [workspaceId]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-black text-[#003366] uppercase mb-4">Sign In Required</h2>
          <a href="/sign-in" className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest">Sign In</a>
        </div>
      </div>
    );
  }

  const mandatory = criteria.filter(c => c.mandatory);
  const optional = criteria.filter(c => !c.mandatory);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#003366] text-white px-6 py-4 border-b-2 border-[#FF9933]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#003366] flex items-center justify-center font-black text-lg">N</div>
            <span className="font-black text-lg uppercase tracking-tight">NirnayAI</span>
          </a>
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Criteria Review</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <a href="/dashboard" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-[#003366] uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </a>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tight">Extracted Criteria</h1>
        </div>

        {!workspaceId && (
          <div className="bg-amber-50 border border-amber-200 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-amber-700">No workspace selected. Open this page from the dashboard.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#FF9933] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && criteria.length === 0 && workspaceId && (
          <div className="bg-white border border-slate-200 p-12 text-center">
            <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h2 className="text-lg font-black text-slate-400 uppercase mb-2">No criteria extracted yet</h2>
            <p className="text-sm text-slate-400 font-medium">Upload a tender document to extract eligibility criteria via ML pipeline.</p>
          </div>
        )}

        {criteria.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Criteria", value: criteria.length, color: "text-[#003366]" },
                { label: "Mandatory", value: mandatory.length, color: "text-red-600" },
                { label: "Optional", value: optional.length, color: "text-slate-500" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-slate-200 p-6 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Mandatory */}
            {mandatory.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2 border-b-2 border-[#FF9933] pb-2 inline-flex">
                  <AlertCircle className="w-4 h-4 text-[#FF9933]" /> Mandatory Criteria
                </h2>
                <div className="space-y-3">
                  {mandatory.map(c => <CriterionCard key={c.id} criterion={c} expanded={!!expanded[c.id]} onToggle={() => setExpanded(p => ({ ...p, [c.id]: !p[c.id] }))} />)}
                </div>
              </div>
            )}

            {/* Optional */}
            {optional.length > 0 && (
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 inline-flex">
                  <CheckCircle2 className="w-4 h-4" /> Optional Criteria
                </h2>
                <div className="space-y-3">
                  {optional.map(c => <CriterionCard key={c.id} criterion={c} expanded={!!expanded[c.id]} onToggle={() => setExpanded(p => ({ ...p, [c.id]: !p[c.id] }))} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CriterionCard({ criterion: c, expanded, onToggle }: { criterion: Criterion; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-1 border border-slate-200 flex-shrink-0">
            {c.id}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#003366] truncate">{c.label || c.description}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <TypeBadge type={c.type} />
              {c.mandatory && (
                <span className="text-[9px] font-black text-[#FF9933] uppercase tracking-widest">• Mandatory</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <span className="text-xs font-bold text-slate-500 hidden sm:block">{c.threshold}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
            <p className="font-medium text-slate-700">{c.description}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Threshold</p>
            <p className="font-bold text-[#003366]">{c.threshold}{c.unit ? ` (${c.unit})` : ""}</p>
          </div>
          {c.extractionConfidence !== undefined && (
            <div className="sm:col-span-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Extraction Confidence</p>
              <ConfBar value={c.extractionConfidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
