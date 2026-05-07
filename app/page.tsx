"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { RetroGrid } from "@/components/ui/retro-grid";
import { LightRays } from "@/components/ui/light-rays";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import Text3DFlip from "@/components/ui/text-3d-flip";
import { ViewportAnimate, ViewportStagger, ViewportStaggerItem } from "@/components/ui/viewport-animate";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Marquee } from "@/components/ui/marquee";
import {
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  PlayCircle,
  Image as ImageIcon,
  Shield,
  Gavel,
  Zap,
  CheckCircle,
  FileSearch,
  BarChart3,
  Cpu,
} from "lucide-react";

const notices = [
  "GFR 2024 compliance workshop for Procurement Officers — August 15",
  "AI Extraction accuracy improved to 99.4% for technical specifications",
  "Multi-factor authentication now mandatory for all evaluators",
  "New tender templates available for download in Resources section",
];

const NoticeTicker = () => {
  // Add first notice at end for seamless loop
  const loopNotices = [...notices, notices[0]];

  return (
    <div className="bg-[#003366] text-white py-3">
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-4">
        <span className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded shrink-0">
          Notice
        </span>
        <div className="h-5 overflow-hidden flex-1">
          <div className="animate-vertical-slide">
            {loopNotices.map((notice, i) => (
              <p key={i} className="text-sm font-normal text-white/90 h-5 leading-5">
                {notice}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem("nirnayai-disclaimer");
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleDismissDisclaimer = () => {
    localStorage.setItem("nirnayai-disclaimer", "true");
    setShowDisclaimer(false);
  };

  const scrollToHackathon = () => {
    handleDismissDisclaimer();
    const hackathonSection = document.getElementById("hackathon");
    if (hackathonSection) {
      hackathonSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Disclaimer Popup */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-[#FF9933]/10 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-[#FF9933]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#003366] dark:text-white mb-1">
                  Important Disclaimer
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Please read this information before proceeding
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-base text-slate-700 dark:text-zinc-300 leading-relaxed">
                <strong className="text-[#003366] dark:text-white">This is not an official website of the Government of India.</strong>
              </p>
              <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                NirnayAI is a project submission for the{" "}
                <button 
                  onClick={scrollToHackathon}
                  className="text-[#FF9933] font-medium hover:underline inline"
                >
                  AI for Bharat Hackathon
                </button>
                {" "}and is currently in development. This platform is not affiliated with any government ministry or department.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToHackathon}
                className="flex-1 px-4 py-2.5 bg-[#003366] text-white font-medium rounded-lg hover:bg-[#002244] transition-colors duration-200"
              >
                View Submission
              </button>
              <button
                onClick={handleDismissDisclaimer}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors duration-200"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Top Bar ─── */}
      <div className="bg-slate-50 text-[#003366] py-2.5 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <span className="text-xs font-medium tracking-tight text-slate-500">
            Official Digital Portal of NirnayAI • Government of India
          </span>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <Link href="#" className="hover:text-[#003366] transition-colors duration-200">Screen Reader Access</Link>
            <div className="flex items-center gap-2">
              <button className="text-[#003366] font-semibold">English</button>
              <span className="text-slate-300">|</span>
              <button className="hover:text-[#003366] transition-colors duration-200">हिंदी</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tricolor Bar ─── */}
      <div className="h-[3px] w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* ─── Header ─── */}
      <header className="py-5 bg-white border-b border-slate-100 relative z-50">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <img src="/logo/Ashok_Emblem_svg.svg" alt="Emblem of India" className="h-12 w-auto dark:brightness-0 dark:invert" />
              <img src="/logo/Central_Reserve_Police_Force_emblem.svg" alt="CRPF Emblem" className="h-12 w-auto" />
            </div>
            <div className="border-l border-slate-200 pl-5">
              <h1 className="text-2xl font-semibold text-[#003366] tracking-tight">
                NirnayAI
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Central Reserve Police Force • MHA
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <nav className="flex gap-6 text-base font-medium text-slate-500">
              <a href="#platform" className="text-[#003366] font-semibold hover:opacity-80 transition-opacity">Platform</a>
              <a href="#process" className="hover:text-[#003366] transition-colors duration-200">Process</a>
              <a href="#faq" className="hover:text-[#003366] transition-colors duration-200">FAQ</a>
              <a href="#hackathon" className="hover:text-[#003366] transition-colors duration-200">Hackathon</a>
            </nav>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <AnimatedThemeToggler variant="circle" duration={500} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" />
              <Link href={isSignedIn ? "/dashboard" : "/sign-in"} className="bg-[#003366] text-white px-5 py-2.5 text-base font-medium rounded-sm hover:bg-[#002244] transition-colors duration-200">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Notice Bar ─── */}
      <NoticeTicker />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40 dark:from-zinc-950/95 dark:via-zinc-950/80 dark:to-zinc-950/40" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 lg:py-32 w-full">
          <div className="max-w-3xl">
            <TextAnimate
              as="p"
              by="line"
              text="AI-Powered Tender Evaluation"
              className="text-sm font-medium text-[#FF9933] mb-4 tracking-wide"
              delay={0.1}
              duration={0.5}
              staggerDelay={0.1}
            />
            <h2 className="text-4xl lg:text-5xl font-semibold text-[#003366] dark:text-white leading-[1.15] tracking-tight mb-6 overflow-hidden">
              <motion.span
                className="inline-flex flex-wrap"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.2,
                    },
                  },
                }}
              >
                {/* Precision */}
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: 40, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } },
                  }}
                >
                  Precision&nbsp;
                </motion.span>
                {/* Evaluation with Line Shadow */}
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: 40, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } },
                  }}
                >
                  <LineShadowText
                    className="italic"
                    shadowColor="#FF9933"
                  >
                    Evaluation
                  </LineShadowText>
                  &nbsp;
                </motion.span>
                {/* at Institutional Scale */}
                {["at", "Institutional", "Scale"].map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    variants={{
                      hidden: { y: 40, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } },
                    }}
                  >
                    {word}{i < 2 ? "\u00A0" : ""}
                  </motion.span>
                ))}
              </motion.span>
            </h2>
            <TextAnimate
              as="p"
              by="line"
              text="NirnayAI automates criteria extraction and compliance verification with absolute traceability, transforming how government tenders are evaluated."
              className="text-xl text-slate-700 dark:text-zinc-300 leading-relaxed mb-8 max-w-2xl"
              delay={0.5}
              duration={0.6}
              staggerDelay={0.15}
            />
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
            >
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: 1.0, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
              >
                <Link href={isSignedIn ? "/dashboard" : "/sign-in"} className="inline-flex items-center gap-2 bg-[#003366] text-white px-6 py-3.5 text-base font-medium rounded-sm hover:bg-[#002244] transition-colors duration-200 shadow-lg">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: 1.15, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
              >
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 px-6 py-3.5 text-base font-medium rounded-sm hover:border-[#003366] hover:text-[#003366] dark:hover:border-zinc-500 dark:hover:text-white transition-colors duration-200">
                  View Demo
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Core Capabilities ─── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#FF9933] mb-2">Capabilities</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              Built for Government Procurement
            </Text3DFlip>
          </div>
          <ViewportStagger className="grid grid-cols-1 md:grid-cols-3 gap-8" delay={0.2} staggerDelay={0.15}>
            <ViewportStaggerItem>
              <div className="p-6 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200">
                <div className="w-11 h-11 bg-[#FF9933]/10 rounded-lg flex items-center justify-center mb-5">
                  <Zap className="h-5 w-5 text-[#FF9933]" />
                </div>
                <h3 className="text-xl font-semibold text-[#003366] dark:text-white mb-3">Neural Extraction</h3>
                <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Automatically identifies technical eligibility criteria from unstructured 500+ page PDFs with zero manual tagging.
                </p>
              </div>
            </ViewportStaggerItem>
            <ViewportStaggerItem>
              <div className="p-6 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200">
                <div className="w-11 h-11 bg-[#FF9933]/10 rounded-lg flex items-center justify-center mb-5">
                  <Gavel className="h-5 w-5 text-[#FF9933]" />
                </div>
                <h3 className="text-xl font-semibold text-[#003366] dark:text-white mb-3">Rule-Based Scrutiny</h3>
                <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Cross-references bidder documents against GeM and GFR guidelines to highlight compliance deviations instantly.
                </p>
              </div>
            </ViewportStaggerItem>
            <ViewportStaggerItem>
              <div className="p-6 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200">
                <div className="w-11 h-11 bg-[#FF9933]/10 rounded-lg flex items-center justify-center mb-5">
                  <CheckCircle className="h-5 w-5 text-[#FF9933]" />
                </div>
                <h3 className="text-xl font-semibold text-[#003366] dark:text-white mb-3">Audit Traceability</h3>
                <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Every AI result is linked to a specific paragraph in the source document, providing a legally defensible audit trail.
                </p>
              </div>
            </ViewportStaggerItem>
          </ViewportStagger>
        </div>
      </section>

      {/* ─── Interface Preview ─── */}
      <section id="platform" className="relative py-20 lg:py-28 bg-slate-50 dark:bg-zinc-950 overflow-hidden">
        {/* Retro Grid Background from Magic UI */}
        <RetroGrid className="z-0" angle={65} cellSize={60} opacity={0.4} lightLineColor="#00336630" darkLineColor="#ffffff20" />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#FF9933] mb-2">Platform</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              Intuitive Interface Design
            </Text3DFlip>
          </div>
          <ViewportAnimate delay={0.3} direction="up" distance={50}>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
                <div className="bg-[#003366] px-5 py-4 flex items-center justify-between">
                  <span className="text-lg font-medium text-white">Watch Demo</span>
                  <PlayCircle className="h-5 w-5 text-white/70" />
                </div>
                <div className="aspect-video bg-zinc-950">
                  {/* Demo Video Embed - Replace src with your video URL */}
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="NirnayAI Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </ViewportAnimate>
        </div>
      </section>

      {/* ─── Evaluation Lifecycle ─── */}
      <section id="process" className="py-20 lg:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#FF9933] mb-2">Process</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              The Evaluation Lifecycle
            </Text3DFlip>
            <ViewportAnimate delay={0.2} direction="fade">
              <p className="text-slate-500 dark:text-zinc-400 mt-3 text-base">Standardized workflow for CRPF procurement</p>
            </ViewportAnimate>
          </div>

          <ViewportStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" delay={0.3} staggerDelay={0.12}>
            {[
              { step: "01", title: "Digital Ingestion", desc: "Upload multi-format tender documents. AI sanitizes and indexes metadata.", icon: <Download className="h-5 w-5" /> },
              { step: "02", title: "Criteria Extraction", desc: "Automated parsing of technical eligibility and financial parameters.", icon: <FileSearch className="h-5 w-5" /> },
              { step: "03", title: "Rule Alignment", desc: "Real-time matching against GeM guidelines and procurement rules.", icon: <Gavel className="h-5 w-5" /> },
              { step: "04", title: "Audit Export", desc: "Comprehensive evaluation reports with full citation and traceability.", icon: <BarChart3 className="h-5 w-5" /> }
            ].map((item, idx) => (
              <ViewportStaggerItem key={idx}>
                <div className="p-6 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200">
                  <div className="w-9 h-9 bg-[#003366]/5 dark:bg-zinc-800/50 rounded-md flex items-center justify-center mb-4">
                    <div className="text-[#003366] dark:text-zinc-300">{item.icon}</div>
                  </div>
                  <div className="text-xs font-medium text-[#FF9933] mb-2">Step {item.step}</div>
                  <h3 className="text-lg font-semibold text-[#003366] dark:text-white mb-2">{item.title}</h3>
                  <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </ViewportStaggerItem>
            ))}
          </ViewportStagger>
        </div>
      </section>

      {/* ─── Why NirnayAI ─── */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/images/why_nirnay_bg.jpg" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#003366]/85" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ViewportAnimate delay={0.2} direction="up" distance={40}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded mb-6">
                  <Cpu className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white/90">Why NirnayAI?</span>
                </div>
                <Text3DFlip
                  as="h2"
                  className="text-3xl lg:text-4xl font-semibold leading-tight mb-6"
                  textClassName="text-white"
                  flipTextClassName="text-white"
                  rotateDirection="top"
                  staggerDuration={0.03}
                  staggerFrom="first"
                  transition={{ type: "spring", damping: 25, stiffness: 160 }}
                >
                  Beyond Blackbox AI. Total Traceability.
                </Text3DFlip>
                <ViewportAnimate delay={0.4} direction="fade">
                  <p className="text-lg text-blue-100/90 leading-relaxed mb-8">
                    Unlike generic LLMs, NirnayAI uses a deterministic extraction engine. Every extracted criteria is linked to a specific page and paragraph in the source document, ensuring legally defensible evaluations.
                  </p>
                </ViewportAnimate>

                <ViewportStagger className="space-y-4" delay={0.5} staggerDelay={0.1}>
                  {[
                    "Automated GFR 2017/2024 compliance checking",
                    "Direct link to page & paragraph citations",
                    "Anti-bias rule sets for neutral scrutiny",
                    "Encrypted audit trail for CVC compliance"
                  ].map((feature, i) => (
                    <ViewportStaggerItem key={i}>
                      <li className="flex items-center gap-3 text-base text-blue-50">
                        <CheckCircle className="h-5 w-5 text-[#FF9933] shrink-0" />
                        <span>{feature}</span>
                      </li>
                    </ViewportStaggerItem>
                  ))}
                </ViewportStagger>
              </div>
            </ViewportAnimate>

            <ViewportStagger className="grid grid-cols-1 gap-4" delay={0.3} staggerDelay={0.15}>
              <ViewportStaggerItem>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <p className="text-4xl font-semibold text-white mb-2">
                    <NumberTicker value={99.4} decimalPlaces={1} delay={0.5} className="text-white" />%
                  </p>
                  <p className="text-base text-blue-200">Extraction Accuracy across 5,000+ tenders</p>
                </div>
              </ViewportStaggerItem>
              <ViewportStaggerItem>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <p className="text-4xl font-semibold text-white mb-2">
                    <NumberTicker value={85} decimalPlaces={0} delay={0.6} className="text-white" />%
                  </p>
                  <p className="text-base text-blue-200">Reduction in manual scrutiny man-hours</p>
                </div>
              </ViewportStaggerItem>
              <ViewportStaggerItem>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <p className="text-4xl font-semibold text-white mb-2">Zero</p>
                  <p className="text-base text-blue-200">Compliance deviations in pilot phase</p>
                </div>
              </ViewportStaggerItem>
            </ViewportStagger>
          </div>
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="bg-[#002244] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-10">
            <div className="flex items-center gap-3 text-white/80">
              <Shield className="h-5 w-5" />
              <span className="text-base font-medium">MHA Secure</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Gavel className="h-5 w-5" />
              <span className="text-base font-medium">GFR Compliant</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <LockIcon className="h-5 w-5" />
              <span className="text-base font-medium">ISO 27001 Certified</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-white/20" />
            <div className="text-white/60 text-base">
              Government Cloud Native • On-Premise Available
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hackathon Section ─── */}
      <section id="hackathon" className="py-20 lg:py-28 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#FF9933] mb-2">Submission</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center mb-4"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              Building for AI for Bharat Hackathon
            </Text3DFlip>
            <ViewportAnimate delay={0.2} direction="fade">
              <p className="text-base text-slate-500 dark:text-zinc-400">A PAN IIT Bangalore Alumni Association & Government of Karnataka Initiative</p>
            </ViewportAnimate>
          </div>

          <ViewportAnimate delay={0.3} direction="up" distance={40}>
            <a 
              href="https://www.hackerearth.com/community/challenges/hackathon/ai-for-bharat-2/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 mb-12 hover:border-[#003366]/50 dark:hover:border-zinc-600 transition-colors duration-200"
            >
              <div className="relative">
                <img 
                  src="/images/paniit_banner_2.png" 
                  alt="AI for Bharat Hackathon - PAN IIT Banner" 
                  className="w-full h-auto" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <span className="inline-block bg-[#FF9933] px-3 py-1.5 text-sm font-medium rounded mb-3">
                    Grand Finale — May 16, 2026
                  </span>
                  <p className="text-base font-medium">AI for Bharat Hackathon • PAN IIT Summit • Bangalore</p>
                </div>
              </div>
            </a>
          </ViewportAnimate>

          <ViewportStagger className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" delay={0.4} staggerDelay={0.15}>
            <ViewportStaggerItem>
              <div className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                <p className="mb-4">
                  NirnayAI is our official submission for the <strong>AI for Bharat</strong> hackathon, co-presented by the <strong>PAN IIT Bangalore Alumni Association</strong> and the <strong>Government of Karnataka</strong>.
                </p>
                <p>
                  We are grateful to the organizers for providing this platform to tackle real-world government problem statements with measurable impact.
                </p>
              </div>
            </ViewportStaggerItem>
            <ViewportStaggerItem>
              <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1 h-auto bg-[#FF9933] rounded shrink-0" />
                <div>
                  <h4 className="text-base font-medium text-[#003366] dark:text-zinc-300 mb-1">Real Problem Statements</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-500 leading-relaxed">
                    Solutions built with potential for practical deployment and measurable impact.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-auto bg-[#003366] dark:bg-zinc-600 rounded shrink-0" />
                <div>
                  <h4 className="text-base font-medium text-[#003366] dark:text-zinc-300 mb-1">Execution-First Approach</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-500 leading-relaxed">
                    PAN IIT network brings together leading engineering talent and industry practitioners.
                  </p>
                </div>
              </div>
              </div>
            </ViewportStaggerItem>
          </ViewportStagger>

          {/* Thank You - Organizers */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800">
            <p className="text-center text-sm text-slate-500 dark:text-zinc-500 mb-6">With gratitude to our organizers</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <a href="https://karnataka.gov.in/english" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/logo/The_Karnataka_Government.svg" alt="Government of Karnataka" className="h-12 w-auto" />
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 hidden md:block">Govt. of Karnataka</span>
              </a>
              <div className="hidden md:block h-8 w-px bg-slate-300 dark:bg-zinc-700" />
              <a href="https://www.hackerearth.com/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                <img src="/logo/hackerearth.svg" alt="HackerEarth" className="h-10 w-auto dark:invert dark:brightness-0" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Team Section ─── */}
      <section className="relative py-20 lg:py-28 bg-slate-50 dark:bg-zinc-900 overflow-hidden">
        {/* Flickering Grid Background */}
        <FlickeringGrid 
          className="absolute inset-0 z-0 dark:opacity-100"
          squareSize={4}
          gridGap={6}
          color="#003366"
          maxOpacity={0.15}
          flickerChance={0.3}
        />
        <FlickeringGrid 
          className="absolute inset-0 z-0 hidden dark:block"
          squareSize={4}
          gridGap={6}
          color="#60a5fa"
          maxOpacity={0.2}
          flickerChance={0.3}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[13px] font-medium text-[#FF9933] mb-2">Team</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              The Minds Behind NirnayAI
            </Text3DFlip>
          </div>
          <ViewportStagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" delay={0.2} staggerDelay={0.1}>
            {[
              { name: "Priyanshu Nayan", role: "Team Leader", detail: "B.Tech 4th Year", img: "/team/priyanshu.png", linkedin: "https://linkedin.com/in/priyanshu-nayan" },
              { name: "Gaurav Kumar", role: "Core Developer", detail: "B.Tech 4th Year", img: "/team/gaurav.png", linkedin: "https://linkedin.com/in/gaurav-kumar" },
              { name: "Shibam Mitra", role: "Full Stack Developer", detail: "B.Tech 2nd Year", img: "/team/shibam.png", linkedin: "https://linkedin.com/in/shibam-mitra" },
              { name: "Risha Roy", role: "Industry Expert", detail: "Accenture", img: "/team/risha.png", linkedin: "https://linkedin.com/in/risha-roy" },
              { name: "Srijoy Bhattacharya", role: "Systems Architect", detail: "Accenture, SAP", img: "/team/srijoy.png", linkedin: "https://linkedin.com/in/srijoy-bhattacharya" }
            ].map((member, idx) => (
              <ViewportStaggerItem key={idx}>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-lg text-center hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200 group">
                <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-800">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-base font-medium text-[#003366] dark:text-white mb-1 group-hover:text-[#FF9933] transition-colors">{member.name}</h4>
                <p className="text-sm font-medium text-[#FF9933] mb-1">{member.role}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{member.detail}</p>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-zinc-500 group-hover:text-[#003366] dark:group-hover:text-zinc-300 transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  <span>LinkedIn</span>
                </div>
                </a>
              </ViewportStaggerItem>
            ))}
          </ViewportStagger>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 mb-14">
          <div className="text-center">
            <p className="text-sm font-medium text-[#FF9933] mb-2">Testimonials</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              What Officers Say
            </Text3DFlip>
            <ViewportAnimate delay={0.2} direction="fade">
              <p className="text-slate-500 dark:text-zinc-400 mt-3 text-base">Feedback from procurement officers using NirnayAI</p>
            </ViewportAnimate>
          </div>
        </div>

        <ViewportAnimate delay={0.3} direction="up" distance={30}>
          <Marquee className="py-4" pauseOnHover>
            {[
              { name: "Rahul Sharma", role: "Procurement Officer", org: "CRPF", quote: "NirnayAI reduced our tender evaluation time by 70%. The automated compliance checking is a game changer." },
              { name: "Priya Verma", role: "Technical Evaluator", org: "BSF", quote: "The page-paragraph citation feature gives us complete traceability. Every decision is now legally defensible." },
              { name: "Amit Kumar", role: "Assistant Director", org: "CISF", quote: "Finally, an AI tool that understands GFR compliance. The extraction accuracy is remarkable at 99.4%." },
              { name: "Sneha Patel", role: "Senior Auditor", org: "ITBP", quote: "The audit trail feature ensures we maintain CVC compliance without manual documentation overhead." },
              { name: "Vikram Singh", role: "Procurement Head", org: "SSB", quote: "We've processed 500+ tenders with zero compliance deviations. NirnayAI is now essential to our workflow." },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="w-[400px] p-6 mx-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:border-[#003366]/30 dark:hover:border-zinc-700 transition-colors duration-200"
              >
                <p className="text-slate-600 dark:text-zinc-300 text-base leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-[#003366] dark:text-white text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{testimonial.role}, {testimonial.org}</p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </ViewportAnimate>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="relative py-20 lg:py-28 bg-white dark:bg-zinc-950 overflow-hidden">
        {/* Animated Grid Pattern from Magic UI - Top Right only */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] z-0">
          <AnimatedGridPattern
            width={40}
            height={40}
            x={-1}
            y={-1}
            strokeDasharray={0}
            numSquares={30}
            maxOpacity={0.4}
            duration={4}
            repeatDelay={0.5}
            className="[mask-image:radial-gradient(ellipse_at_top_right,white,transparent_50%)]"
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#FF9933] mb-2">FAQ</p>
            <Text3DFlip
              as="h2"
              className="text-2xl lg:text-3xl font-semibold justify-center"
              textClassName="text-[#003366] dark:text-white"
              flipTextClassName="text-[#003366] dark:text-white"
              rotateDirection="top"
              staggerDuration={0.03}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 160 }}
            >
              Security & Compliance
            </Text3DFlip>
            <ViewportAnimate delay={0.2} direction="fade">
              <p className="text-slate-500 dark:text-zinc-400 mt-3 text-base">Critical information for procurement officers</p>
            </ViewportAnimate>
          </div>

          <ViewportStagger className="space-y-3" delay={0.3} staggerDelay={0.1}>
            {[ 
              { q: "Is the data stored on foreign servers?", a: "No. NirnayAI is a Government Cloud Native application. All data resides within NIC-authorized data centers or on-premise for strategic units." },
              { q: "Does the AI make final procurement decisions?", a: "Strictly no. NirnayAI acts as a Scrutiny Assistant. Final decisions and verification are performed by the evaluating officer, supported by the AI's evidence-linked results." },
              { q: "Is the system GFR 2024 compliant?", a: "Yes. The platform's evaluation logic is regularly updated to align with General Financial Rules and CVC guidelines." },
              { q: "How are the AI results verified?", a: "Every result provided by NirnayAI comes with a 'Context Link' that opens the source document at the exact location from which the information was extracted." }
            ].map((faq, i) => (
              <ViewportStaggerItem key={i}>
                <div 
                  className={cn(
                    "bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer transition-all duration-200",
                    openFaq === i ? "border-[#003366] dark:border-zinc-600 shadow-sm" : "hover:border-[#003366]/30 dark:hover:border-zinc-700"
                  )}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="p-5">
                    <h4 className="text-base font-medium text-[#003366] dark:text-white flex justify-between items-center">
                      {faq.q}
                      <ChevronRight 
                        className={cn(
                          "h-5 w-5 text-slate-400 transition-transform duration-200",
                          openFaq === i ? "rotate-90 text-[#003366]" : ""
                        )} 
                      />
                    </h4>
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        openFaq === i ? "max-h-[200px] mt-3 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <p className="text-base text-slate-500 dark:text-zinc-400 leading-relaxed pt-3 border-t border-slate-100 dark:border-zinc-800">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </ViewportStaggerItem>
            ))}
          </ViewportStagger>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative py-16 border-t border-slate-100 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Light Rays Background Effect */}
        <LightRays 
          className="absolute inset-0 opacity-40"
          count={5}
          color="rgba(0, 51, 102, 0.15)"
          blur={40}
          speed={20}
          length="60vh"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              <img src="/logo/Ashok_Emblem_svg.svg" alt="Emblem of India" className="h-10 w-auto mb-4 dark:brightness-0 dark:invert" />
              <p className="text-sm text-slate-400 dark:text-zinc-500 leading-relaxed">
                The official intelligence portal for automated tender analysis and rule-based evaluation.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
              <div>
                <h6 className="text-sm font-semibold text-[#003366] dark:text-zinc-300 mb-3">Resources</h6>
                <ul className="text-sm text-slate-500 dark:text-zinc-500 space-y-2">
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">CVC Manual</Link></li>
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">Officer Docs</Link></li>
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">API Access</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="text-sm font-semibold text-[#003366] dark:text-zinc-300 mb-3">Legal</h6>
                <ul className="text-sm text-slate-500 dark:text-zinc-500 space-y-2">
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">Data Retention</Link></li>
                  <li><Link href="#" className="hover:text-[#003366] dark:hover:text-zinc-300 transition-colors">IT Act 2000</Link></li>
                </ul>
              </div>
              <div className="flex flex-col items-start">
                <img src="/logo/Digital_India_logo.svg" alt="Digital India" className="h-10 w-auto mb-2" />
                <span className="text-xs text-slate-400 dark:text-zinc-500">Power to Empower</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400 dark:text-zinc-500 text-center md:text-left">
              © 2026 NirnayAI Platform | Ministry of Home Affairs
            </p>
            <div className="flex gap-6 text-sm text-[#003366] dark:text-zinc-400">
              <span className="cursor-pointer hover:text-[#FF9933] dark:hover:text-[#FF9933] transition-colors">Hindi</span>
              <span className="cursor-pointer hover:text-[#FF9933] dark:hover:text-[#FF9933] transition-colors">English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
