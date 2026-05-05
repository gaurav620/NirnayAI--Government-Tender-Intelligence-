"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Gavel,
  Landmark,
  Lock,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type Slide = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  accent: string; // tailwind gradient classes
  glow: string;   // rgba shadow
  metric: { value: string; label: string };
  href: string;
  ctaLabel: string;
};

const SLIDES: Slide[] = [
  {
    id: "ai-extraction",
    kicker: "Core engine",
    title: "AI-powered criteria extraction",
    description:
      "Upload a 200-page tender PDF and get a clean checklist of mandatory criteria, thresholds, and verification rules in under 30 seconds.",
    icon: ScanSearch,
    accent: "from-blue-600 via-indigo-600 to-violet-600",
    glow: "shadow-[0_40px_80px_-20px_rgba(79,70,229,0.45)]",
    metric: { value: "92%", label: "Review time saved" },
    href: "/upload",
    ctaLabel: "Try extraction",
  },
  {
    id: "multi-officer",
    kicker: "New · this release",
    title: "Multi-officer review & sign-off",
    description:
      "Procurement, Legal, Finance and Technical officers can each sign a shared report. Lock it when consensus is reached — signatures frozen forever.",
    icon: Users,
    accent: "from-emerald-500 via-teal-600 to-cyan-600",
    glow: "shadow-[0_40px_80px_-20px_rgba(20,184,166,0.45)]",
    metric: { value: "4+", label: "Reviewer roles" },
    href: "/dashboard",
    ctaLabel: "Open dashboard",
  },
  {
    id: "audit",
    kicker: "Compliance",
    title: "Immutable audit timeline",
    description:
      "Every evaluation run, signature and lock event is timestamped and actor-tagged. Export-ready for CVC audits and CAG reviews.",
    icon: FileSignature,
    accent: "from-amber-500 via-orange-600 to-red-500",
    glow: "shadow-[0_40px_80px_-20px_rgba(234,88,12,0.45)]",
    metric: { value: "100%", label: "Action traceability" },
    href: "/dashboard",
    ctaLabel: "View audit log",
  },
  {
    id: "rule-engine",
    kicker: "Deterministic",
    title: "Transparent rule engine",
    description:
      "No black-box LLM verdicts. Every Eligible / Manual Review / Not Eligible outcome maps to explicit, testable rules with confidence scores.",
    icon: Gavel,
    accent: "from-purple-600 via-fuchsia-600 to-pink-600",
    glow: "shadow-[0_40px_80px_-20px_rgba(192,38,211,0.45)]",
    metric: { value: "0", label: "Hallucinated verdicts" },
    href: "/criteria",
    ctaLabel: "See criteria",
  },
  {
    id: "share",
    kicker: "Collaboration",
    title: "Shareable read-only reports",
    description:
      "Generate a secure tokenised link. Senior officers review signatures, evidence and verdicts from any device — no login friction.",
    icon: ArrowUpRight,
    accent: "from-slate-800 via-slate-900 to-black",
    glow: "shadow-[0_40px_80px_-20px_rgba(15,23,42,0.55)]",
    metric: { value: "1-click", label: "Secure sharing" },
    href: "/dashboard",
    ctaLabel: "Create report",
  },
];

export function FeatureCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - 8, behavior: "smooth" });
    }
  }, []);

  const next = useCallback(() => {
    setActive((i) => {
      const n = (i + 1) % SLIDES.length;
      return n;
    });
  }, []);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next, paused]);

  // Sync scroll -> active from programmatic changes
  useEffect(() => {
    scrollTo(active);
  }, [active, scrollTo]);

  // Observe current slide from user scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scroller = scrollerRef.current;
        if (!scroller) {
          ticking = false;
          return;
        }
        const center = scroller.scrollLeft + scroller.clientWidth / 2;
        let nearest = 0;
        let best = Number.POSITIVE_INFINITY;
        Array.from(scroller.children).forEach((child, i) => {
          const c = child as HTMLElement;
          const cCenter = c.offsetLeft + c.offsetWidth / 2;
          const d = Math.abs(cCenter - center);
          if (d < best) {
            best = d;
            nearest = i;
          }
        });
        setActive((cur) => (cur === nearest ? cur : nearest));
        ticking = false;
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target && (e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <section
      className="group/carousel relative min-w-0 max-w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent" />

      <div
        ref={scrollerRef}
        className="no-scrollbar flex min-w-0 max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pt-1"
        role="region"
        aria-label="Platform highlights carousel"
      >
        {SLIDES.map((slide, i) => (
          <SlideCard key={slide.id} slide={slide} isActive={i === active} />
        ))}
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              className={`group/dot relative h-1.5 overflow-hidden rounded-full bg-slate-200 transition-all duration-500 ${
                i === active ? "w-10 bg-slate-300" : "w-5 hover:w-8 hover:bg-slate-300"
              }`}
            >
              {i === active ? (
                <span
                  key={`${active}-${paused ? "paused" : "live"}`}
                  className={`absolute inset-0 origin-left bg-gradient-to-r ${s.accent} ${
                    paused ? "animate-none" : "animate-slide-progress"
                  }`}
                />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 sm:inline">
            {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:-translate-x-0.5 hover:bg-white hover:shadow-government"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:translate-x-0.5 hover:bg-white hover:shadow-government"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SlideCard({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  const Icon = slide.icon;
  return (
    <article
      className={`group/card relative flex min-h-[300px] w-full max-w-[780px] shrink-0 snap-start overflow-hidden rounded-[1.75rem] transition-all duration-700 ease-smooth ${
        isActive ? `scale-100 ${slide.glow}` : "scale-[0.97] opacity-80 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]"
      }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent}`} />
      {/* Grain overlay */}
      <div className="absolute inset-0 carousel-grain mix-blend-overlay opacity-[0.18]" />
      {/* Shine */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.08] to-white/0 opacity-70" />
      {/* Animated orb */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col justify-between gap-6 p-7 text-white md:p-9">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
              {slide.kicker}
            </span>
          </div>

          <h3 className="mt-5 max-w-2xl text-[1.65rem] font-black leading-[1.15] tracking-tight md:text-[2.1rem]">
            {slide.title}
          </h3>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-white/85 md:text-sm">
            {slide.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur">
              <Icon className="h-6 w-6 text-white drop-shadow" />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white/70 bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
            </div>
            <div>
              <p className="text-3xl font-black leading-none tracking-tight">{slide.metric.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
                {slide.metric.label}
              </p>
            </div>
          </div>

          <Link
            href={slide.href}
            className="group/cta inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-elevated transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)]"
          >
            {slide.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* Supplementary mini-stats strip that can be rendered alongside the carousel */
export function CarouselStrip() {
  const items = [
    { icon: Zap, label: "Live AI engine", value: "operational" },
    { icon: BarChart3, label: "Active runs", value: "3" },
    { icon: Lock, label: "Signed reports", value: "12" },
    { icon: TrendingUp, label: "Avg. decision time", value: "47s" },
    { icon: Landmark, label: "Ministries onboarded", value: "7" },
    { icon: Sparkles, label: "AI accuracy", value: "91.4%" },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-soft backdrop-blur">
      <div className="flex animate-marquee gap-10 whitespace-nowrap py-3.5 text-xs font-semibold text-slate-500">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <it.icon className="h-3.5 w-3.5 text-blue-700" />
            <span className="uppercase tracking-[0.14em]">{it.label}</span>
            <span className="font-mono text-slate-800">{it.value}</span>
            <span className="mx-4 inline-block h-1 w-1 rounded-full bg-slate-300" />
          </span>
        ))}
      </div>
    </div>
  );
}
