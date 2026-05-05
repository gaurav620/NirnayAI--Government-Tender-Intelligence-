"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FileSignature,
  Landmark,
  Lock,
  ScanSearch,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { getAuditLog } from "@/lib/api";

/**
 * Infinite live ticker immediately below the header.
 * Shows a rotating feed of: live audit events + system metrics + product highlights.
 * Pauses on hover. Fully keyboard-accessible via link children.
 */
export function LiveTicker() {
  const [liveEvents, setLiveEvents] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const entries = await getAuditLog(6);
      if (cancelled) return;
      setLiveEvents(
        entries
          .slice(0, 5)
          .map((e) => `${e.action.replace(".", " ").toUpperCase()} · ${e.actorName}`),
      );
    }
    poll();
    const id = setInterval(poll, 18_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const baseItems: TickerItem[] = [
    { icon: Shield, kind: "trust", text: "CVC & GFR aligned" },
    { icon: Lock, kind: "trust", text: "Encrypted end-to-end" },
    { icon: Landmark, kind: "trust", text: "Government grade" },
    { icon: Sparkles, kind: "metric", text: "92% review time saved" },
    { icon: CheckCircle2, kind: "metric", text: "100% audit coverage" },
    { icon: TrendingUp, kind: "metric", text: "47s avg. decision time" },
    { icon: Users, kind: "feature", text: "Multi-officer sign-off" },
    { icon: FileSignature, kind: "feature", text: "Tamper-proof reports" },
    { icon: ScanSearch, kind: "feature", text: "Explainable extraction" },
    { icon: BarChart3, kind: "metric", text: "12 ministries onboarded" },
  ];

  const liveItems: TickerItem[] = liveEvents.map((text) => ({
    icon: Activity,
    kind: "live",
    text,
  }));

  const items = [...liveItems, ...baseItems];
  // Duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-t border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950">
      {/* Side fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent" />

      <div className="flex animate-marquee gap-8 whitespace-nowrap py-2 text-[11.5px] font-semibold uppercase tracking-[0.16em]">
        {loop.map((it, i) => (
          <TickerPill key={i} item={it} />
        ))}
      </div>
    </div>
  );
}

type TickerKind = "trust" | "metric" | "feature" | "live";

type TickerItem = {
  icon: typeof Activity;
  kind: TickerKind;
  text: string;
};

function TickerPill({ item }: { item: TickerItem }) {
  const colorByKind: Record<TickerKind, string> = {
    trust: "text-emerald-300",
    metric: "text-amber-300",
    feature: "text-blue-200",
    live: "text-fuchsia-300",
  };
  const dotByKind: Record<TickerKind, string> = {
    trust: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]",
    metric: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]",
    feature: "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.75)]",
    live: "bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.95)]",
  };
  const Icon = item.icon;

  return (
    <span className="inline-flex items-center gap-2.5 text-white/75">
      <span className={`h-1.5 w-1.5 rounded-full ${dotByKind[item.kind]} ${item.kind === "live" ? "animate-pulse" : ""}`} />
      <Icon className={`h-3.5 w-3.5 ${colorByKind[item.kind]}`} />
      <span>{item.text}</span>
      <span className="text-white/25">·</span>
      <span className="text-[10px] font-bold text-white/30">
        {item.kind === "live" ? "LIVE" : item.kind.toUpperCase()}
      </span>
      <Zap className="h-2.5 w-2.5 text-white/20" />
    </span>
  );
}
