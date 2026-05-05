import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  FileSearch,
  Gavel,
  LockKeyhole,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarouselStrip, FeatureCarousel } from "@/components/feature-carousel";

const workflowSteps = [
  {
    icon: FileSearch,
    title: "Criteria extraction",
    text: "AI reads tender clauses and identifies thresholds with precision.",
  },
  {
    icon: ShieldCheck,
    title: "Officer verification",
    text: "Mandatory requirements remain human-approved and auditable.",
  },
  {
    icon: BarChart3,
    title: "Vendor scoring",
    text: "Results are summarized with clear, explainable verdicts.",
  },
  {
    icon: LockKeyhole,
    title: "Evidence trail",
    text: "Every decision links back to source material for transparency.",
  },
];

const stats = [
  { value: "92%", label: "Review time saved", sub: "Automated extraction & scoring" },
  { value: "100%", label: "Traceable evidence", sub: "Full source attribution" },
  { value: "24/7", label: "AI readiness", sub: "Always-on evaluation engine" },
];

const features = [
  {
    title: "Explainable by design",
    text: "Every verdict ships with extracted values, thresholds, reasoning, and confidence — ready for audit.",
    icon: ScanLine,
  },
  {
    title: "Deterministic rule engine",
    text: "Hard rules you control. No hallucinations in the final verdict — only transparent, testable logic.",
    icon: Gavel,
  },
  {
    title: "Officer-in-the-loop",
    text: "Toggle which criteria apply, review evidence side-by-side, and sign off with full confidence.",
    icon: Users,
  },
  {
    title: "Enterprise security",
    text: "CORS-scoped APIs, encrypted intake, and temp-only file storage. Ready for on-prem deployment.",
    icon: ShieldCheck,
  },
  {
    title: "Blazing-fast review",
    text: "Cut tender evaluation cycles from days to minutes with parallel vendor scoring and live progress.",
    icon: TimerReset,
  },
  {
    title: "Standards-aligned",
    text: "Designed to support CVC, GFR, and state-level procurement guidelines out of the box.",
    icon: ScrollText,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Upload tender + vendor bids",
    text: "Drag-drop PDFs. We secure, chunk, and prepare documents for structured extraction.",
  },
  {
    step: "02",
    title: "Confirm AI-extracted criteria",
    text: "Review the checklist of thresholds and mandatory requirements. Toggle what applies.",
  },
  {
    step: "03",
    title: "Run the rule engine",
    text: "Deterministic evaluation produces Eligible / Manual Review / Not Eligible per vendor.",
  },
  {
    step: "04",
    title: "Inspect evidence & decide",
    text: "Open the evidence drawer to trace every verdict back to source documents.",
  },
];

