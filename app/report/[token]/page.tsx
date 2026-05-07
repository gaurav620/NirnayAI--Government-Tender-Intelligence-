"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, CheckCircle2, AlertCircle, X, Lock, Shield, Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

// Matches the Report type from lib/api.ts → Python backend
interface Officer { id: string; name: string; role: string; }
interface Signature { officer: Officer; decision: string; note: string; signedAt: string; }
interface Criteria { id: string; description: string; threshold: string; mandatory: boolean; label?: string; type?: string; }
interface Evidence { criterionName: string; extractedValue: string; requiredThreshold: string; sourceDocument: string; reason: string; confidence: number; status: string; }
interface VendorResult { id: string; name: string; technicalStatus: string; financialStatus: string; complianceStatus: string; finalVerdict: string; evidence: Evidence[]; }
interface Report {
  token: string; title: string; createdAt: string; createdBy: Officer;
  criteria: Criteria[]; vendors: VendorResult[]; signatures: Signature[];
  locked: boolean; lockedAt: string | null; lockedBy: Officer | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "Eligible" || verdict === "Clearly Eligible")
    return <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">✓ Eligible</span>;
  if (verdict === "Not Eligible" || verdict === "Clearly Not Eligible")
    return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">✗ Not Eligible</span>;
  return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">⚠ Review</span>;
}

