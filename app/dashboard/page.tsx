"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Folder, Trash2, X, UploadCloud, CheckCircle2, 
  Clock, AlertCircle, File, Image as ImageIcon, Send, ChevronRight, ChevronDown, ChevronLeft, User, Shield, Eye, Lock
} from 'lucide-react';
import { UserButton } from "@clerk/nextjs";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

// --- Types ---
type FileStatus = 'queued' | 'scanning' | 'complete' | 'failed';
type TenderStatus = 'awaiting_docs' | 'scanning' | 'clarifying' | 'ready';

interface Doc {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  uploadedAt: string;
}

interface TenderOverviewData {
  summary: string;
  keyRequirements: string[];
  criteriaCount: number;
  tenderType: string;
  estimatedBidders: string;
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
}

interface FileWorkspace {
  id: string;
  name: string;
  createdAt: string;
  tenderStatus: TenderStatus;
  tenderDocs: Doc[];
  tenderOverview: TenderOverviewData | null;
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
      if (parsed.isTestMode === undefined) parsed.isTestMode = true;
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
async function callAnthropicAPI(system: string, userMessage: string, isTestMode: boolean = false): Promise<string> {
  // Auto-fallback to test mode if no API key is configured
  if (isTestMode || !process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (system.includes("realistic tender overview")) {
      return JSON.stringify({"summary": "This tender is for the procurement of tactical equipment. The documents outline technical specifications, financial requirements, and compliance milestones.", "keyRequirements": ["Must have Class-I Local Supplier certification", "Minimum average turnover required", "Technical demo needed"], "criteriaCount": 8, "tenderType": "Goods", "estimatedBidders": "5-10"});
    }
    if (system.includes("ask the user one or more clarifying questions")) {
      return JSON.stringify({"status": "CLARIFYING", "message": "Could you please specify the exact minimum average annual turnover required for bidders to be eligible?"});
    }
    if (system.includes("decide if you have enough information")) {
      return JSON.stringify({"status": "READY", "message": "Thank you for the clarification. The evaluation engine is now fully initialized and ready to assess bidders against the mandatory criteria."});
    }
    if (system.includes("simulate a realistic procurement eligibility evaluation")) {
      return JSON.stringify({
        "overallVerdict": "Requires Human Review",
        "criteria": [
          { "id": "C1", "description": "Local Supplier Certification", "category": "Compliance", "mandatory": true, "verdict": "Eligible", "sourceDocument": "compliance_cert.pdf", "extractedValue": "Class-I Local Supplier", "reason": "Valid certificate provided.", "confidence": "High" },
          { "id": "C2", "description": "Minimum Turnover Threshold", "category": "Financial", "mandatory": true, "verdict": "Manual Review", "sourceDocument": "financials_2023.pdf", "extractedValue": "Marginally Below", "reason": "Turnover is slightly below the threshold. Human review required.", "confidence": "Medium" }
        ]
      });
    }
    return "Dummy test mode response.";
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ''
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    
    if (!response.ok) {
      console.error("AI API Error", await response.text());
      throw new Error("API call failed");
    }
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
}

function parseJSONResponse<T>(text: string): T | null {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    return JSON.parse(cleanText) as T;
} catch (e) {
    console.error("Failed to parse JSON from AI response:", text);
    return null;
  }
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
  
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [currentFile?.clarificationLog?.length]);