export default function HomePage() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-12 overflow-hidden animate-fade-in">
      {/* ───────── Hero ───────── */}
      <section className="ambient-blobs grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-stretch">
        <Card className="aurora-card relative min-h-[520px] min-w-0 overflow-hidden border-slate-200/60 bg-white/85 shadow-elevated">
          <div className="relative flex h-full flex-col p-7 md:p-10">
            {/* Mesh-border kicker */}
            <div className="mesh-border inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-800 shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span className="text-gradient">Trusted AI for public procurement</span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                v2026
              </span>
            </div>

            <h1 className="mt-8 max-w-3xl text-[2.45rem] font-black leading-[1.05] tracking-tight text-slate-950 md:text-[3.25rem] 2xl:text-[3.55rem]">
              Evaluate tenders with{" "}
              <span className="shimmer-text">evidence</span>,<br className="hidden md:block" /> speed, and{" "}
              <span className="text-gradient">confidence</span>.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 md:text-[17px] md:leading-8">
              Upload tenders, verify AI-extracted criteria, evaluate vendors, and sign off every verdict
              through a transparent evidence drawer — built for government-grade scrutiny.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="group magnetic rounded-xl shadow-glow hover:shadow-elevated"
                asChild
              >
                <Link href="/upload">
                  Start evaluation
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="magnetic rounded-xl border-slate-200 bg-white/80 shadow-soft hover:bg-white hover:shadow-government"
                asChild
              >
                <Link href="/dashboard">View dashboard</Link>
              </Button>
              <span className="ml-0 hidden items-center gap-1.5 self-center text-xs font-medium text-slate-400 sm:ml-2 sm:inline-flex">
                or press <span className="kbd">⌘</span><span className="kbd">K</span>
              </span>
            </div>

            <div className="mt-auto pt-10">
              <div className="grid min-w-0 gap-3 md:grid-cols-3">
                {stats.map((stat, i) => {
                  const iconMap = [TimerReset, ShieldCheck, Zap];
                  const Icon = iconMap[i] ?? Sparkles;
                  return (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-soft backdrop-blur-sm transition-all duration-300 ease-smooth hover:-translate-y-1 hover:bg-white hover:shadow-government"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-80" />
                      <div className="relative flex items-start justify-between">
                        <p className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
                        <Icon className="h-4 w-4 text-blue-500 opacity-60 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                      </div>
                      <p className="relative mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                      <p className="relative mt-1 text-xs text-slate-400">{stat.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Live workflow panel */}
        <Card className="grain relative min-w-0 overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white shadow-elevated">
          {/* Animated orb */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl animate-pulse-slow" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

          <CardContent className="relative flex h-full flex-col p-7 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200/70">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live workflow
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Procurement cockpit</h2>
              </div>
              <div className="relative">
                <BadgeCheck className="h-9 w-9 text-amber-300 drop-shadow" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {workflowSteps.map((item, idx) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 backdrop-blur-sm transition-all duration-300 ease-smooth hover:border-white/[0.18] hover:bg-white/[0.1]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                      <item.icon className="h-[18px] w-[18px] text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{item.title}</p>
                        <span className="rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-200/70">
                          0{idx + 1}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-blue-200/70">{item.text}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 self-center text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/70" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-xs font-medium text-blue-200/80">
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  System operational
                </span>
                <span className="font-mono text-[11px] text-white/50">· all AI modules ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ───────── Swipeable feature carousel ───────── */}
      <section className="min-w-0 max-w-full overflow-hidden">
        <div className="mb-5 flex min-w-0 items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Platform highlights
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Swipe through what makes NirnayAI different
            </h2>
          </div>
          <p className="hidden max-w-xs text-xs text-slate-400 md:block">
            Use <span className="kbd">←</span> <span className="kbd">→</span> keys, drag, or scroll — auto-plays every 5s.
          </p>
        </div>
        <FeatureCarousel />
        <div className="mt-4">
          <CarouselStrip />
        </div>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section className="min-w-0 max-w-full">
        <div className="glass-panel rounded-[1.5rem] px-6 py-5">
          <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Built for government-grade procurement
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
              <span className="inline-flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> CVC aligned
              </span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <LockKeyhole className="h-4 w-4 text-blue-600" /> Encrypted intake
              </span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <ScrollText className="h-4 w-4 text-amber-600" /> Full audit trail
              </span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <Gavel className="h-4 w-4 text-purple-600" /> Deterministic rules
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Features bento ───────── */}
      <section className="min-w-0 max-w-full">
        <div className="mb-6 flex min-w-0 flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              Platform
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Everything you need to evaluate tenders with trust
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            A complete workspace for procurement teams — from intake to decision, every step is transparent.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 md:grid-cols-6">
          {features.map((feature, i) => {
            const span = i === 0 ? "md:col-span-4" : i === 3 ? "md:col-span-4" : "md:col-span-2";
            const featured = i === 0 || i === 3;
            return (
              <Card
                key={feature.title}
                className={`group relative overflow-hidden border-slate-100 shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-government ${span} ${featured ? "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white" : "bg-white/70 hover:bg-white"}`}
              >
                {featured ? (
                  <>
                    <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-500/25 blur-3xl animate-pulse-slow" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-amber-400/15 blur-3xl" />
                  </>
                ) : null}
                <CardContent className="relative p-6">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      featured
                        ? "border border-white/15 bg-white/10"
                        : "bg-gradient-to-br from-blue-50 to-blue-100/50"
                    }`}
                  >
                    <feature.icon className={`h-5 w-5 ${featured ? "text-amber-300" : "text-blue-700"}`} />
                  </div>
                  <p className={`mt-5 text-lg font-bold ${featured ? "text-white" : "text-slate-950"}`}>
                    {feature.title}
                  </p>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      featured ? "text-blue-100/80" : "text-slate-500"
                    }`}
                  >
                    {feature.text}
                  </p>
                  {featured ? (
                    <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                      <span className="h-1 w-6 rounded-full bg-amber-300" /> Flagship capability
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="min-w-0 max-w-full">
        <div className="mb-6 flex min-w-0 flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
              <TimerReset className="h-3.5 w-3.5" />
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              From bid to verdict in four steps
            </h2>
          </div>
          <Button variant="outline" className="magnetic rounded-xl border-slate-200 bg-white/80 shadow-soft hover:shadow-government" asChild>
            <Link href="/upload" className="inline-flex items-center gap-2">
              Try it now <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="relative min-w-0">
          {/* connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block" />
          <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, i) => (
              <Card
                key={item.step}
                className="group relative overflow-hidden border-slate-100 bg-white/80 shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-1 hover:shadow-government"
              >
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[11px] font-black uppercase tracking-wider text-blue-700 shadow-government ring-4 ring-slate-50">
                      {item.step}
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                    </span>
                    {i < howItWorks.length - 1 ? (
                      <ArrowRight className="hidden h-5 w-5 text-slate-200 transition-colors duration-300 group-hover:text-blue-400 lg:block" />
                    ) : null}
                  </div>
                  <p className="mt-5 text-base font-bold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="min-w-0 max-w-full">
        <Card className="grain relative min-w-0 overflow-hidden border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white shadow-elevated">
          <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl animate-pulse-slow" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <CardContent className="relative flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-300 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                Ready to deploy · v2026
              </div>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Start evaluating your first tender in under <span className="text-amber-300">5 minutes</span>.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/80 md:text-base">
                No setup friction. Drop your tender PDF and vendor bids — the AI extracts criteria and the rule
                engine delivers verdicts with full evidence.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-100/70">
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> No credit card</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> On-prem ready</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-300" /> SSO compatible</span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <Button
                size="lg"
                className="magnetic rounded-xl bg-white text-slate-900 shadow-elevated hover:bg-blue-50"
                asChild
              >
                <Link href="/upload">
                  Start free evaluation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="magnetic rounded-xl border-white/30 bg-white/5 text-white shadow-soft backdrop-blur-sm hover:bg-white/15"
                asChild
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
