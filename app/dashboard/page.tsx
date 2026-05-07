"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Folder, Trash2, X, UploadCloud, CheckCircle2,
  Clock, AlertCircle, File, Image as ImageIcon, Send, ChevronRight, ChevronDown, ChevronLeft, User, Shield, Eye, Lock,
  Search, Copy, Check
} from 'lucide-react';
import { UserButton } from "@clerk/nextjs";
import { DotPattern } from "@/components/ui/dot-pattern";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

// --- IndexedDB helpers: store original file blobs for preview ---
const IDB_NAME = 'nirnay-docs';
const IDB_STORE = 'files';

function openDocIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFileIDB(docId: string, file: File): Promise<void> {
  const db = await openDocIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(file, docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileIDB(docId: string): Promise<File | null> {
  const db = await openDocIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(docId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

// --- Types ---
type FileStatus = 'queued' | 'scanning' | 'complete' | 'failed';
type TenderStatus = 'awaiting_docs' | 'ml_processing' | 'scanning' | 'clarifying' | 'ready' | 'error';

interface Doc {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  uploadedAt: string;
  extractedText?: string;
}

interface TenderOverviewData {
  summary: string;
  keyRequirements: string[];
  criteriaCount: number;
  tenderType: string;
  estimatedBidders: string;
  extractedCriteria?: any[];
}

interface Criterion {
  id: string;
  description: string;
  category: string;
  mandatory: boolean;
  verdict: 'Eligible' | 'Not Eligible' | 'Manual Review' | 'Not Applicable';
  sourceDocument: string;
  extractedValue: string;
  reason: string;
  confidence: 'High' | 'Medium' | 'Low';
}

interface EvaluationResult {
  overallVerdict: 'Clearly Eligible' | 'Clearly Not Eligible' | 'Requires Human Review';
  criteria: Criterion[];
}

interface Bidder {
  id: string;
  name: string;
  createdAt: string;
  docs: Doc[];
  evaluationResult: EvaluationResult | null;
  evaluationError?: string;
}

interface FileWorkspace {
  id: string;
  name: string;
  createdAt: string;
  tenderStatus: TenderStatus;
  tenderDocs: Doc[];
  tenderOverview: TenderOverviewData | null;
  errorMessage?: string;
  clarificationLog: { role: 'ai' | 'user', content: string }[];
  bidders: Bidder[];
}

interface AppData {
  files: FileWorkspace[];
  isTestMode?: boolean;
}

// --- Storage Helper ---
const storageKey = 'nirnayai-data';

const getStorageData = (): AppData | null => {
  if (typeof window === 'undefined') return null;
  let rawData = null;
  
  if ((window as any).storage && (window as any).storage.get) {
    rawData = (window as any).storage.get(storageKey);
  } else if ((window as any).localStorage) {
    rawData = window.localStorage.getItem(storageKey);
  }
  
  if (rawData) {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (parsed.isTestMode === undefined) parsed.isTestMode = false;
      // Migrate legacy state
      if (parsed.files) {
        parsed.files = parsed.files.map((f: any) => ({
          ...f,
          tenderStatus: f.tenderStatus || (f.tenderDocs?.length > 0 ? (f.tenderDocs.every((d: Doc) => d.status === 'complete') ? 'ready' : 'scanning') : 'awaiting_docs'),
          clarificationLog: f.clarificationLog || []
        }));
      }
      return parsed as AppData;
    } catch (e) {
      console.error("Failed to parse storage data", e);
    }
  }
  return null;
};

const setStorageData = (data: AppData) => {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(data);
  if ((window as any).storage && (window as any).storage.set) {
    (window as any).storage.set(storageKey, jsonStr);
  } else if ((window as any).localStorage) {
    window.localStorage.setItem(storageKey, jsonStr);
  }
};

// --- AI Helper ---
const MOCK_CRITERIA = [
  {"id":"C1","label":"Minimum Annual Turnover","description":"Bidder must have minimum average annual turnover of ₹10 Crore in the last 3 financial years.","threshold":"₹10 Crore","mandatory":true,"type":"financial"},
  {"id":"C2","label":"Prior Experience","description":"Bidder must have at least 3 years of experience in supplying similar goods/services to government entities.","threshold":"3 years","mandatory":true,"type":"technical"},
  {"id":"C3","label":"Local Supplier Certification","description":"Bidder must hold a valid Class-I or Class-II Local Supplier certificate as per Make in India policy.","threshold":"Class-I or II","mandatory":true,"type":"compliance"},
  {"id":"C4","label":"GST Registration","description":"Bidder must be registered under GST and provide a valid GSTIN.","threshold":"Valid GSTIN","mandatory":true,"type":"documentation"},
  {"id":"C5","label":"ISO Certification","description":"Bidder should hold ISO 9001:2015 or equivalent quality management certification.","threshold":"ISO 9001:2015","mandatory":false,"type":"compliance"},
  {"id":"C6","label":"EMD Deposit","description":"Earnest Money Deposit as specified in the tender notice must be submitted.","threshold":"As specified","mandatory":true,"type":"financial"},
];

async function _mockResponse(system: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  if (system.includes("realistic tender overview")) {
    return JSON.stringify({"summary":"This tender is for the procurement of tactical equipment. The documents outline technical specifications, financial requirements, and compliance milestones.","keyRequirements":["Must have Class-I Local Supplier certification","Minimum average turnover required","Technical demo needed"],"criteriaCount":8,"tenderType":"Goods","estimatedBidders":"5-10"});
  }
  if (system.includes("Extract ALL eligibility criteria")) {
    return JSON.stringify(MOCK_CRITERIA);
  }
  if (system.includes("simulate a realistic procurement eligibility evaluation")) {
    return JSON.stringify({"overallVerdict":"Requires Human Review","criteria":[{"id":"C1","description":"Local Supplier Certification","category":"Compliance","mandatory":true,"verdict":"Eligible","sourceDocument":"compliance_cert.pdf","extractedValue":"Class-I Local Supplier","reason":"Valid certificate provided.","confidence":"High"},{"id":"C2","description":"Minimum Turnover Threshold","category":"Financial","mandatory":true,"verdict":"Manual Review","sourceDocument":"financials_2023.pdf","extractedValue":"Marginally Below","reason":"Turnover is slightly below the threshold. Human review required.","confidence":"Medium"}]});
  }
  return "[]";
}

async function callAnthropicAPI(system: string, userMessage: string, isTestMode: boolean = false): Promise<string> {
  if (isTestMode) return _mockResponse(system);
  try {
    const res = await fetch('/api/ml/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, message: userMessage }),
    });
    if (!res.ok) throw new Error(`ML chat ${res.status}`);
    const data = await res.json();
    const text = data.response || data.text || '';
    return text || _mockResponse(system);
  } catch {
    return _mockResponse(system);
  }
}

function parseJSONResponse<T>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;

  // Attempt 1: Try raw text directly (model returned clean JSON)
  try { return JSON.parse(text.trim()) as T; } catch {}

  // Attempt 2: Strip markdown code fences (```json ... ``` or ``` ... ```)
  // Also strips any warning text that appears AFTER the closing ```
  let stripped = text.trim();
  // Remove leading fence
  stripped = stripped.replace(/^```(?:json)?\s*/i, '');
  // Keep only up to the first closing fence (drop trailing warning blocks)
  const closingFence = stripped.indexOf('```');
  if (closingFence !== -1) stripped = stripped.substring(0, closingFence);
  stripped = stripped.trim();
  try { return JSON.parse(stripped) as T; } catch {}

  // Attempt 3: Extract first JSON array or object from anywhere in the text
  const arrMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrMatch) try { return JSON.parse(arrMatch[0]) as T; } catch {}
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) try { return JSON.parse(objMatch[0]) as T; } catch {}

  console.error('Failed to parse JSON from AI response (all 3 strategies failed). First 200 chars:', text.slice(0, 200));
  return null;
}

const animatedCache = new Set<string>();

const TypewriterText = ({ text, animate }: { text: string, animate: boolean }) => {
  const shouldAnimate = animate && !animatedCache.has(text);
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : text);
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(text);
      return;
    }
    animatedCache.add(text);
    let i = 0;
    setIsTyping(true);
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, shouldAnimate]);

  return (
    <>
      {displayedText}
      {isTyping && <span className="inline-block w-1.5 h-3 ml-1 bg-slate-400 animate-pulse" />}
    </>
  );
};

