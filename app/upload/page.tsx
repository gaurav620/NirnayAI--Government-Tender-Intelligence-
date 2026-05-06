"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UploadCloud, FileText, File, Image as ImageIcon, X, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

type UploadStep = "select" | "uploading" | "done" | "error";

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  if (type.includes("image")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-slate-500" />;
}

export default function UploadPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [bidderFiles, setBidderFiles] = useState<File[]>([]);
  const [step, setStep] = useState<UploadStep>("select");
  const [workspaceName, setWorkspaceName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDraggingTender, setIsDraggingTender] = useState(false);
  const [isDraggingBidder, setIsDraggingBidder] = useState(false);
  const tenderInputRef = useRef<HTMLInputElement>(null);
  const bidderInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!tenderFile || !workspaceName.trim()) return;
    setStep("uploading");

    try {
      const { createWorkspace, addTenderDocuments, addBidderDocuments, processDocumentML, extractCriteriaML, updateDocumentText, updateWorkspace } = await import("@/lib/api-client");

      // 1. Create workspace
      const ws = await createWorkspace(workspaceName.trim());

      // 2. Register tender document in DB
      const tenderDocs = await addTenderDocuments(ws.id, [{ name: tenderFile.name, size: tenderFile.size, type: tenderFile.type || "application/pdf" }]);

      // 3. OCR + extract criteria via ML pipeline
      let extractedCriteria: any[] = [];
      try {
        const mlText = await processDocumentML(tenderFile);
        const text = mlText.full_text || mlText.text || "";
        if (text && tenderDocs[0]) {
          await updateDocumentText(ws.id, tenderDocs[0].id, text);
        }
        const criteria = await extractCriteriaML(tenderFile);
        extractedCriteria = Array.isArray(criteria) ? criteria : [];
      } catch (mlErr) {
        console.warn("[Upload] ML extraction failed (non-critical):", mlErr);
      }

      // 4. Register bidder documents
      if (bidderFiles.length > 0) {
        for (const bf of bidderFiles) {
          const bidderName = bf.name.replace(/\.[^.]+$/, "");
          const { createBidder } = await import("@/lib/api-client");
          const bidder = await createBidder(ws.id, bidderName);
          await addBidderDocuments(ws.id, bidder.id, [{ name: bf.name, size: bf.size, type: bf.type || "application/pdf" }]);
        }
      }

      // 5. Save criteria in tenderOverview
      if (extractedCriteria.length > 0) {
        await updateWorkspace(ws.id, { tenderOverview: { extractedCriteria } });
      }

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
      setStep("error");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-black text-[#003366] uppercase mb-4">Sign In Required</h2>
          <a href="/sign-in" className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#002244] transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#003366] text-white px-6 py-4 border-b-2 border-[#FF9933]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[#003366] flex items-center justify-center font-black text-lg">N</div>
            <span className="font-black text-lg uppercase tracking-tight">NirnayAI</span>
          </a>
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Document Upload Portal</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-24">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-black text-[#003366] uppercase mb-2">Upload Complete</h2>
            <p className="text-slate-500 font-medium mb-6">Redirecting to your workspace dashboard…</p>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-black text-red-600 uppercase mb-2">Upload Failed</h2>
            <p className="text-red-500 mb-6">{errorMsg}</p>
            <button onClick={() => setStep("select")} className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#002244]">
              Try Again
            </button>
          </div>
        )}

        {step === "uploading" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 relative mb-6">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#FF9933] rounded-full border-t-transparent animate-spin" />
            </div>
            <h2 className="text-xl font-black text-[#003366] uppercase mb-2">Processing via ML Pipeline…</h2>
            <p className="text-slate-500 text-sm font-medium animate-pulse">OCR → Criteria Extraction → Building Workspace</p>
          </div>
        )}

        {step === "select" && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight mb-2">Upload Tender Documents</h1>
              <p className="text-slate-500 font-medium">Upload your tender document and optional bidder submissions. The ML pipeline will extract text and criteria automatically.</p>
            </div>

            {/* Workspace Name */}
            <div className="mb-8">
              <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Workspace / Tender Reference ID</label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="e.g., CRPF/PROC/2026/01"
                className="w-full border-2 border-slate-200 p-4 text-sm font-medium focus:outline-none focus:border-[#003366] bg-white"
              />
            </div>

            {/* Tender File */}
            <div className="mb-8">
              <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">
                Tender Document <span className="text-[#FF9933]">*</span>
              </label>
              {tenderFile ? (
                <div className="border-2 border-green-300 bg-green-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(tenderFile.type)}
                    <div>
                      <p className="text-sm font-bold text-[#003366]">{tenderFile.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{(tenderFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setTenderFile(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${isDraggingTender ? "border-[#FF9933] bg-[#FF9933]/5" : "border-slate-300 hover:border-[#003366] bg-white"}`}
                  onDragOver={e => { e.preventDefault(); setIsDraggingTender(true); }}
                  onDragLeave={() => setIsDraggingTender(false)}
                  onDrop={e => { e.preventDefault(); setIsDraggingTender(false); const f = e.dataTransfer.files[0]; if (f) setTenderFile(f); }}
                  onClick={() => tenderInputRef.current?.click()}
                >
                  <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#003366] mb-1">Drop tender PDF here or click to browse</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supports PDF, DOCX, JPG, PNG</p>
                  <input ref={tenderInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setTenderFile(f); }} />
                </div>
              )}
            </div>

            {/* Bidder Files */}
            <div className="mb-10">
              <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">
                Bidder Documents <span className="text-slate-400 font-bold normal-case tracking-normal">(optional)</span>
              </label>
              <div
                className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors mb-4 ${isDraggingBidder ? "border-[#FF9933] bg-[#FF9933]/5" : "border-slate-300 hover:border-[#003366] bg-white"}`}
                onDragOver={e => { e.preventDefault(); setIsDraggingBidder(true); }}
                onDragLeave={() => setIsDraggingBidder(false)}
                onDrop={e => { e.preventDefault(); setIsDraggingBidder(false); setBidderFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                onClick={() => bidderInputRef.current?.click()}
              >
                <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#003366]">Drop bidder files here or click to add</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Multiple files supported</p>
                <input ref={bidderInputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) setBidderFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]); }} />
              </div>
              {bidderFiles.length > 0 && (
                <div className="space-y-2">
                  {bidderFiles.map((f, i) => (
                    <div key={i} className="border border-slate-200 p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        {getFileIcon(f.type)}
                        <div>
                          <p className="text-xs font-bold text-[#003366]">{f.name}</p>
                          <p className="text-[10px] text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => setBidderFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <a href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-[#003366] uppercase tracking-widest">← Back to Dashboard</a>
              <button
                onClick={handleSubmit}
                disabled={!tenderFile || !workspaceName.trim()}
                className="bg-[#003366] text-white px-10 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#002244] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Upload & Process <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
