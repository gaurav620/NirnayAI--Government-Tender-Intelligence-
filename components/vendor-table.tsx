"use client";

import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { VendorResult } from "@/lib/types";

export function VendorTable({ vendors, onSelectVendor }: { vendors: VendorResult[]; onSelectVendor: (vendor: VendorResult) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/80 shadow-government">
      <div className="hidden grid-cols-[1.7fr_1fr_1fr_1fr_1fr_40px] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 md:grid">
        <span>Vendor</span>
        <span>Technical</span>
        <span>Financial</span>
        <span>Compliance</span>
        <span>Final Verdict</span>
        <span />
      </div>
      <div className="divide-y divide-slate-100">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            className="group grid w-full gap-3 px-5 py-4 text-left transition-all duration-300 ease-smooth hover:bg-blue-50/60 md:grid-cols-[1.7fr_1fr_1fr_1fr_1fr_40px] md:items-center"
            onClick={() => onSelectVendor(vendor)}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{vendor.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Click to review AI evidence trail</p>
            </div>
            <div className="flex items-center justify-between md:block">
              <span className="text-[10px] font-bold uppercase text-slate-300 md:hidden">Technical</span>
              <StatusBadge status={vendor.technicalStatus} />
            </div>
            <div className="flex items-center justify-between md:block">
              <span className="text-[10px] font-bold uppercase text-slate-300 md:hidden">Financial</span>
              <StatusBadge status={vendor.financialStatus} />
            </div>
            <div className="flex items-center justify-between md:block">
              <span className="text-[10px] font-bold uppercase text-slate-300 md:hidden">Compliance</span>
              <StatusBadge status={vendor.complianceStatus} />
            </div>
            <div className="flex items-center justify-between md:block">
              <span className="text-[10px] font-bold uppercase text-slate-300 md:hidden">Final</span>
              <StatusBadge status={vendor.finalVerdict} />
            </div>
            <ChevronRight className="hidden h-5 w-5 text-slate-300 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-0.5 md:block" />
          </button>
        ))}
      </div>
    </div>
  );
}
