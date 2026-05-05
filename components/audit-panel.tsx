"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, FileSignature, Lock, RefreshCw, ScanLine } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditLog } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";

const ACTION_META: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  "evaluation.run": { icon: ScanLine, color: "text-blue-600 bg-blue-50", label: "Evaluation run" },
  "report.created": { icon: FileSignature, color: "text-slate-700 bg-slate-100", label: "Report created" },
  "report.signed": { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", label: "Report signed" },
  "report.locked": { icon: Lock, color: "text-amber-700 bg-amber-50", label: "Report locked" },
};

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const list = await getAuditLog(40);
    setEntries(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="border-slate-100 bg-white/80 shadow-government">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Activity className="h-5 w-5 text-blue-700" />
            Audit log
          </CardTitle>
          <CardDescription className="text-sm">Immutable timeline of decisions and events.</CardDescription>
        </div>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh audit log"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-500 shadow-soft transition-colors hover:bg-white hover:text-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center text-sm text-slate-400">
            No activity yet. Run an evaluation or create a report.
          </p>
        ) : (
          <ol className="relative space-y-3 border-l border-slate-100 pl-5">
            {entries.map((e) => {
              const meta = ACTION_META[e.action] ?? { icon: Activity, color: "text-slate-600 bg-slate-100", label: e.action };
              const Icon = meta.icon;
              return (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${meta.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{meta.label}</p>
                      <span className="text-[10px] text-slate-400">· {relative(e.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {e.actorName}{" "}
                      <span className="font-normal text-slate-400">· {e.actorRole}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{e.note || e.target}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
