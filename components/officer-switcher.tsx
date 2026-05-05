"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_OFFICERS, getActiveOfficer, setActiveOfficer } from "@/lib/officers";
import type { Officer } from "@/lib/types";

export function OfficerSwitcher({ compact = false }: { compact?: boolean }) {
  const [officer, setOfficer] = useState<Officer>(DEMO_OFFICERS[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOfficer(getActiveOfficer());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Officer>).detail;
      if (detail) setOfficer(detail);
    }
    window.addEventListener("nirnayai-officer-change", onChange);
    return () => window.removeEventListener("nirnayai-officer-change", onChange);
  }, []);

  function choose(o: Officer) {
    setOfficer(o);
    setActiveOfficer(o);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-left shadow-soft transition-all hover:border-slate-300 hover:shadow-government",
          compact ? "text-xs" : "text-sm",
        )}
      >
        <UserCircle2 className="h-4 w-4 shrink-0 text-blue-700" />
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{officer.name}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {officer.role}
          </p>
        </div>
        <ChevronDown className={cn("ml-1 h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close officer menu"
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-elevated backdrop-blur">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Switch reviewer</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">Active officer identity</p>
            </div>
            <div className="max-h-80 overflow-y-auto p-1">
              {DEMO_OFFICERS.map((o) => {
                const active = o.id === officer.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => choose(o)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-blue-50" : "hover:bg-slate-50",
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-xs font-black text-blue-700">
                      {o.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{o.name}</p>
                      <p className="truncate text-xs text-slate-500">{o.role}</p>
                    </div>
                    {active ? <Check className="h-4 w-4 text-blue-600" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
