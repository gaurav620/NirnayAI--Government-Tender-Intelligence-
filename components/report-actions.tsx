"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy, ExternalLink, Link2, Lock, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApiError, createReport, lockReport, signReport } from "@/lib/api";
import { getActiveOfficer } from "@/lib/officers";
import type { Criteria, Report, SignatureDecision, VendorResult } from "@/lib/types";

type Props = {
  criteria: Criteria[];
  vendors: VendorResult[];
};

export function ReportActions({ criteria, vendors }: Props) {
  const toast = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<null | "create" | "sign" | "lock">(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = report ? `${typeof window === "undefined" ? "" : window.location.origin}/report/${report.token}` : "";

  async function onCreate() {
    if (!vendors.length) {
      toast.warning("No results yet", "Run an evaluation before creating a report.");
      return;
    }
    setBusy("create");
    try {
      const officer = getActiveOfficer();
      const title = `Tender evaluation — ${new Date().toLocaleDateString()}`;
      const created = await createReport(title, officer, criteria, vendors);
      setReport(created);
      toast.success("Report created", `Shareable link ready (${created.token}).`);
    } catch (err) {
      toast.error("Could not create report", err instanceof ApiError ? err.message : "Unexpected error.");
    } finally {
      setBusy(null);
    }
  }

  async function onSign(decision: SignatureDecision) {
    if (!report) return;
    setBusy("sign");
    try {
      const officer = getActiveOfficer();
      const updated = await signReport(report.token, officer, decision, note.trim());
      setReport(updated);
      setNote("");
      toast.success(`Signed as ${decision}`, `${officer.name} — ${officer.role}`);
    } catch (err) {
      toast.error("Sign failed", err instanceof ApiError ? err.message : "Unexpected error.");
    } finally {
      setBusy(null);
    }
  }

  async function onLock() {
    if (!report) return;
    setBusy("lock");
    try {
      const officer = getActiveOfficer();
      const updated = await lockReport(report.token, officer);
      setReport(updated);
      toast.success("Report locked", "Signatures are now frozen.");
    } catch (err) {
      toast.error("Lock failed", err instanceof ApiError ? err.message : "Unexpected error.");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.info("Link copied", "Shareable report URL is on your clipboard.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed", "Select the link manually.");
    }
  }

  return (
    <Card className="border-slate-100 bg-white/80 shadow-government">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="h-5 w-5 text-blue-700" />
          Report, sign &amp; lock
        </CardTitle>
        <CardDescription className="text-sm">
          Generate a shareable read-only report, collect multi-officer signatures, and seal the decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-slate-500">
              Snapshot the current criteria &amp; vendor results as a sealed report. Other officers can then sign off.
            </p>
            <Button
              onClick={onCreate}
              disabled={busy === "create"}
              className="rounded-xl shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              {busy === "create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Create report
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Share link */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-inner">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Shareable link</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  aria-label="Shareable report URL"
                  title="Shareable report URL"
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-soft transition-colors hover:bg-blue-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-soft transition-colors hover:bg-blue-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
              </div>
            </div>

            {/* Signatures so far */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Signatures ({report.signatures.length})
                </p>
                {report.locked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                ) : null}
              </div>
              {report.signatures.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No signatures yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {report.signatures.map((s, i) => (
                    <div
                      key={`${s.officer.id}-${i}`}
                      className="flex items-start gap-3 rounded-xl border border-white bg-white px-3 py-2.5 shadow-soft"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-[10px] font-black text-blue-700">
                        {s.officer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{s.officer.name}</p>
                          <span className="text-xs font-semibold text-slate-400">· {s.officer.role}</span>
                          <DecisionPill decision={s.decision} />
                        </div>
                        {s.note ? <p className="mt-1 text-xs italic text-slate-500">&ldquo;{s.note}&rdquo;</p> : null}
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          {new Date(s.signedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sign controls */}
            {!report.locked ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for your signature (e.g. 'Compliance verified against CVC guidelines')"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSign("approve")}
                    disabled={busy !== null}
                    className="rounded-xl bg-emerald-600 shadow-soft hover:bg-emerald-700 hover:shadow-government"
                  >
                    {busy === "sign" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                    Approve &amp; sign
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSign("reject")}
                    disabled={busy !== null}
                    variant="outline"
                    className="rounded-xl border-red-200 bg-white text-red-700 shadow-soft hover:bg-red-50"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSign("override")}
                    disabled={busy !== null}
                    variant="outline"
                    className="rounded-xl border-amber-200 bg-white text-amber-700 shadow-soft hover:bg-amber-50"
                  >
                    Override
                  </Button>
                  <Button
                    size="sm"
                    onClick={onLock}
                    disabled={busy !== null || report.signatures.length === 0}
                    variant="outline"
                    className="ml-auto rounded-xl border-slate-300 bg-white text-slate-700 shadow-soft hover:bg-slate-50"
                  >
                    {busy === "lock" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Lock className="mr-1.5 h-4 w-4" />}
                    Sign &amp; lock
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
                <strong>Report locked</strong> by {report.lockedBy?.name} on{" "}
                {report.lockedAt ? new Date(report.lockedAt).toLocaleString() : "—"}. Signatures are frozen.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DecisionPill({ decision }: { decision: SignatureDecision }) {
  const map: Record<SignatureDecision, string> = {
    approve: "bg-emerald-50 text-emerald-700 border-emerald-100",
    reject: "bg-red-50 text-red-700 border-red-100",
    override: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[decision]}`}>
      {decision}
    </span>
  );
}