function SignatureChip({ sig }: { sig: Signature }) {
  const colors: Record<string, string> = {
    approve: "border-green-300 bg-green-50 text-green-800",
    reject: "border-red-300 bg-red-50 text-red-800",
    override: "border-amber-300 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`border-2 p-4 ${colors[sig.decision] || "border-slate-200 bg-slate-50"}`}>
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-xs font-black text-[#003366] uppercase">{sig.officer.name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sig.officer.role}</p>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors[sig.decision] || ""}`}>
          {sig.decision}
        </span>
      </div>
      {sig.note && <p className="text-xs text-slate-600 font-medium mt-2 italic">"{sig.note}"</p>}
      <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-wider">
        {new Date(sig.signedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#003366]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#003366] text-sm">{vendor.name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[9px] font-black text-slate-400 uppercase">Tech: <span className={vendor.technicalStatus === "Eligible" ? "text-green-600" : vendor.technicalStatus === "Not Eligible" ? "text-red-600" : "text-amber-600"}>{vendor.technicalStatus}</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase">Fin: <span className={vendor.financialStatus === "Eligible" ? "text-green-600" : vendor.financialStatus === "Not Eligible" ? "text-red-600" : "text-amber-600"}>{vendor.financialStatus}</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase">Comp: <span className={vendor.complianceStatus === "Eligible" ? "text-green-600" : vendor.complianceStatus === "Not Eligible" ? "text-red-600" : "text-amber-600"}>{vendor.complianceStatus}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <VerdictBadge verdict={vendor.finalVerdict} />
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {open && vendor.evidence.length > 0 && (
        <div className="border-t border-slate-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest">Criterion</th>
                <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Extracted</th>
                <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Source</th>
                <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {vendor.evidence.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium text-[#003366]">{e.criterionName}</td>
                  <td className="p-3 text-slate-600 hidden md:table-cell">{e.extractedValue}</td>
                  <td className="p-3 text-slate-400 hidden lg:table-cell truncate max-w-[150px]">{e.sourceDocument}</td>
                  <td className="p-3 text-right"><VerdictBadge verdict={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/reports/${token}`)
      .then(r => { if (!r.ok) throw new Error(`Report not found (${r.status})`); return r.json(); })
      .then(data => { setReport(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  const handlePrint = () => {
    window.open(`${API_BASE}/reports/${token}/pdf`, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-200 border-t-[#FF9933] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#003366] uppercase mb-2">Report Not Found</h2>
          <p className="text-slate-500 font-medium mb-6">{error || "This report link is invalid or has expired."}</p>
          <a href="/dashboard" className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#002244]">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  const eligibleCount = report.vendors.filter(v => v.finalVerdict === "Eligible").length;
  const reviewCount = report.vendors.filter(v => v.finalVerdict === "Manual Review").length;
  const rejectedCount = report.vendors.filter(v => v.finalVerdict === "Not Eligible").length;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Tricolor strip */}
      <div className="flex h-[5px] w-full">
        <div className="bg-[#FF9933] flex-1" />
        <div className="bg-white flex-1" />
        <div className="bg-[#138808] flex-1" />
      </div>

      {/* Header */}
      <header className="bg-[#003366] text-white px-6 py-5 border-b-2 border-[#FF9933] print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#003366] flex items-center justify-center font-black text-lg">N</div>
            <span className="font-black text-lg uppercase tracking-tight">NirnayAI</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border border-white/20">
              <Download className="w-4 h-4" /> Export / Print
            </button>
            <a href="/dashboard" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border border-white/20">
              <ExternalLink className="w-4 h-4" /> Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 print:py-4">
        {/* Report Header */}
        <div className="bg-white border border-slate-200 p-8 mb-8 shadow-sm print:shadow-none print:border-slate-300">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {report.locked
                  ? <span className="flex items-center gap-1.5 bg-slate-800 text-white text-[9px] font-black uppercase px-3 py-1 tracking-widest"><Lock className="w-3 h-3" /> Locked</span>
                  : <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black uppercase px-3 py-1 tracking-widest">Draft</span>
                }
              </div>
              <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight mb-2">{report.title}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Token: <span className="font-mono text-[#003366]">{report.token}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created by</p>
              <p className="font-black text-[#003366]">{report.createdBy.name}</p>
              <p className="text-xs text-slate-400">{report.createdBy.role}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(report.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Eligible", value: eligibleCount, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Manual Review", value: reviewCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Not Eligible", value: rejectedCount, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          ].map(s => (
            <div key={s.label} className={`border-2 p-6 text-center ${s.bg}`}>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Vendor Results */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2 border-b-2 border-[#FF9933] pb-2">
            <Shield className="w-4 h-4" /> Bidder Evaluations ({report.vendors.length})
          </h2>
          <div className="space-y-3">
            {report.vendors.length === 0
              ? <p className="text-slate-400 text-sm font-medium py-8 text-center">No vendor evaluations in this report.</p>
              : report.vendors.map(v => <VendorCard key={v.id} vendor={v} />)
            }
          </div>
        </div>

        {/* Criteria Reference */}
        {report.criteria.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
              Evaluation Criteria ({report.criteria.length})
            </h2>
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Threshold</th>
                    <th className="text-center p-3 font-black text-slate-400 uppercase tracking-widest">Mandatory</th>
                  </tr>
                </thead>
                <tbody>
                  {report.criteria.map((c, i) => (
                    <tr key={c.id} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                      <td className="p-3 font-mono font-bold text-slate-500">{c.id}</td>
                      <td className="p-3 font-medium text-[#003366]">{c.label || c.description}</td>
                      <td className="p-3 text-slate-500 hidden sm:table-cell">{c.threshold}</td>
                      <td className="p-3 text-center">
                        {c.mandatory
                          ? <CheckCircle2 className="w-4 h-4 text-[#FF9933] mx-auto" />
                          : <X className="w-4 h-4 text-slate-300 mx-auto" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Officer Signatures ({report.signatures.length})
          </h2>
          {report.signatures.length === 0
            ? <p className="text-slate-400 text-sm font-medium py-6 text-center border border-dashed border-slate-200 bg-white">No signatures yet.</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.signatures.map((sig, i) => <SignatureChip key={i} sig={sig} />)}
              </div>
            )
          }
        </div>

        {/* Lock info */}
        {report.locked && report.lockedBy && (
          <div className="bg-slate-800 text-white p-6 flex items-center gap-4">
            <Lock className="w-6 h-6 text-[#FF9933] flex-shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#FF9933] mb-1">Report Locked</p>
              <p className="text-sm font-medium">
                Locked by <strong>{report.lockedBy.name}</strong> ({report.lockedBy.role}) on{" "}
                {report.lockedAt ? new Date(report.lockedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "—"}
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-10 print:mt-4">
          NirnayAI • Government of India • CRPF Procurement Division • {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