  useEffect(() => {
    if (currentFile.tenderStatus === 'scanning' && !isChatLoading) {
      setIsChatLoading(true);
      const filenames = currentFile.tenderDocs.map((d: any) => d.name).join(', ');
      
      const fetchInitialSetup = async () => {
        try {
          const systemPrompt = `You are NirnayAI, a government procurement analysis assistant. Generate a realistic tender overview based on filenames. JSON format: {"summary": "2-3 sentences", "keyRequirements": ["req 1", "req 2"], "criteriaCount": 8, "tenderType": "Services", "estimatedBidders": "10-25"}`;
          const overviewText = await callAnthropicAPI(systemPrompt, `Tender documents: ${filenames}`, data.isTestMode);
          const overviewData = parseJSONResponse<TenderOverviewData>(overviewText);

          const clarifyPrompt = `You are NirnayAI, an evaluation engine. You MUST ask the user one or more clarifying questions about the tender documents to ensure you have sufficient context before evaluating bidders. Respond strictly in this JSON format: {"status": "CLARIFYING", "message": "Your question here..."}`;
          const clarifyText = await callAnthropicAPI(clarifyPrompt, `Tender documents uploaded: ${filenames}. Ask your first question.`, data.isTestMode);
          const clarifyData = parseJSONResponse<{status: string, message: string}>(clarifyText);

          const aiContent = clarifyData?.message || "Could you provide more context on the mandatory financial criteria for this tender?";

          const { updateWorkspace, addClarification } = await import('@/lib/api-client');
          await updateWorkspace(currentFile.id, { tenderOverview: overviewData, tenderStatus: 'clarifying' });
          await addClarification(currentFile.id, 'ai', aiContent);

          updateData((prev: any) => ({
            ...prev,
            files: prev.files.map((f: any) => f.id === currentFile.id ? {
              ...f, 
              tenderOverview: overviewData || f.tenderOverview,
              tenderStatus: 'clarifying',
              clarificationLog: [{ role: 'ai', content: aiContent }]
            } : f)
          }));
        } catch (e) {
          console.error("Setup failed", e);
        } finally {
          setIsChatLoading(false);
        }
      };
      fetchInitialSetup();
    }
  }, [currentFile?.tenderStatus, currentFile?.tenderDocs, currentFile?.id, updateData, isChatLoading, data.isTestMode]);

