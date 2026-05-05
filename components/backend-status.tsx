"use client";

import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

type Status = "checking" | "online" | "offline";

export function BackendStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      const ok = await healthCheck();
      if (!cancelled) setStatus(ok ? "online" : "offline");
    }
    ping();
    const id = setInterval(ping, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const color =
    status === "online"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      : status === "offline"
      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";

  const label =
    status === "online"
      ? "Backend online"
      : status === "offline"
      ? "Offline — using cached data"
      : "Checking backend…";

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500" title={label}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${color} ${status === "checking" ? "animate-pulse" : ""}`} />
        {label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 shadow-inner">
      <span className={`h-2 w-2 shrink-0 rounded-full ${color} ${status === "checking" ? "animate-pulse" : ""}`} />
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </div>
  );
}