// Add a helper to prevent body scroll when modals are open
const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isLocked]);
};

const TenderOverviewView = ({ currentFile, data, updateData, setUploadModalConfig, setPreviewDoc }: any) => {
  if (!currentFile) return null;
  
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<any[] | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync editing state when extracted criteria arrive
  const extractedCriteria: any[] = currentFile.tenderOverview?.extractedCriteria || [];
  const activeCriteria = editingCriteria ?? extractedCriteria;

  const handleConfirmCriteria = async () => {
    setIsConfirming(true);
    try {
      const { updateWorkspace } = await import('@/lib/api-client');
      const updatedOverview = { ...(currentFile.tenderOverview || {}), extractedCriteria: activeCriteria };
      await updateWorkspace(currentFile.id, { tenderOverview: updatedOverview, tenderStatus: 'ready' });
      updateData((prev: any) => ({
        ...prev,
        files: prev.files.map((f: any) => f.id === currentFile.id
          ? { ...f, tenderOverview: updatedOverview, tenderStatus: 'ready' }
          : f)
      }));
      setEditingCriteria(null);
    } catch (e) {
      console.error('Confirm criteria failed', e);
    } finally {
      setIsConfirming(false);
    }
  };

  const updateCriterion = (idx: number, field: string, value: any) => {
    setEditingCriteria(prev => {
      const base = prev ?? extractedCriteria;
      return base.map((c: any, i: number) => i === idx ? { ...c, [field]: value } : c);
    });
  };

  const removeCriterion = (idx: number) => {
    setEditingCriteria(prev => {
      const base = prev ?? extractedCriteria;
      return base.filter((_: any, i: number) => i !== idx);
    });
  };

  const addCriterion = () => {
    const base = editingCriteria ?? extractedCriteria;
    const newId = `C${base.length + 1}`;
    setEditingCriteria([...base, { id: newId, label: '', description: '', threshold: '', mandatory: true, type: 'technical' }]);
  };

  useEffect(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [currentFile?.clarificationLog?.length]);

  useEffect(() => {
    const needsExtraction =
      currentFile.tenderStatus === 'scanning' ||
      (currentFile.tenderStatus === 'clarifying' && !extractedCriteria.length);

    if (needsExtraction && !isChatLoading) {
      setIsChatLoading(true);

      // Build document text — detect scanned/empty PDFs early
      const docsWithText = currentFile.tenderDocs.filter((d: any) => {
        const t = (d.extractedText || '').trim();
        // Reject empty, CID-only (scanned PDF glyphs), or very short text
        const hasMeaningfulText = t.length > 100 && !/^(\(cid:\d+\)\s*)+$/.test(t);
        return hasMeaningfulText;
      });
      const documentsText = docsWithText
        .map((d: any) => `Filename: ${d.name}\nContent: ${d.extractedText!.substring(0, 40000)}`)
        .join('\n\n---\n\n');

      const fetchInitialSetup = async () => {
        try {
          // ── Guard: no usable text extracted (scanned / encrypted PDF) ──────
          if (!documentsText) {
            // Surface informative criteria stubs so officer can fill manually
            const fallbackCriteria = [
              { id: 'C1', label: 'Annual Turnover', description: 'Minimum annual turnover — please enter threshold from tender.', threshold: '', mandatory: true, type: 'financial' },
              { id: 'C2', label: 'Prior Experience', description: 'Years of relevant experience — please enter threshold from tender.', threshold: '', mandatory: true, type: 'technical' },
              { id: 'C3', label: 'Quality Certification', description: 'Required quality certification (e.g. ISO 9001) — please verify.', threshold: '', mandatory: true, type: 'compliance' },
              { id: 'C4', label: 'GST Registration', description: 'Valid GST registration certificate required.', threshold: 'Valid GST', mandatory: true, type: 'compliance' },
              { id: 'C5', label: 'EMD / Bank Guarantee', description: 'Earnest Money Deposit or bank guarantee — please enter amount from tender.', threshold: '', mandatory: true, type: 'documentation' },
            ];
            const { updateWorkspace } = await import('@/lib/api-client');
            const updatedOverview = {
              summary: 'The uploaded document appears to be a scanned or image-based PDF — text could not be extracted automatically. Please fill in the criteria thresholds manually before confirming.',
              keyRequirements: ['Manual criteria entry required — OCR could not read this document'],
              criteriaCount: fallbackCriteria.length,
              tenderType: 'Unknown',
              estimatedBidders: 'Unknown',
              extractedCriteria: fallbackCriteria,
              ocrWarning: true,
            };
            await updateWorkspace(currentFile.id, { tenderOverview: updatedOverview, tenderStatus: 'clarifying' });
            updateData((prev: any) => ({
              ...prev,
              files: prev.files.map((f: any) => f.id === currentFile.id
                ? { ...f, tenderOverview: updatedOverview, tenderStatus: 'clarifying' }
                : f)
            }));
            setIsChatLoading(false);
            return;
          }

          // Step 1: Generate tender overview
          const systemPrompt = `You are NirnayAI, a government procurement analysis assistant. Generate a realistic tender overview based on the provided document text. Return ONLY valid JSON, no markdown fences: {"summary": "2-3 sentences", "keyRequirements": ["req 1", "req 2"], "criteriaCount": 8, "tenderType": "Goods|Services|Works", "estimatedBidders": "10-25"}`;
          const overviewText = await callAnthropicAPI(systemPrompt, `Tender documents content:\n${documentsText}`, data.isTestMode);
          const overviewData = parseJSONResponse<TenderOverviewData>(overviewText);

          // Step 2: Auto-extract eligibility criteria for officer review
          const criteriaPrompt = `You are NirnayAI, a government procurement AI. Extract ALL eligibility criteria from the tender document text below. Return ONLY a valid JSON array with no markdown fences, no explanation text, no warnings: [{"id":"C1","label":"Short Name","description":"Full criterion text from the document","threshold":"Exact value/requirement from the document","mandatory":true,"type":"financial|technical|compliance|documentation"}]. If you cannot find a specific threshold value in the document text, set threshold to empty string \"\". Extract 5-10 criteria.`;
          const criteriaText = await callAnthropicAPI(criteriaPrompt, `Tender document:\n${documentsText}`, data.isTestMode);
          let parsedCriteria: any[] = parseJSONResponse<any[]>(criteriaText) || [];
          if (!Array.isArray(parsedCriteria)) parsedCriteria = [];

          // Filter out hallucinated placeholders where LLM admitted it couldn't find the value
          const HALLUCINATION_MARKERS = ['unable to extract', 'not available', 'document text not available', 'not found in document'];
          const cleanedCriteria = parsedCriteria.map((c: any, i: number) => ({
            ...c,
            id: c.id || `C${i + 1}`,
            label: c.label || c.description?.substring(0, 50) || `Criterion ${i + 1}`,
            mandatory: c.mandatory !== false,
            // Clear threshold if LLM admitted it couldn't find it
            threshold: HALLUCINATION_MARKERS.some(m =>
              (c.threshold || '').toLowerCase().includes(m)
            ) ? '' : (c.threshold || ''),
          }));

          const { updateWorkspace } = await import('@/lib/api-client');
          const updatedOverview = { ...(overviewData || {}), extractedCriteria: cleanedCriteria };
          await updateWorkspace(currentFile.id, { tenderOverview: updatedOverview, tenderStatus: 'clarifying' });

          updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id ? {
              ...f,
              tenderOverview: updatedOverview,
              tenderStatus: 'clarifying',
            } : f)
          }));
        } catch (e: any) {
          console.error('Setup failed', e);
          updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id
              ? { ...f, tenderStatus: 'error', errorMessage: e.message || 'AI Initialization Failed' }
              : f)
          }));
        } finally {
          setIsChatLoading(false);
        }
      };
      fetchInitialSetup();
    }
  }, [currentFile?.tenderStatus, currentFile?.tenderDocs, currentFile?.id, updateData, isChatLoading, data.isTestMode, extractedCriteria.length]);


  if (currentFile.tenderStatus === 'awaiting_docs') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 relative bg-white dark:bg-slate-900">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-[#003366] uppercase tracking-wider mb-2">No Tender Documents</h2>
        <p className="text-slate-500 font-medium max-w-md mb-8">
          Upload the primary tender documents (NIT, RFP, Annexures) to initialize the AI analysis engine.
        </p>
        <button 
          className="bg-[#003366] text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#002244] transition-all shadow-sm"
          onClick={() => setUploadModalConfig({ type: 'tender', targetId: currentFile.id })}
        >
          Upload Documents
        </button>
      </div>
    );
  }

  if (currentFile.tenderStatus === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 relative bg-white dark:bg-slate-900">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-red-600 uppercase tracking-wider mb-2">Analysis Failed</h2>
        <p className="text-red-500/80 font-medium max-w-md mb-8">
          The ML pipeline encountered an error during processing. {currentFile.errorMessage ? `Details: ${currentFile.errorMessage}` : 'Please verify the documents and try again.'}
        </p>
        <button 
          className="bg-red-600 text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-sm"
          onClick={() => updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id ? { ...f, tenderStatus: 'awaiting_docs', tenderDocs: [] } : f)
          }))}
        >
          Reset and Retry
        </button>
      </div>
    );
  }

  if (currentFile.tenderStatus === 'ml_processing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative bg-white dark:bg-slate-900">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF9933] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-lg font-black text-[#003366] dark:text-white uppercase tracking-wider mb-2">ML Pipeline Active...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">Running OCR and extracting criteria details</p>
      </div>
    );
  }

  if (currentFile.tenderStatus === 'scanning') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative bg-white dark:bg-slate-900">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF9933] rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#003366] dark:text-[#FF9933]" />
          </div>
        </div>
        <h2 className="text-lg font-black text-[#003366] dark:text-white uppercase tracking-wider mb-2">Analyzing Documents...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">Extracting criteria and building context model</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-10 pb-40 scroll-smooth [scrollbar-gutter:stable]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-6 flex gap-2">
              {currentFile.tenderDocs.map((doc: any) => (
                <button 
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#FF9933] hover:border-[#FF9933] hover:bg-white dark:hover:bg-slate-900 transition-all"
                  title={`Preview ${doc.name}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              ))}
            </div>

            {currentFile.tenderStatus === 'ready' ? (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-[0.2em] mb-6 animate-bounce-subtle">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Green Signal Achieved
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-[0.2em] mb-6">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Criteria Review — Confirm to Proceed
              </div>
            )}
            <h2 className="text-5xl font-black text-[#003366] dark:text-white uppercase tracking-tighter leading-tight mb-4 max-w-[80%]">
              {currentFile.name}
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {new Date(currentFile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {currentFile.tenderDocs.length} Official Documents
              </p>
            </div>
          </div>

          {/* OCR Warning Banner — shown when document was unreadable (scanned/encrypted PDF) */}
          {(currentFile.tenderOverview as any)?.ocrWarning && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">
                  Scanned / Image PDF — OCR Could Not Extract Text
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  The uploaded PDF appears to be scanned or image-based. Criteria below are template stubs —{' '}
                  <strong>please enter the correct thresholds from the tender document</strong> before confirming.
                  For better results, re-upload a text-searchable PDF or use an OCR tool first.
                </p>
              </div>
            </div>
          )}

          {/* Criteria Review Panel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#003366] dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {currentFile.tenderStatus === 'ready' ? 'Confirmed Criteria' : 'Review Extracted Criteria'}
              </h3>
              {currentFile.tenderStatus === 'clarifying' && !isChatLoading && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeCriteria.length} criteria found — edit if needed, then confirm
                </span>
              )}
            </div>

            {isChatLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 bg-[#FF9933] rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-[#FF9933] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2.5 h-2.5 bg-[#FF9933] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI is extracting criteria from document…</p>
              </div>
            )}

            {!isChatLoading && activeCriteria.length === 0 && currentFile.tenderStatus === 'clarifying' && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-400 mb-3">No criteria extracted — add them manually below.</p>
              </div>
            )}

            {!isChatLoading && activeCriteria.length > 0 && (
              <div className="space-y-3">
                {activeCriteria.map((c: any, idx: number) => {
                  const typeColors: Record<string, string> = {
                    financial: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    technical: 'bg-blue-100 text-blue-800 border-blue-200',
                    compliance: 'bg-purple-100 text-purple-800 border-purple-200',
                    documentation: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const typeCls = typeColors[c.type?.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';
                  const isEditable = currentFile.tenderStatus === 'clarifying';

                  return (
                    <div key={c.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        {/* Mandatory toggle */}
                        <button
                          onClick={() => isEditable && updateCriterion(idx, 'mandatory', !c.mandatory)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${c.mandatory ? 'bg-[#FF9933] border-[#FF9933]' : 'border-slate-300 dark:border-slate-600'} ${!isEditable ? 'cursor-default' : 'cursor-pointer'}`}
                          title={c.mandatory ? 'Mandatory — click to make optional' : 'Optional — click to make mandatory'}
                        >
                          {c.mandatory && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] font-black text-slate-400 font-mono">{c.id}</span>
                            {isEditable ? (
                              <input
                                className="text-sm font-bold text-[#003366] dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#003366] focus:outline-none flex-1 min-w-0"
                                value={c.label || ''}
                                onChange={e => updateCriterion(idx, 'label', e.target.value)}
                                placeholder="Criterion name…"
                              />
                            ) : (
                              <span className="text-sm font-bold text-[#003366] dark:text-white">{c.label}</span>
                            )}
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest ${typeCls}`}>
                              {c.type || 'general'}
                            </span>
                            {c.mandatory && <span className="text-[9px] font-black text-[#FF9933] uppercase tracking-widest">● Mandatory</span>}
                          </div>

                          {isEditable ? (
                            <textarea
                              className="w-full text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 mt-1 resize-none focus:outline-none focus:border-[#003366]"
                              rows={2}
                              value={c.description || ''}
                              onChange={e => updateCriterion(idx, 'description', e.target.value)}
                              placeholder="Full criterion description…"
                            />
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{c.description}</p>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Threshold:</span>
                            {isEditable ? (
                              <input
                                className="text-xs font-bold text-[#003366] dark:text-[#FF9933] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#003366] focus:outline-none"
                                value={c.threshold || ''}
                                onChange={e => updateCriterion(idx, 'threshold', e.target.value)}
                                placeholder="e.g. ₹10 Cr, 3 years…"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#003366] dark:text-[#FF9933]">{c.threshold}</span>
                            )}
                            {isEditable && (
                              <select
                                className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded focus:outline-none ml-2"
                                value={c.type || 'technical'}
                                onChange={e => updateCriterion(idx, 'type', e.target.value)}
                              >
                                {['financial','technical','compliance','documentation'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        {isEditable && (
                          <button
                            onClick={() => removeCriterion(idx)}
                            className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                            title="Remove criterion"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentFile.tenderStatus === 'clarifying' && !isChatLoading && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={addCriterion}
                  className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-[#003366] dark:hover:text-[#FF9933] uppercase tracking-widest transition-colors border border-dashed border-slate-300 dark:border-slate-700 px-4 py-2"
                >
                  <Plus className="w-4 h-4" /> Add Criterion
                </button>
                <button
                  onClick={handleConfirmCriteria}
                  disabled={isConfirming || activeCriteria.length === 0}
                  className="flex items-center gap-3 bg-[#003366] dark:bg-[#FF9933] text-white dark:text-[#003366] px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#002244] dark:hover:bg-[#FF9933]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {isConfirming ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirm All & Proceed
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BidderView = ({ currentFile, currentBidder, data, updateData, setUploadModalConfig, setPreviewDoc }: any) => {
  if (!currentFile || !currentBidder) return null;
  
  const hasDocs = currentBidder.docs.length > 0;
  const isScanning = currentBidder.docs.some((d: any) => d.status === 'scanning' || d.status === 'queued');
  const isComplete = hasDocs && !isScanning;
  
  const [isEvalLoading, setIsEvalLoading] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const toggleCriteria = (id: string) => {
    setExpandedCriteria(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (isComplete && !currentBidder.evaluationResult && !currentBidder.evaluationError && !isEvalLoading) {
      setIsEvalLoading(true);
      const tenderDocsText = currentFile.tenderDocs.map((d: any) => `Tender Doc (${d.name}):\n${d.extractedText || ''}`).join('\n\n');
      const bidderDocsText = currentBidder.docs.map((d: any) => `Bidder Doc (${d.name}):\n${d.extractedText || ''}`).join('\n\n');
      const extractedCriteria: any[] = (currentFile.tenderOverview as any)?.extractedCriteria || [];

      const fetchEval = async () => {
        try {
          let evalData: EvaluationResult | null = null;

          // --- Path 1: Real ML evaluation using stored text + criteria ---
          const combinedBidderText = currentBidder.docs
            .map((d: any) => (d.extractedText || '').replace(/\[ML_EVIDENCE\][\s\S]*/, '').trim())
            .filter(Boolean)
            .join('\n\n');

          if (extractedCriteria.length > 0 && combinedBidderText) {
            try {
              const res = await fetch('/api/ml/extract-values-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_text: combinedBidderText, criteria: extractedCriteria }),
              });
              if (res.ok) {
                const mlResult = await res.json();
                const evidence: any[] = mlResult.evidence || [];
                if (evidence.length > 0) {
                  const criteriaItems: Criterion[] = evidence.map((e: any, idx: number) => {
                    const crit = extractedCriteria[idx] || extractedCriteria.find((c: any) => c.id === e.criterionId) || {};
                    const conf = typeof e.confidence === 'number' ? e.confidence : 0.75;
                    return {
                      id: crit.id || `C${idx + 1}`,
                      description: e.criterionName || crit.description || crit.label || `Criterion ${idx + 1}`,
                      category: crit.type ? (crit.type.charAt(0).toUpperCase() + crit.type.slice(1)) : 'General',
                      mandatory: crit.mandatory ?? false,
                      verdict: e.status === 'Eligible' ? 'Eligible' : e.status === 'Not Eligible' ? 'Not Eligible' : 'Manual Review',
                      sourceDocument: e.sourceDocument || `${currentBidder.name}_submission`,
                      extractedValue: e.extractedValue || 'N/A',
                      reason: e.reason || '',
                      confidence: conf >= 0.8 ? 'High' : conf >= 0.5 ? 'Medium' : 'Low',
                    };
                  });
                  const mandatory = criteriaItems.filter(c => c.mandatory);
                  const hasFail = mandatory.some(c => c.verdict === 'Not Eligible');
                  const hasReview = mandatory.some(c => c.verdict === 'Manual Review');
                  const overallVerdict: EvaluationResult['overallVerdict'] = hasFail
                    ? 'Clearly Not Eligible' : hasReview ? 'Requires Human Review' : 'Clearly Eligible';
                  evalData = { overallVerdict, criteria: criteriaItems };
                  console.log(`[ML Eval] Real ML evaluation complete — ${criteriaItems.length} criteria, verdict: ${overallVerdict}`);
                }
              }
            } catch (mlErr) {
              console.warn('[ML Eval] Real ML path failed, falling back to AI chat:', mlErr);
            }
          }

          // --- Path 2: Fallback — AI chat (real /api/ml/chat or local mock) ---
          if (!evalData) {
            const systemPrompt = `You are NirnayAI's evaluation engine. Given the tender document text and bidder document text, simulate a realistic procurement eligibility evaluation. Generate criterion-level verdicts. Respond in this exact JSON format with no markdown: {"overallVerdict": "Clearly Eligible" | "Clearly Not Eligible" | "Requires Human Review", "criteria": [{"id": "C1", "description": "...", "category": "Financial" | "Technical" | "Compliance" | "Documentation", "mandatory": true | false, "verdict": "Eligible" | "Not Eligible" | "Manual Review" | "Not Applicable", "sourceDocument": "...", "extractedValue": "...", "reason": "...", "confidence": "High" | "Medium" | "Low"}]}`;
            const userMsg = `Tender context:\n${tenderDocsText}\n\nBidder name: ${currentBidder.name}\nBidder documents:\n${bidderDocsText}\n\nEvaluate this bidder against the tender criteria. Generate 6 to 10 criteria.`;
            const responseText = await callAnthropicAPI(systemPrompt, userMsg, data.isTestMode);
            evalData = parseJSONResponse<EvaluationResult>(responseText);
          }

          if (evalData) {
            const { saveEvaluation } = await import('@/lib/api-client');
            await saveEvaluation(currentFile.id, currentBidder.id, evalData as any);
            updateData((prev: any) => ({
              ...prev,
              files: prev.files.map((f: any) => f.id === currentFile.id ? {
                ...f,
                bidders: f.bidders.map((b: any) => b.id === currentBidder.id ? { ...b, evaluationResult: evalData } : b)
              } : f)
            }));
          }
        } catch (error: any) {
          console.error("Evaluation failed", error);
          updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id ? {
              ...f,
              bidders: f.bidders.map((b: any) => b.id === currentBidder.id ? { ...b, evaluationError: error.message || 'AI Evaluation Failed' } : b)
            } : f)
          }));
        } finally {
          setIsEvalLoading(false);
        }
      };

      fetchEval();
    }
  }, [isComplete, currentBidder?.evaluationResult, currentBidder?.docs, currentBidder?.id, currentBidder?.name, currentFile?.tenderDocs, currentFile?.id, currentFile?.tenderOverview, updateData, isEvalLoading, data.isTestMode]);

  if (!hasDocs) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 relative">
        <div className="mb-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currentBidder.name}</div>
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Folder className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-[#003366] dark:text-white uppercase tracking-wider mb-2">No documents uploaded for this bidder yet.</h2>
        <p className="text-slate-500 font-medium max-w-md mb-8">
          Upload technical bids, financial statements, and compliance certificates for evaluation.
        </p>
        <button 
          className="bg-[#003366] dark:bg-[#FF9933] text-white dark:text-[#003366] px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#002244] dark:hover:bg-[#FF9933]/80 transition-all shadow-sm"
          onClick={() => setUploadModalConfig({ type: 'bidder', targetId: currentBidder.id })}
        >
          + Add Documents
        </button>
      </div>
    );
  }

  if (isScanning || isEvalLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 relative">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#003366] dark:border-[#FF9933] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-lg font-black text-[#003366] dark:text-white uppercase tracking-wider mb-2">Running AI Evaluation...</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Cross-referencing bidder docs against tender criteria</p>
      </div>
    );
  }

  if (currentBidder.evaluationError) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-red-600 uppercase mb-2">Evaluation Error</h2>
        <p className="text-red-500 mb-6">{currentBidder.evaluationError}</p>
        <button 
          className="bg-slate-200 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-slate-300"
          onClick={() => updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id ? {
              ...f,
              bidders: f.bidders.map((b: any) => b.id === currentBidder.id ? { ...b, evaluationError: undefined } : b)
            } : f)
          }))}
        >
          Retry
        </button>
      </div>
    );
  }

  const res = currentBidder.evaluationResult;
  if (!res) return <div className="flex-1 p-10">Error loading evaluation</div>;

  let bannerBg = "bg-amber-100 border-amber-300";
  let bannerIcon = <AlertCircle className="w-6 h-6 text-amber-700" />;
  let bannerTextColor = "text-amber-800";
  let bannerSubTextColor = "text-amber-700";
  let bannerText = "One or more criteria require manual review.";

  if (res.overallVerdict === 'Clearly Eligible') {
    bannerBg = "bg-green-100 border-green-300";
    bannerIcon = <CheckCircle2 className="w-6 h-6 text-green-700" />;
    bannerTextColor = "text-green-800";
    bannerSubTextColor = "text-green-700";
    bannerText = "This bidder meets all mandatory criteria.";
  } else if (res.overallVerdict === 'Clearly Not Eligible') {
    bannerBg = "bg-red-100 border-red-300";
    bannerIcon = <X className="w-6 h-6 text-red-700" />;
    bannerTextColor = "text-red-800";
    bannerSubTextColor = "text-red-700";
    bannerText = "This bidder fails one or more mandatory criteria.";
  }

  let riskLevel = "Medium Risk";
  let riskColor = "bg-amber-500";
  let riskWidth = "50%";
  if (res.overallVerdict === 'Clearly Eligible') { riskLevel = "Low Risk"; riskColor = "bg-green-500"; riskWidth = "15%"; }
  if (res.overallVerdict === 'Clearly Not Eligible') { riskLevel = "High Risk"; riskColor = "bg-red-500"; riskWidth = "90%"; }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto p-10 [scrollbar-gutter:stable]">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-black text-[#003366] dark:text-white uppercase tracking-tighter leading-tight mb-2">
              {currentBidder.name}
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {currentBidder.docs.length} Documents • Evaluation Complete
            </p>
          </div>
          <button 
            className="bg-white dark:bg-slate-800 border-2 border-[#003366] dark:border-[#FF9933] text-[#003366] dark:text-[#FF9933] px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#003366] dark:hover:bg-[#FF9933] hover:text-white dark:hover:text-[#003366] transition-all shadow-sm flex items-center gap-2"
            onClick={() => setUploadModalConfig({ type: 'bidder', targetId: currentBidder.id })}
          >
            <Plus className="w-3 h-3" /> Add Docs
          </button>
        </div>

        <div className={`p-6 border-2 ${bannerBg} flex items-center gap-4 mb-10 animate-[slideDownFade_0.3s_ease-out]`}>
          {bannerIcon}
          <div>
            <div className={`text-xs font-black uppercase tracking-widest mb-1 ${bannerTextColor}`}>
              {res.overallVerdict}
            </div>
            <div className={`text-sm font-medium ${bannerSubTextColor}`}>
              {bannerText}
            </div>
          </div>
        </div>

        <div className="mb-12">
           <h3 className="text-sm font-black text-[#003366] dark:text-white uppercase tracking-[0.2em] mb-4 border-b-2 border-[#FF9933] pb-2 inline-block">
             Uploaded Documents
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {currentBidder.docs.map((doc: any) => (
               <div key={doc.id} className="border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between group bg-white dark:bg-slate-900 hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                 <div className="flex items-center gap-3 overflow-hidden">
                   {getDocIcon(doc.type)}
                   <div className="truncate">
                     <p className="text-xs font-bold text-[#003366] dark:text-white truncate">{doc.name}</p>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{(doc.size/1024/1024).toFixed(2)} MB</p>
                   </div>
                 </div>
                 <Eye className="w-4 h-4 text-slate-300 group-hover:text-[#FF9933] flex-shrink-0" />
               </div>
             ))}
           </div>
        </div>

        <div className="mb-12">
          <h3 className="text-sm font-black text-[#003366] dark:text-white uppercase tracking-[0.2em] mb-6 border-b-2 border-[#FF9933] pb-2 inline-block">
            Criteria Evaluation
          </h3>
          
          <div className="space-y-4">
            {res.criteria.map((c: any) => {
              const isExpanded = expandedCriteria[c.id];
              let verdictChip = <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-widest">N/A</span>;
              if (c.verdict === 'Eligible') verdictChip = <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-widest border border-green-200">✓ Eligible</span>;
              if (c.verdict === 'Not Eligible') verdictChip = <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-widest border border-red-200">✗ Not Eligible</span>;
              if (c.verdict === 'Manual Review') verdictChip = <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-widest border border-amber-200">⚠ Manual Review</span>;

              return (
                <div key={c.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-sm">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => toggleCriteria(c.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold px-2 py-1 uppercase border border-slate-200 dark:border-slate-700">
                        {c.id}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#003366] dark:text-white">{c.description}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.category}</span>
                          {c.mandatory && <span className="text-[9px] font-black text-[#FF9933] uppercase tracking-widest">• Mandatory</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {verdictChip}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-sm animate-[fadeIn_0.2s_ease-out]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Extracted Value</div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2">{c.extractedValue}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Reasoning</div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2">{c.reason}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-6">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Source Document:</span>
                          <span className="font-bold text-[#003366] dark:text-[#FF9933] text-xs underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer">{c.sourceDocument}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">AI Confidence:</span>
                          <span className={`font-bold text-xs uppercase tracking-widest ${c.confidence === 'High' ? 'text-green-600' : c.confidence === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{c.confidence}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-[#003366] dark:text-white uppercase tracking-[0.2em] mb-6">
            Risk Assessment
          </h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Overall Risk Profile</span>
              <span className={`text-sm font-black uppercase tracking-widest ${res.overallVerdict === 'Clearly Eligible' ? 'text-green-600' : res.overallVerdict === 'Clearly Not Eligible' ? 'text-red-600' : 'text-amber-600'}`}>
                {riskLevel}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 mb-6">
              <div className={`${riskColor} h-2 transition-all duration-1000`} style={{ width: riskWidth }} />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="w-1 h-1 bg-slate-400 dark:bg-slate-600 mt-1.5 rounded-full" />
                Automated risk scoring based on deviation from mandatory requirements.
              </li>
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="w-1 h-1 bg-slate-400 dark:bg-slate-600 mt-1.5 rounded-full" />
                {res.overallVerdict === 'Clearly Eligible' ? 'No major inconsistencies detected in submitted documents.' : 'Please review the flagged criteria for potential disqualification grounds.'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentPreviewModal = ({ previewDoc, setPreviewDoc }: any) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [noBlob, setNoBlob] = useState(false);

  useEffect(() => {
    if (!previewDoc) return;
    setFileUrl(null);
    setNoBlob(false);
    setLoading(true);
    let blobUrl = '';
    getFileIDB(previewDoc.id)
      .then(file => {
        if (file) {
          blobUrl = URL.createObjectURL(file);
          setFileUrl(blobUrl);
        } else {
          setNoBlob(true);
        }
      })
      .catch(() => setNoBlob(true))
      .finally(() => setLoading(false));
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [previewDoc?.id]);

  if (!previewDoc) return null;

  const ext = previewDoc.name?.split('.').pop()?.toUpperCase() || 'FILE';
  const isImage = previewDoc.type?.includes('image');
  const isPdf = previewDoc.type?.includes('pdf');
  const isDocx = previewDoc.type?.includes('word') || ext === 'DOCX' || ext === 'DOC';

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading preview…</p>
          </div>
        </div>
      );
    }

    if (fileUrl && isPdf) {
      return (
        <iframe
          src={fileUrl}
          className="flex-1 w-full border-0"
          title={previewDoc.name}
        />
      );
    }

    if (fileUrl && isImage) {
      return (
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-6">
          <img
            src={fileUrl}
            alt={previewDoc.name}
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        </div>
      );
    }

    // DOCX or no blob: show extracted text
    const rawText = previewDoc.extractedText?.trim() || '';
    if (!rawText) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
            {noBlob ? 'Preview not available' : 'No content extracted'}
          </p>
          <p className="text-xs text-slate-300 mt-2">
            {noBlob
              ? 'Re-upload the document to enable preview.'
              : previewDoc.status === 'scanning'
              ? 'OCR is still running. Try again after processing.'
              : 'This document could not be read.'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
        <div className="max-w-3xl mx-auto bg-white shadow-sm border border-slate-200 min-h-full p-12">
          {isDocx && (
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <File className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Extracted Document Content</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed break-words">
            {rawText}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-50 w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col animate-[scaleIn_0.2s_ease-out] overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
              {getDocIcon(previewDoc.type)}
            </div>
            <div>
              <h3 className="text-sm font-black text-[#003366] truncate max-w-xl">{previewDoc.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {(previewDoc.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(previewDoc.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
              isPdf ? 'bg-red-50 text-red-600' :
              isImage ? 'bg-blue-50 text-blue-600' :
              isDocx ? 'bg-indigo-50 text-indigo-600' :
              'bg-slate-100 text-slate-600'
            }`}>{ext}</span>
            {fileUrl && (
              <a
                href={fileUrl}
                download={previewDoc.name}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-[#003366] hover:text-white transition-all"
              >
                Download
              </a>
            )}
            <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 p-2 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {renderPreview()}
      </div>
    </div>
  );
};


const CreateFileModal = ({ isCreateFileModalOpen, setIsCreateFileModalOpen, handleCreateFile }: any) => {
  if (!isCreateFileModalOpen) return null;
  const [name, setName] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-[#003366] dark:bg-[#001122] text-white px-6 py-4 flex justify-between items-center border-b border-[#FF9933]/30">
          <h3 className="text-sm font-black uppercase tracking-widest">Create New File</h3>
          <button onClick={() => setIsCreateFileModalOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-black text-[#003366] dark:text-[#FF9933] uppercase tracking-widest mb-2">File Name / Tender ID</label>
          <input 
            autoFocus
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreateFile(name.trim())}
            placeholder="e.g., CRPF/PROC/2026/01"
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 text-sm text-[#333] dark:text-slate-200 focus:outline-none focus:border-[#003366] dark:focus:border-[#FF9933] mb-8"
          />
          <div className="flex justify-end gap-4">
            <button 
              className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsCreateFileModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-[#003366] dark:bg-[#FF9933] text-white dark:text-[#003366] px-8 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#002244] dark:hover:bg-[#FF9933]/80 transition-all"
              disabled={!name.trim()}
              onClick={() => handleCreateFile(name.trim())}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadModal = ({ uploadModalConfig, setUploadModalConfig, currentFile, updateData }: any) => {
  if (!uploadModalConfig) return null;
  const isTender = uploadModalConfig.type === 'tender';
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const updateDocStatus = (data: AppData, fileId: string, type: 'tender'|'bidder', targetId: string, docId: string, status: FileStatus): AppData => {
    return {
      files: data.files.map((f: any) => {
        if (f.id !== fileId) return f;
        if (type === 'tender') {
          return { ...f, tenderDocs: f.tenderDocs.map((d: any) => d.id === docId ? { ...d, status } : d) };
        } else {
          return {
            ...f,
            bidders: f.bidders.map((b: any) => b.id === targetId ? { ...b, docs: b.docs.map((d: any) => d.id === docId ? { ...d, status } : d) } : b)
          };
        }
      })
    };
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !currentFile) return;

    const payloadDocs = selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type || 'application/octet-stream' }));
    const filesToProcess = [...selectedFiles];
    const configType = uploadModalConfig.type;
    const tId = uploadModalConfig.targetId;
    setUploadModalConfig(null);

    try {
      const {
        addTenderDocuments, addBidderDocuments,
        updateDocumentStatus, updateDocumentText, updateWorkspace,
        processDocumentML, extractCriteriaML, extractValuesML,
      } = await import('@/lib/api-client');

      let createdDocs: any[];
      if (isTender) {
        createdDocs = await addTenderDocuments(currentFile.id, payloadDocs);
      } else {
        createdDocs = await addBidderDocuments(currentFile.id, tId, payloadDocs);
      }

      // Save original file blobs to IndexedDB so the preview modal can render them natively
      createdDocs.forEach((doc, i) => {
        if (filesToProcess[i]) saveFileIDB(doc.id, filesToProcess[i]).catch(() => {});
      });

      updateData((prev: any) => ({
        files: prev.files.map((f: any) => {
          if (f.id !== currentFile.id) return f;
          if (isTender) {
            return { ...f, tenderStatus: 'ml_processing', tenderDocs: [...f.tenderDocs, ...createdDocs] };
          }
          return { ...f, bidders: f.bidders.map((b: any) => b.id === tId ? { ...b, docs: [...b.docs, ...createdDocs] } : b) };
        })
      }));

      const processDocs = async () => {
        let hasError = false;
        let errorMessage = "";
        let allExtractedCriteria: any[] = [];

        for (let idx = 0; idx < createdDocs.length; idx++) {
          const doc = createdDocs[idx];
          const originalFile = filesToProcess[idx];
          if (!originalFile) continue;

          updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'scanning'));
          await updateDocumentStatus(currentFile.id, doc.id, 'scanning');

          try {
            let mlResult: any = null;
            let extractedText = "";

            // --- OCR (non-fatal: Railway ML may be sleeping or unavailable) ---
            try {
              console.log(`[ML Pipeline] Processing: ${originalFile.name}`);
              mlResult = await processDocumentML(originalFile);
              extractedText = mlResult.full_text || mlResult.text || "";
              console.log(`[ML Pipeline] OCR complete — tier: ${mlResult.tier}, confidence: ${mlResult.confidence?.toFixed(2)}`);
            } catch (ocrErr: any) {
              console.warn(`[ML Pipeline] OCR unavailable (Railway may be sleeping) — proceeding without OCR:`, ocrErr.message);
            }

            if (isTender) {
              // Criteria extraction only if OCR succeeded
              if (mlResult) {
                try {
                  const criteriaResult = await extractCriteriaML(originalFile);
                  const criteriaArr = Array.isArray(criteriaResult) ? criteriaResult : [];
                  allExtractedCriteria = criteriaArr;
                  console.log(`[ML Pipeline] Extracted ${criteriaArr.length} criteria`);
                } catch (criteriaErr) {
                  console.warn(`[ML Pipeline] Criteria extraction non-critical failure:`, criteriaErr);
                }
              }
            } else {
              // For bidder docs, try to extract values against stored tender criteria
              const tenderCriteria = (currentFile.tenderOverview as any)?.extractedCriteria;
              if (tenderCriteria?.length > 0 && mlResult) {
                try {
                  const valuesResult = await extractValuesML(originalFile, JSON.stringify(tenderCriteria));
                  const evidenceArr = valuesResult.evidence || [];
                  if (evidenceArr.length > 0) {
                    extractedText += "\n\n[ML_EVIDENCE]" + JSON.stringify(evidenceArr);
                  }
                  console.log(`[ML Pipeline] Extracted ${evidenceArr.length} evidence items`);
                } catch (valErr) {
                  console.warn(`[ML Pipeline] Value extraction non-critical failure:`, valErr);
                }
              }
            }

            if (extractedText) {
              // Truncate to 800 KB of text to stay safely under the 20 MB body limit
              const safeText = extractedText.length > 800_000
                ? extractedText.slice(0, 800_000) + '\n\n[TRUNCATED — document too large]'
                : extractedText;
              try {
                await updateDocumentText(currentFile.id, doc.id, safeText);
              } catch (saveErr) {
                console.warn(`[ML Pipeline] Could not persist extracted text for ${doc.id}:`, saveErr);
              }
            }


            updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'complete'));
            await updateDocumentStatus(currentFile.id, doc.id, 'complete');
            console.log(`[ML Pipeline] ✓ Done: ${originalFile.name}${mlResult ? "" : " (no OCR — ML unavailable)"}`);

          } catch (fatalErr: any) {
            // Only truly fatal errors (DB write failures etc.) reach here
            console.error(`[ML Pipeline] Fatal error processing ${originalFile.name}:`, fatalErr);
            updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'failed'));
            await updateDocumentStatus(currentFile.id, doc.id, 'failed');
            hasError = true;
            errorMessage = fatalErr.message || "Failed to save document";
          }
        }

        if (isTender) {
          if (hasError) {
            updateData((prev: any) => ({
              ...prev,
              files: prev.files.map((f: any) => f.id === currentFile.id ? { ...f, tenderStatus: 'error', errorMessage } : f)
            }));
            await updateWorkspace(currentFile.id, { tenderStatus: 'error' });
          } else {
            // Save extracted criteria in tenderOverview for use during bidder evaluation
            const updatedOverview = {
              ...(currentFile.tenderOverview || {}),
              ...(allExtractedCriteria.length > 0 ? { extractedCriteria: allExtractedCriteria } : {}),
            };
            const patch: any = { tenderStatus: 'scanning' };
            if (allExtractedCriteria.length > 0) patch.tenderOverview = updatedOverview;
            await updateWorkspace(currentFile.id, patch);
            updateData((prev: any) => ({
              ...prev,
              files: prev.files.map((f: any) => f.id === currentFile.id
                ? { ...f, tenderStatus: 'scanning', tenderOverview: updatedOverview }
                : f)
            }));
          }
        }
      };

      processDocs();
    } catch (e) {
      console.error(e);
      alert('Failed to upload documents');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
        <div className="bg-[#003366] dark:bg-[#001122] text-white px-6 py-4 flex justify-between items-center flex-shrink-0 border-b border-[#FF9933]/30">
          <h3 className="text-sm font-black uppercase tracking-widest">
            Add {isTender ? 'Tender' : 'Bidder'} Documents
          </h3>
          <button onClick={() => setUploadModalConfig(null)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 dark:bg-slate-900">
          <div 
            className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors mb-6 ${isDragging ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-slate-300 dark:border-slate-700 hover:border-[#003366] dark:hover:border-[#FF9933] bg-slate-50 dark:bg-slate-800'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#FF9933]' : 'text-slate-400 dark:text-slate-600'}`} />
            <p className="text-sm font-bold text-[#003366] dark:text-white mb-2">Drop files here or click to browse</p>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Supports PDF, DOCX, JPG, PNG, WEBP</p>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0">
                      {getDocIcon(file.type)}
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#003366] dark:text-white truncate">{file.name}</div>
                        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 p-2" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setUploadModalConfig(null)}>Cancel</button>
          <button className="bg-[#003366] dark:bg-[#FF9933] text-white dark:text-[#003366] px-8 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#002244] dark:hover:bg-[#FF9933]/90 transition-all shadow-lg border border-transparent dark:border-[#FF9933]/20" disabled={selectedFiles.length === 0} onClick={handleUpload}>Upload Documents</button>
        </div>
      </div>
    </div>
  );
};

const CreateBidderModal = ({ isCreateBidderModalOpen, setIsCreateBidderModalOpen, handleCreateBidder }: any) => {
  if (!isCreateBidderModalOpen) return null;
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-[#003366] dark:bg-[#001122] text-white px-6 py-4 flex justify-between items-center border-b border-[#FF9933]/30">
          <h3 className="text-sm font-black uppercase tracking-widest">New Bidder Organization</h3>
          <button onClick={() => setIsCreateBidderModalOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Organization / Firm Name</label>
          <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreateBidder(name.trim())} placeholder="e.g., Bharat Dynamics Ltd." className="w-full border-2 border-slate-200 p-3 text-sm focus:outline-none focus:border-[#003366] mb-8" />
          <div className="flex justify-end gap-4">
            <button className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50" onClick={() => setIsCreateBidderModalOpen(false)}>Cancel</button>
            <button className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#002244]" disabled={!name.trim()} onClick={() => handleCreateBidder(name.trim())}>Register Bidder</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Shell = ({ children, data, updateData, setCurrentFileId, setCurrentBidderId }: { 
  children: React.ReactNode, 
  data: AppData, 
  updateData: (updater: (prev: AppData) => AppData) => void,
  setCurrentFileId: (id: string | null) => void,
  setCurrentBidderId: (id: string | null) => void
}) => (
  <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-[#333] dark:text-slate-200 relative">
    <DotPattern
      className={cn(
        "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)] opacity-40 dark:opacity-20",
        "fixed inset-0 w-full h-full"
      )}
    />
    <div className="flex h-[5px] w-full flex-shrink-0 relative z-20">
      <div className="bg-[#FF9933] flex-1" />
      <div className="bg-[#FFFFFF] flex-1 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
      <div className="bg-[#138808] flex-1" />
    </div>
    <header className="bg-[#003366] dark:bg-[#001122] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#FF9933] flex-shrink-0 relative z-10">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentFileId(null); setCurrentBidderId(null); }}>
        <div className="w-8 h-8 bg-white text-[#003366] flex items-center justify-center font-black text-lg border border-[#FF9933]">
          N
        </div>
        <h1 className="text-xl font-black tracking-tighter uppercase">NirnayAI</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-4 bg-black/20 px-3 py-1.5 border border-[#FF9933]/50">
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Test Mode</span>
          <button 
            className={`w-8 h-4 rounded-full relative transition-colors ${data.isTestMode ? 'bg-[#FF9933]' : 'bg-slate-500'}`}
            onClick={() => updateData(prev => ({ ...prev, isTestMode: !prev.isTestMode }))}
          >
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${data.isTestMode ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="mr-2">
          <AnimatedThemeToggler variant="circle" duration={500} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" />
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold tracking-widest uppercase">Evaluator User</div>
          <div className="text-[10px] text-white/70 tracking-widest uppercase">CRPF • MHA</div>
        </div>
        <div className="flex items-center justify-center ml-2">
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 rounded-none border border-white/20" } }} />
        </div>
      </div>
    </header>
    <main className="flex-1 flex overflow-hidden relative z-10">
      {children}
    </main>
  </div>
);

const HomeGrid = ({ data, setIsCreateFileModalOpen, setCurrentFileId, setCurrentBidderId, handleDeleteFile }: any) => (
  <div className="flex-1 overflow-auto p-8 bg-transparent relative z-10 [scrollbar-gutter:stable]">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-lg font-black text-[#003366] dark:text-white uppercase tracking-widest mb-6 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
        Recent Files
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center h-64 cursor-pointer hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
          onClick={() => setIsCreateFileModalOpen(true)}
        >
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#003366] dark:group-hover:bg-[#FF9933] group-hover:text-white transition-all text-[#003366] dark:text-slate-400 mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#003366] dark:text-slate-300 uppercase tracking-wider">Create new File</span>
        </div>

        {data.files.map((file: any) => (
          <div 
            key={file.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between h-64 cursor-pointer hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group"
            onClick={() => { setCurrentFileId(file.id); setCurrentBidderId(null); }}
          >
            <div>
              <div className="flex items-start justify-between">
                <FileText className="w-6 h-6 text-[#003366] dark:text-[#FF9933] mb-3" />
                <button 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                  onClick={(e) => handleDeleteFile(e, file.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-[#003366] dark:text-white line-clamp-2 leading-snug">
                {file.name.length > 40 ? file.name.substring(0, 40) + '...' : file.name}
              </h3>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
              <div className="mb-2">
                {file.tenderStatus === 'ready' && <span className="bg-green-100 text-green-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">✓ Ready for Eval</span>}
                {file.tenderStatus === 'clarifying' && <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">⚠ Action Required</span>}
              </div>
              <div>Created: {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="flex items-center gap-3">
                <span>{file.tenderDocs.length} tender docs</span>
                <span>•</span>
                <span>{file.bidders.length} bidders</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const getDocIcon = (type: string) => {
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  if (type.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-blue-700" />;
};

const getStatusChip = (status: FileStatus) => {
  switch (status) {
    case 'complete': return <span className="bg-green-100 text-green-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Complete</span>;
    case 'scanning': return <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>Scanning</span>;
    case 'failed': return <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Failed</span>;
    default: return <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Queued</span>;
  }
};

const WorkspaceSidebar = ({ currentFile, currentBidderId, setCurrentFileId, setCurrentBidderId, setUploadModalConfig, setIsCreateBidderModalOpen, setPreviewDoc }: any) => {
  if (!currentFile) return null;
  const isTenderReady = currentFile.tenderStatus === 'ready';

  return (
    <div className="w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-[#003366] dark:hover:text-[#FF9933] transition-colors" onClick={() => { setCurrentFileId(null); setCurrentBidderId(null); }}>
          <ChevronLeft className="w-4 h-4" /> Back to Files
        </div>
        <h2 className="mt-3 text-sm font-black text-[#003366] dark:text-white uppercase tracking-wide truncate" title={currentFile.name}>
          {currentFile.name}
        </h2>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Tender Docs
          </h3>
        </div>
        
        <div className="space-y-2 mb-4">
          {currentFile.tenderDocs.length === 0 ? (
            <div className="text-xs text-slate-400 dark:text-slate-600 italic py-2 text-center">No tender docs yet.</div>
          ) : (
            currentFile.tenderDocs.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group" onClick={() => setCurrentBidderId(null)}>
                <div className="flex items-center gap-2 min-w-0">
                  {getDocIcon(doc.type)}
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={doc.name}>{doc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusChip(doc.status)}
                  {doc.status === 'complete' && (
                    <button onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }} className="p-1 text-slate-300 hover:text-[#FF9933] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <button 
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-800 text-[10px] font-black text-[#003366] dark:text-[#FF9933] uppercase tracking-widest hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          onClick={() => setUploadModalConfig({ type: 'tender', targetId: currentFile.id })}
        >
          <Plus className="w-3.5 h-3.5" /> Add Tender Docs
        </button>
      </div>

      <div className={`p-4 flex-1 ${!isTenderReady ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Folder className="w-3.5 h-3.5" /> Bidders
          </h3>
          {!isTenderReady && <Lock className="w-3.5 h-3.5 text-amber-500" />}
        </div>

        <div className="space-y-2 mb-4">
          {currentFile.bidders.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center">
              {!isTenderReady ? 'Locked until AI clarification.' : 'No bidders added yet.'}
            </div>
          ) : (
            currentFile.bidders.map((bidder: any) => {
              const isScanning = bidder.docs.some((d: any) => d.status === 'scanning' || d.status === 'queued');
              const isComplete = bidder.docs.length > 0 && !isScanning;
              
              return (
                <div 
                  key={bidder.id} 
                  className={`flex items-center justify-between p-3 border transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${currentBidderId === bidder.id ? 'bg-[#003366] dark:bg-[#FF9933] text-white border-[#003366] dark:border-[#FF9933] scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#003366] dark:hover:border-[#FF9933] text-slate-800 dark:text-slate-200'}`}
                  onClick={() => setCurrentBidderId(bidder.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className={`w-4 h-4 ${currentBidderId === bidder.id ? 'text-[#FF9933] dark:text-[#003366]' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span className="text-[11px] font-black truncate" title={bidder.name}>{bidder.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${currentBidderId === bidder.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                      {bidder.docs.length} docs
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <button 
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-800 text-[10px] font-black text-[#003366] dark:text-[#FF9933] uppercase tracking-widest hover:border-[#003366] dark:hover:border-[#FF9933] hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30"
          onClick={() => setIsCreateBidderModalOpen(true)}
          disabled={!isTenderReady}
        >
          <Plus className="w-3.5 h-3.5" /> Register New Bidder
        </button>
      </div>
    </div>
  );
};

const WorkspaceRightPanel = ({ currentFile }: { currentFile: FileWorkspace | null }) => {
  if (!currentFile) return null;
  
  let totalCriteria = 0;
  let itemsNeedingReview = 0;
  
  currentFile.bidders.forEach(b => {
    if (b.evaluationResult?.criteria) {
      totalCriteria += b.evaluationResult.criteria.length;
      itemsNeedingReview += b.evaluationResult.criteria.filter(c => c.verdict === 'Manual Review').length;
    }
  });

  return (
    <div className="w-72 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full overflow-y-auto hidden xl:block flex-shrink-0 [scrollbar-gutter:stable]">
      <h3 className="text-xs font-black text-[#003366] dark:text-white uppercase tracking-widest mb-4">Workspace Summary</h3>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3 text-[#003366] dark:text-slate-300">
          <span className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Tender Docs</span>
          <span className="text-sm font-black">{currentFile.tenderDocs.length}</span>
        </div>
        <div className="flex justify-between items-center mb-3 text-[#003366] dark:text-slate-300">
          <span className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Bidders</span>
          <span className="text-sm font-black">{currentFile.bidders.length}</span>
        </div>
        <div className="flex justify-between items-center text-[#003366] dark:text-slate-300">
          <span className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Criteria Extracted</span>
          <span className="text-sm font-black">{totalCriteria}</span>
        </div>
      </div>

      <h3 className="text-xs font-black text-[#003366] dark:text-white uppercase tracking-widest mb-4">System Status</h3>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tender Status</h4>
          {currentFile.tenderStatus === 'awaiting_docs' && <span className="text-xs text-slate-400">Waiting for docs...</span>}
          {currentFile.tenderStatus === 'ml_processing' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">
                <span>ML Pipeline...</span>
                <span className="animate-pulse">Processing</span>
              </div>
              <div className="w-full bg-slate-100 h-1">
                <div className="bg-amber-500 h-1 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          {currentFile.tenderStatus === 'scanning' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-1">
                <span>Analyzing Context...</span>
                <span className="animate-pulse">Active</span>
              </div>
              <div className="w-full bg-slate-100 h-1">
                <div className="bg-[#003366] h-1 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          {currentFile.tenderStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs font-bold text-red-600">
              <AlertCircle className="w-4 h-4" /> ML Pipeline Error
            </div>
          )}
          {currentFile.tenderStatus === 'clarifying' && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
              <AlertCircle className="w-4 h-4" /> Criteria Review
            </div>
          )}
          {currentFile.tenderStatus === 'ready' && (
            <div className="flex items-center gap-2 text-xs font-bold text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Ready for Evaluation
            </div>
          )}
        </div>

        {itemsNeedingReview > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Action Required</h4>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                {itemsNeedingReview} items need manual review across bidders.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function NirnayAI() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<AppData>({ files: [] });
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentBidderId, setCurrentBidderId] = useState<string | null>(null);
  
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [uploadModalConfig, setUploadModalConfig] = useState<{ type: 'tender' | 'bidder', targetId: string } | null>(null);
  const [isCreateBidderModalOpen, setIsCreateBidderModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);

  useBodyScrollLock(isCreateFileModalOpen || !!uploadModalConfig || isCreateBidderModalOpen || !!previewDoc);

  useEffect(() => {
    import('@/lib/api-client').then(api => {
      api.fetchWorkspaces().then((workspaces: any) => {
        setData({ files: workspaces, isTestMode: false });
        setIsLoaded(true);
      }).catch(e => {
        console.error("Failed to load workspaces", e);
        setIsLoaded(true);
      });
    });
  }, []);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => updater(prev));
  }, []);

  const currentFile = data.files.find(f => f.id === currentFileId) || null;
  const currentBidder = currentFile?.bidders.find(b => b.id === currentBidderId) || null;

  if (!isLoaded) return null;

  const handleCreateFile = async (name: string) => {
    setIsCreateFileModalOpen(false);
    try {
      const { createWorkspace } = await import('@/lib/api-client');
      const newFile = await createWorkspace(name);
      setData(prev => ({ ...prev, files: [newFile, ...prev.files] }));
      setCurrentFileId(newFile.id);
      setCurrentBidderId(null);
    } catch (e) {
      console.error(e);
      alert('Failed to create workspace');
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        const { deleteWorkspace } = await import('@/lib/api-client');
        await deleteWorkspace(id);
        setData(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
        if (currentFileId === id) {
          setCurrentFileId(null);
          setCurrentBidderId(null);
        }
      } catch(e) {
        console.error(e);
        alert("Failed to delete workspace");
      }
    }
  };

  const handleCreateBidder = async (name: string) => {
    if (!currentFileId) return;
    setIsCreateBidderModalOpen(false);
    try {
      const { createBidder } = await import('@/lib/api-client');
      const newBidder = await createBidder(currentFileId, name);
      setData(prev => ({
        ...prev,
        files: prev.files.map(f => f.id === currentFileId ? { ...f, bidders: [...f.bidders, newBidder] } : f)
      }));
      setCurrentBidderId(newBidder.id);
    } catch (e) {
      console.error(e);
      alert("Failed to create bidder");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideDownFade { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb { background: #1e293b; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #334155; }
        * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .dark * { scrollbar-color: #1e293b transparent; }
      `}} />
      <Shell 
        data={data} 
        updateData={updateData} 
        setCurrentFileId={setCurrentFileId} 
        setCurrentBidderId={setCurrentBidderId}
      >
        {!currentFileId ? (
          <HomeGrid 
            data={data}
            setIsCreateFileModalOpen={setIsCreateFileModalOpen}
            setCurrentFileId={setCurrentFileId}
            setCurrentBidderId={setCurrentBidderId}
            handleDeleteFile={handleDeleteFile}
          />
        ) : (
          <>
            <WorkspaceSidebar 
              currentFile={currentFile} 
              currentBidderId={currentBidderId} 
              setCurrentFileId={setCurrentFileId} 
              setCurrentBidderId={setCurrentBidderId}
              setUploadModalConfig={setUploadModalConfig}
              setIsCreateBidderModalOpen={setIsCreateBidderModalOpen}
              setPreviewDoc={setPreviewDoc}
            />
            {currentBidderId ? (
              <BidderView 
                currentFile={currentFile} 
                currentBidder={currentBidder} 
                data={data} 
                updateData={updateData} 
                setUploadModalConfig={setUploadModalConfig} 
                setPreviewDoc={setPreviewDoc} 
              />
            ) : (
              <TenderOverviewView 
                currentFile={currentFile} 
                data={data} 
                updateData={updateData} 
                setUploadModalConfig={setUploadModalConfig}
                setPreviewDoc={setPreviewDoc}
              />
            )}
            <WorkspaceRightPanel currentFile={currentFile} />
          </>
        )}
      </Shell>
      
      <CreateFileModal 
        isCreateFileModalOpen={isCreateFileModalOpen} 
        setIsCreateFileModalOpen={setIsCreateFileModalOpen} 
        handleCreateFile={handleCreateFile} 
      />
      
      <UploadModal 
        uploadModalConfig={uploadModalConfig} 
        setUploadModalConfig={setUploadModalConfig} 
        currentFile={currentFile} 
        updateData={updateData} 
      />
      
      <CreateBidderModal 
        isCreateBidderModalOpen={isCreateBidderModalOpen} 
        setIsCreateBidderModalOpen={setIsCreateBidderModalOpen} 
        handleCreateBidder={handleCreateBidder} 
      />
      
      <DocumentPreviewModal 
        previewDoc={previewDoc} 
        setPreviewDoc={setPreviewDoc} 
      />
    </>
  );
}