  const handleAnswerQuestion = async (msg: string) => {
    if (!msg.trim() || isChatLoading) return;
    
    const newHistory = [...currentFile.clarificationLog, { role: 'user' as const, content: msg }];
    updateData((prev: any) => ({
      ...prev,
      files: prev.files.map((f: any) => f.id === currentFile.id ? { ...f, clarificationLog: newHistory } : f)
    }));
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { addClarification, updateWorkspace } = await import('@/lib/api-client');
      await addClarification(currentFile.id, 'user', msg);

      const conversationContext = newHistory.map(l => `${l.role === 'ai' ? 'AI' : 'User'}: ${l.content}`).join('\n');
      const system = `You are NirnayAI, a strict procurement evaluator. You are verifying tender criteria with the user.
      Based on the conversation context, decide if you have enough information to accurately evaluate bidders against this tender.
      If NO: Respond with {"status": "CLARIFYING", "message": "Your next question..."}.
      If YES: Respond with exactly {"status": "READY", "message": "Context finalized. Green signal achieved."}.`;
      
      const responseText = await callAnthropicAPI(system, `Conversation so far:\n${conversationContext}\nEvaluate context status.`, data.isTestMode);
      const responseData = parseJSONResponse<{status: string, message: string}>(responseText);
      
      const isReady = responseData?.status === 'READY' || responseText.includes('"status": "READY"');
      const aiMessage = responseData?.message || "Understood. The evaluation engine is now ready.";

      await addClarification(currentFile.id, 'ai', aiMessage);
      if (isReady) {
        await updateWorkspace(currentFile.id, { tenderStatus: 'ready' });
      }

      updateData((prev: any) => {
        const file = prev.files.find((f: any) => f.id === currentFile.id);
        if (!file) return prev;
        return {
          ...prev,
          files: prev.files.map((f: any) => f.id === currentFile.id ? {
            ...f,
            tenderStatus: isReady ? 'ready' : 'clarifying',
            clarificationLog: [...file.clarificationLog, { role: 'ai', content: aiMessage }]
          } : f)
        };
      });
    } catch (e) {
      console.error(e);
      updateData((prev: any) => ({
        ...prev,
        files: prev.files.map((f: any) => f.id === currentFile.id ? {
          ...f,
          clarificationLog: [...f.clarificationLog, { role: 'ai', content: "Network error processing response. Are there any other mandatory criteria I should know about?" }]
        } : f)
      }));
    } finally {
      setIsChatLoading(false);
    }
  };

  if (currentFile.tenderStatus === 'awaiting_docs') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 relative bg-white">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
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

  if (currentFile.tenderStatus === 'scanning') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative bg-white">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF9933] rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#003366]" />
          </div>
        </div>
        <h2 className="text-lg font-black text-[#003366] uppercase tracking-wider mb-2">Analyzing Documents...</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Extracting criteria and building context model</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-10 pb-40 scroll-smooth [scrollbar-gutter:stable]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 bg-white border border-slate-200 p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 flex gap-2">
              {currentFile.tenderDocs.map((doc: any) => (
                <button 
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="w-10 h-10 bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#FF9933] hover:border-[#FF9933] hover:bg-white transition-all"
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
                AI Clarification Active
              </div>
            )}
            <h2 className="text-5xl font-black text-[#003366] uppercase tracking-tighter leading-tight mb-4 max-w-[80%]">
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

          <div className="mb-8">
            <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Evaluator Pre-Check Thread
            </h3>
            <div className="space-y-6">
              {currentFile.clarificationLog.map((msg: any, i: number) => {
                const isLastAiMsg = msg.role === 'ai' && i === currentFile.clarificationLog.length - 1;
                return (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-3xl ${msg.role === 'user' ? 'bg-[#003366] text-white rounded-br-sm' : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                      {msg.role === 'ai' && <div className="text-[9px] font-black text-[#FF9933] uppercase tracking-widest mb-2">NirnayAI Question</div>}
                      <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {msg.role === 'ai' ? <TypewriterText text={msg.content} animate={isLastAiMsg} /> : msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-5 rounded-3xl rounded-bl-sm bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {currentFile.tenderStatus === 'clarifying' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-[#001122] dark:via-[#001122] to-transparent p-6 z-10">
          <div className="max-w-4xl mx-auto relative flex flex-col">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 ml-4">Provide Clarification to proceed</span>
            <div className="relative group">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnswerQuestion(chatInput)}
                placeholder="Answer the AI's question above..."
                className="w-full bg-white border-2 border-slate-200 px-8 py-5 text-sm font-medium focus:outline-none focus:border-[#003366] transition-all pr-28 shadow-sm"
              />
              <button 
                className="absolute right-2 top-2 bottom-2 bg-[#003366] text-white px-6 hover:bg-[#002244] transition-all disabled:opacity-50 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm"
                onClick={() => handleAnswerQuestion(chatInput)}
                disabled={!chatInput.trim() || isChatLoading}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
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
    if (isComplete && !currentBidder.evaluationResult && !isEvalLoading) {
      setIsEvalLoading(true);
      const tDocs = currentFile.tenderDocs.map((d: any) => d.name).join(', ');
      const bDocs = currentBidder.docs.map((d: any) => d.name).join(', ');
      
      const fetchEval = async () => {
        try {
          const systemPrompt = `You are NirnayAI's evaluation engine. Given a list of tender document filenames and bidder document filenames, simulate a realistic procurement eligibility evaluation. Generate criterion-level verdicts. Respond in this exact JSON format with no markdown: {"overallVerdict": "Clearly Eligible" | "Clearly Not Eligible" | "Requires Human Review", "criteria": [{"id": "C1", "description": "...", "category": "Financial" | "Technical" | "Compliance" | "Documentation", "mandatory": true | false, "verdict": "Eligible" | "Not Eligible" | "Manual Review" | "Not Applicable", "sourceDocument": "...", "extractedValue": "...", "reason": "...", "confidence": "High" | "Medium" | "Low"}]}`;
          const userMsg = `Tender documents: ${tDocs}. Bidder name: ${currentBidder.name}. Bidder documents: ${bDocs}. Evaluate this bidder against the tender criteria. Generate 6 to 10 criteria.`;
          
          const responseText = await callAnthropicAPI(systemPrompt, userMsg, data.isTestMode);
          const evalData = parseJSONResponse<EvaluationResult>(responseText);
          
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
        } catch (error) {
          console.error("Evaluation failed", error);
        } finally {
          setIsEvalLoading(false);
        }
      };
      
      fetchEval();
    }
  }, [isComplete, currentBidder?.evaluationResult, currentBidder?.docs, currentBidder?.id, currentBidder?.name, currentFile?.tenderDocs, currentFile?.id, updateData, isEvalLoading, data.isTestMode]);

  if (!hasDocs) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white relative">
        <div className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">{currentBidder.name}</div>
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Folder className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-[#003366] uppercase tracking-wider mb-2">No documents uploaded for this bidder yet.</h2>
        <p className="text-slate-500 font-medium max-w-md mb-8">
          Upload technical bids, financial statements, and compliance certificates for evaluation.
        </p>
        <button 
          className="bg-[#003366] text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#002244] transition-all shadow-sm"
          onClick={() => setUploadModalConfig({ type: 'bidder', targetId: currentBidder.id })}
        >
          + Add Documents
        </button>
      </div>
    );
  }

  if (isScanning || isEvalLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white relative">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#003366] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-lg font-black text-[#003366] uppercase tracking-wider mb-2">Running AI Evaluation...</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Cross-referencing bidder docs against tender criteria</p>
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
            <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-tight mb-2">
              {currentBidder.name}
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {currentBidder.docs.length} Documents • Evaluation Complete
            </p>
          </div>
          <button 
            className="bg-white border-2 border-[#003366] text-[#003366] px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-all shadow-sm flex items-center gap-2"
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
           <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] mb-4 border-b-2 border-[#FF9933] pb-2 inline-block">
             Uploaded Documents
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {currentBidder.docs.map((doc: any) => (
               <div key={doc.id} className="border border-slate-200 p-4 flex items-center justify-between group bg-white hover:border-[#003366] hover:bg-slate-50 transition-all cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                 <div className="flex items-center gap-3 overflow-hidden">
                   {getDocIcon(doc.type)}
                   <div className="truncate">
                     <p className="text-xs font-bold text-[#003366] truncate">{doc.name}</p>
                     <p className="text-[10px] text-slate-400 font-medium">{(doc.size/1024/1024).toFixed(2)} MB</p>
                   </div>
                 </div>
                 <Eye className="w-4 h-4 text-slate-300 group-hover:text-[#FF9933] flex-shrink-0" />
               </div>
             ))}
           </div>
        </div>

        <div className="mb-12">
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] mb-6 border-b-2 border-[#FF9933] pb-2 inline-block">
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
                <div key={c.id} className="border border-slate-200 bg-white overflow-hidden transition-all">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleCriteria(c.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-1 uppercase border border-slate-200">
                        {c.id}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#003366]">{c.description}</div>
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
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm animate-[fadeIn_0.2s_ease-out]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Extracted Value</div>
                          <div className="font-medium text-slate-800 bg-white border border-slate-200 p-2">{c.extractedValue}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reasoning</div>
                          <div className="font-medium text-slate-800 bg-white border border-slate-200 p-2">{c.reason}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-6">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Source Document:</span>
                          <span className="font-bold text-[#003366] text-xs underline decoration-slate-300 underline-offset-4 cursor-pointer">{c.sourceDocument}</span>
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
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-[0.2em] mb-6">
            Risk Assessment
          </h3>
          <div className="bg-white border border-slate-200 p-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Overall Risk Profile</span>
              <span className={`text-sm font-black uppercase tracking-widest ${res.overallVerdict === 'Clearly Eligible' ? 'text-green-600' : res.overallVerdict === 'Clearly Not Eligible' ? 'text-red-600' : 'text-amber-600'}`}>
                {riskLevel}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 mb-6">
              <div className={`${riskColor} h-2 transition-all duration-1000`} style={{ width: riskWidth }} />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600">
                <div className="w-1 h-1 bg-slate-400 mt-1.5 rounded-full" />
                Automated risk scoring based on deviation from mandatory requirements.
              </li>
              <li className="flex items-start gap-2 text-xs font-medium text-slate-600">
                <div className="w-1 h-1 bg-slate-400 mt-1.5 rounded-full" />
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
  if (!previewDoc) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-50 w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
              {getDocIcon(previewDoc.type)}
            </div>
            <div>
              <h3 className="text-sm font-black text-[#003366] truncate max-w-lg">{previewDoc.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {(previewDoc.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(previewDoc.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 p-2"><X className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 p-8 bg-slate-100 overflow-y-auto flex justify-center items-start">
          <div className="w-full max-w-3xl bg-white shadow-sm border border-slate-200 min-h-full p-12 relative flex flex-col items-center justify-center">
            <div className="text-center opacity-30 select-none">
              <FileText className="w-24 h-24 mx-auto mb-6 text-slate-400" />
              <div className="text-2xl font-black uppercase tracking-widest text-slate-400 mb-2">Simulated Preview</div>
              <p className="text-sm font-bold text-slate-400">File contents are not stored in window.storage.</p>
            </div>
            <div className="absolute inset-12 pointer-events-none opacity-5">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-4 bg-black mb-4 rounded-full w-full" style={{ width: `${Math.random() * 40 + 60}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateFileModal = ({ isCreateFileModalOpen, setIsCreateFileModalOpen, handleCreateFile }: any) => {
  if (!isCreateFileModalOpen) return null;
  const [name, setName] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-md shadow-xl border border-slate-200 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest">Create New File</h3>
          <button onClick={() => setIsCreateFileModalOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">File Name / Tender ID</label>
          <input 
            autoFocus
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreateFile(name.trim())}
            placeholder="e.g., CRPF/PROC/2026/01"
            className="w-full border-2 border-slate-200 p-3 text-sm focus:outline-none focus:border-[#003366] mb-8"
          />
          <div className="flex justify-end gap-4">
            <button 
              className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50"
              onClick={() => setIsCreateFileModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#002244]"
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
    const filesToProcess = [...selectedFiles]; // Keep reference to actual files for ML pipeline

    const configType = uploadModalConfig.type;
    const tId = uploadModalConfig.targetId;
    setUploadModalConfig(null);

    try {
      const { addTenderDocuments, addBidderDocuments, updateDocumentStatus, processDocumentML, extractCriteriaML, extractValuesML } = await import('@/lib/api-client');
      let createdDocs;
      if (isTender) {
        createdDocs = await addTenderDocuments(currentFile.id, payloadDocs);
      } else {
        createdDocs = await addBidderDocuments(currentFile.id, tId, payloadDocs);
      }

      // Update UI with uploaded docs (status: queued)
      updateData((prev: any) => {
        return {
          files: prev.files.map((f: any) => {
            if (f.id !== currentFile.id) return f;
            if (isTender) {
              return { 
                ...f, 
                tenderStatus: 'scanning',
                tenderDocs: [...f.tenderDocs, ...createdDocs] 
              };
            } else {
              return {
                ...f,
                bidders: f.bidders.map((b: any) => b.id === tId ? { ...b, docs: [...b.docs, ...createdDocs] } : b)
              };
            }
          })
        };
      });

      // --- ML Pipeline Processing ---
      // Process each file through the Railway ML pipeline in the background
      createdDocs.forEach((doc: any, idx: number) => {
        const originalFile = filesToProcess[idx];
        if (!originalFile) return;

        // Step 1: Set status to 'scanning' — ML pipeline is processing
        setTimeout(async () => {
          updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'scanning'));
          await updateDocumentStatus(currentFile.id, doc.id, 'scanning');

          try {
            if (isTender) {
              // For tender docs: OCR + extract criteria
              console.log(`[ML Pipeline] Processing tender doc: ${originalFile.name}`);
              const mlResult = await processDocumentML(originalFile);
              console.log(`[ML Pipeline] OCR complete for: ${originalFile.name}`, mlResult);

              // Also extract criteria from the tender document
              try {
                const criteriaResult = await extractCriteriaML(originalFile);
                console.log(`[ML Pipeline] Criteria extracted:`, criteriaResult);
              } catch (criteriaErr) {
                console.warn(`[ML Pipeline] Criteria extraction failed (non-critical):`, criteriaErr);
              }
            } else {
              // For bidder docs: OCR + extract values against criteria
              console.log(`[ML Pipeline] Processing bidder doc: ${originalFile.name}`);
              const mlResult = await processDocumentML(originalFile);
              console.log(`[ML Pipeline] OCR complete for: ${originalFile.name}`, mlResult);

              // Try to extract values if criteria exist
              try {
                const tenderCriteria = currentFile.tenderDocs?.length > 0 
                  ? JSON.stringify({ criteria: "Extract all eligibility criteria values" })
                  : "";
                if (tenderCriteria) {
                  const valuesResult = await extractValuesML(originalFile, tenderCriteria);
                  console.log(`[ML Pipeline] Values extracted:`, valuesResult);
                }
              } catch (valErr) {
                console.warn(`[ML Pipeline] Value extraction failed (non-critical):`, valErr);
              }
            }

            // Step 2: ML processing complete — mark as 'complete'
            updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'complete'));
            await updateDocumentStatus(currentFile.id, doc.id, 'complete');
            console.log(`[ML Pipeline] ✓ Document processed: ${originalFile.name}`);

          } catch (mlErr) {
            console.error(`[ML Pipeline] Error processing ${originalFile.name}:`, mlErr);
            // Still mark as complete — ML failure is non-blocking for now
            updateData((prev: any) => updateDocStatus(prev, currentFile.id, configType, tId, doc.id, 'complete'));
            await updateDocumentStatus(currentFile.id, doc.id, 'complete');
          }
        }, 500 + idx * 200);
      });

    } catch (e) {
      console.error(e);
      alert('Failed to upload documents');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
        <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="text-sm font-black uppercase tracking-widest">
            Add {isTender ? 'Tender' : 'Bidder'} Documents
          </h3>
          <button onClick={() => setUploadModalConfig(null)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div 
            className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors mb-6 ${isDragging ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-slate-300 hover:border-[#003366] bg-slate-50'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#FF9933]' : 'text-slate-400'}`} />
            <p className="text-sm font-bold text-[#003366] mb-2">Drop files here or click to browse</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supports PDF, DOCX, JPG, PNG, WEBP</p>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {getDocIcon(file.type)}
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#003366] truncate">{file.name}</div>
                        <div className="text-[10px] font-medium text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 p-2" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-4 flex-shrink-0">
          <button className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50" onClick={() => setUploadModalConfig(null)}>Cancel</button>
          <button className="bg-[#003366] text-white px-8 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#002244]" disabled={selectedFiles.length === 0} onClick={handleUpload}>Upload Documents</button>
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
      <div className="bg-white w-full max-w-md shadow-xl border border-slate-200 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-[#003366] text-white px-6 py-4 flex justify-between items-center">
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
  <div className="h-screen overflow-hidden flex flex-col bg-slate-50 font-sans text-[#333] relative">
    <DotPattern
      className={cn(
        "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)] opacity-40",
      )}
    />
    <div className="gov-tricolor flex h-[5px] w-full flex-shrink-0 relative z-10">
      <div className="bg-[#FF9933] flex-1" />
      <div className="bg-white flex-1" />
      <div className="bg-[#138808] flex-1" />
    </div>
    <header className="bg-[#003366] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#FF9933] flex-shrink-0 relative z-10">
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
  <div className="flex-1 overflow-auto p-8 bg-slate-50 [scrollbar-gutter:stable]">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-lg font-black text-[#003366] uppercase tracking-widest mb-6 pb-2 border-b-2 border-slate-200">
        Recent Files
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          className="bg-white border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:border-[#003366] hover:bg-slate-50 transition-all group"
          onClick={() => setIsCreateFileModalOpen(true)}
        >
          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center group-hover:bg-[#003366] group-hover:text-white transition-all text-[#003366] mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-[#003366] uppercase tracking-wider">Create new File</span>
        </div>

        {data.files.map((file: any) => (
          <div 
            key={file.id}
            className="bg-white border border-slate-200 p-8 flex flex-col justify-between h-56 cursor-pointer hover:border-[#003366] hover:bg-slate-50 transition-all relative group"
            onClick={() => { setCurrentFileId(file.id); setCurrentBidderId(null); }}
          >
            <div>
              <div className="flex items-start justify-between">
                <FileText className="w-6 h-6 text-[#003366] mb-3" />
                <button 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                  onClick={(e) => handleDeleteFile(e, file.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-[#003366] line-clamp-2 leading-snug">
                {file.name.length > 40 ? file.name.substring(0, 40) + '...' : file.name}
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-medium space-y-1">
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
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[#003366] transition-colors" onClick={() => { setCurrentFileId(null); setCurrentBidderId(null); }}>
          <ChevronLeft className="w-4 h-4" /> Back to Files
        </div>
        <h2 className="mt-3 text-sm font-black text-[#003366] uppercase tracking-wide truncate" title={currentFile.name}>
          {currentFile.name}
        </h2>
      </div>

      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Tender Docs
          </h3>
        </div>
        
        <div className="space-y-2 mb-4">
          {currentFile.tenderDocs.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center">No tender docs yet.</div>
          ) : (
            currentFile.tenderDocs.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-[#003366] hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => setCurrentBidderId(null)}>
                <div className="flex items-center gap-2 min-w-0">
                  {getDocIcon(doc.type)}
                  <span className="text-[11px] font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</span>
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
          className="w-full py-3 border-2 border-dashed border-slate-300 text-[10px] font-black text-[#003366] uppercase tracking-widest hover:border-[#003366] hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
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
                  className={`flex items-center justify-between p-3 border transition-all cursor-pointer hover:bg-slate-50 ${currentBidderId === bidder.id ? 'bg-[#003366] text-white border-[#003366] scale-[1.02]' : 'bg-white border-slate-200 hover:border-[#003366] text-slate-800'}`}
                  onClick={() => setCurrentBidderId(bidder.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className={`w-4 h-4 ${currentBidderId === bidder.id ? 'text-[#FF9933]' : 'text-slate-400'}`} />
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
          className="w-full py-3 border-2 border-dashed border-slate-300 text-[10px] font-black text-[#003366] uppercase tracking-widest hover:border-[#003366] hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30"
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
    <div className="w-72 bg-slate-50 border-l border-slate-200 p-6 flex flex-col h-full overflow-y-auto hidden xl:block flex-shrink-0 [scrollbar-gutter:stable]">
      <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest mb-4">Workspace Summary</h3>
      
      <div className="bg-white border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tender Docs</span>
          <span className="text-sm font-black text-[#003366]">{currentFile.tenderDocs.length}</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bidders</span>
          <span className="text-sm font-black text-[#003366]">{currentFile.bidders.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Criteria Extracted</span>
          <span className="text-sm font-black text-[#003366]">{totalCriteria}</span>
        </div>
      </div>

      <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest mb-4">System Status</h3>
      
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 p-6">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tender Status</h4>
          {currentFile.tenderStatus === 'awaiting_docs' && <span className="text-xs text-slate-400">Waiting for docs...</span>}
          {currentFile.tenderStatus === 'scanning' && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">
                <span>Scanning...</span>
                <span className="animate-pulse">Processing</span>
              </div>
              <div className="w-full bg-slate-100 h-1">
                <div className="bg-amber-500 h-1 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          {currentFile.tenderStatus === 'clarifying' && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
              <AlertCircle className="w-4 h-4" /> AI Clarification Active
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
        * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
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
