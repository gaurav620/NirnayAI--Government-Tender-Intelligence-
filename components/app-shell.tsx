"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  BarChart3,
  FileUp,
  Home,
  Landmark,
  LockKeyhole,
  Menu,
  ScrollText,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackendStatus } from "@/components/backend-status";
import { LiveTicker } from "@/components/live-ticker";
import { OfficerSwitcher } from "@/components/officer-switcher";

const primaryNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Upload", href: "/upload", icon: FileUp },
  { label: "Criteria", href: "/criteria", icon: ScrollText },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen gov-grid pb-0">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-soft backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 text-white shadow-glow transition-all duration-300 ease-smooth group-hover:-translate-y-0.5">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-slate-950">NirnayAI</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Government Tender Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50/80 p-1 shadow-inner md:flex">
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-smooth ${
                    isActive
                      ? "bg-white text-slate-900 shadow-soft"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              <OfficerSwitcher compact />
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-slate-200 bg-white/80 shadow-soft hover:bg-white hover:shadow-government"
                asChild
              >
                <Link href="/login">
                  <LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> Login
                </Link>
              </Button>
              <Button
                size="sm"
                className="rounded-lg shadow-glow transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-elevated"
                asChild
              >
                <Link href="/signup">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Sign up
                </Link>
              </Button>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/80 shadow-inner md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Live swipeable ticker */}
        <LiveTicker />

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200/60 bg-white/95 backdrop-blur-xl md:hidden animate-fade-in">
            <nav className="space-y-1 px-4 py-3">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <Button variant="outline" className="flex-1 rounded-lg" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <LockKeyhole className="mr-1.5 h-4 w-4" /> Login
                  </Link>
                </Button>
                <Button className="flex-1 rounded-lg" asChild>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <UserPlus className="mr-1.5 h-4 w-4" /> Sign up
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:px-6 lg:py-8">
        {/* Sidebar */}
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-[calc(4rem+2.5rem)] space-y-3 rounded-[1.75rem] border border-white/60 bg-white/75 p-3 shadow-government backdrop-blur-xl">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 p-5 text-white shadow-elevated">
              <ShieldCheck className="mb-3 h-6 w-6 text-amber-300" />
              <p className="text-sm font-bold leading-tight">Trusted procurement workspace</p>
              <p className="mt-1.5 text-xs leading-relaxed text-blue-200/80">
                AI decisions with traceable evidence and officer verification.
              </p>
            </div>
            <nav className="space-y-0.5">
              {primaryNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ease-smooth ${
                      isActive
                        ? "bg-blue-50 text-blue-900 shadow-soft"
                        : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
              <div className="mt-2">
                <BackendStatus compact />
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 overflow-hidden min-h-[calc(100vh-12rem)]">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
                  <Landmark className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-bold">NirnayAI</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Trusted tender intelligence</p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
                A professional AI procurement review interface for criteria extraction, vendor evaluation,
                evidence review, and human approval workflows.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <BackendStatus compact />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Product</p>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <Link className="block transition-colors hover:text-white" href="/upload">
                  Document upload
                </Link>
                <Link className="block transition-colors hover:text-white" href="/criteria">
                  Criteria verification
                </Link>
                <Link className="block transition-colors hover:text-white" href="/dashboard">
                  Evidence dashboard
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Access</p>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <Link className="block transition-colors hover:text-white" href="/login">
                  Login
                </Link>
                <Link className="block transition-colors hover:text-white" href="/signup">
                  Create account
                </Link>
                <span className="block text-slate-500">Secure by design</span>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-800/50 pt-6 text-center text-xs text-slate-500">
            NirnayAI — Government Tender Intelligence Platform. Built for transparency and accountability.
          </div>
        </div>
      </footer>
    </div>
  );
}
