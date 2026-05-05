"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
  duration: number;
};

type ToastContextValue = {
  toast: (input: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const STYLES: Record<ToastKind, { bar: string; icon: string; ring: string }> = {
  success: { bar: "bg-emerald-500", icon: "text-emerald-600", ring: "ring-emerald-100" },
  error: { bar: "bg-red-500", icon: "text-red-600", ring: "ring-red-100" },
  info: { bar: "bg-blue-500", icon: "text-blue-600", ring: "ring-blue-100" },
  warning: { bar: "bg-amber-500", icon: "text-amber-600", ring: "ring-amber-100" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>((input) => {
    const id = Math.random().toString(36).slice(2, 9);
    const item: ToastItem = { duration: 4000, ...input, id };
    setItems((prev) => [...prev, item]);
  }, []);

  const success = useCallback((title: string, description?: string) => toast({ kind: "success", title, description }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ kind: "error", title, description }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ kind: "info", title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ kind: "warning", title, description }), [toast]);

  const value = useMemo(
    () => ({ toast, success, error, info, warning, dismiss }),
    [toast, success, error, info, warning, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex max-w-sm flex-col gap-3">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = ICONS[item.kind];
  const style = STYLES[item.kind];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-2xl border border-slate-100 bg-white/95 p-4 pr-10 shadow-elevated ring-1 ring-inset",
        style.ring,
        "animate-fade-in backdrop-blur",
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1", style.bar)} />
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.icon)} />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{item.title}</p>
          {item.description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.description}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
