"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { RetroGrid } from "@/components/ui/retro-grid";

export default function SignInPage() {
  // Force light mode on this page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ─── Left Side: Form ─── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white h-full overflow-hidden">
        {/* Top bar with back button */}
        <div className="flex items-center justify-start px-8 lg:px-12 py-5 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#003366] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Form container - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-8 lg:px-12 py-8">
            <div className="w-full max-w-[400px]">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "mx-auto w-full",

                    // Card with padding
                    card: "shadow-none border border-slate-200 bg-white p-6 rounded-xl",

                    // Header
                    headerTitle:
                      "text-[#003366] font-semibold text-2xl tracking-tight mb-1 text-center",
                    headerSubtitle:
                      "text-slate-500 text-sm text-center",

                    // Social buttons
                    socialButtonsBlockButton:
                      "!rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors h-11 w-full",
                    socialButtonsBlockButtonText:
                      "text-slate-700 font-medium text-sm",
                    socialButtons: "gap-3 mt-4",

                    // Divider
                    dividerLine: "bg-slate-200",
                    dividerText:
                      "text-slate-400 text-xs font-medium px-2",
                    dividerRow: "my-4",

                    // Fields
                    formFieldLabel:
                      "text-sm font-medium text-slate-700 mb-1.5 block",
                    formFieldInput:
                      "border border-slate-200 !rounded-lg focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 bg-white text-slate-900 placeholder:text-slate-400 transition-all h-11 px-4 w-full text-sm",
                    formFieldRow: "mb-4",
                    formFieldInputShowPasswordButton:
                      "text-slate-400 hover:text-slate-600",

                    // Errors / success / info
                    formFieldErrorText:
                      "text-red-500 text-xs mt-1",
                    formFieldSuccessText:
                      "text-green-600 text-xs mt-1",
                    formFieldInfoText:
                      "text-slate-500 text-xs mt-1",
                    formFieldWarningText:
                      "text-amber-600 text-xs mt-1",

                    // Global error alert
                    alert: "rounded-lg border border-red-200 bg-red-50 px-4 py-3",
                    alertText: "text-red-600 text-sm",

                    // Primary CTA
                    formButtonPrimary:
                      "bg-[#003366] hover:bg-[#002244] !rounded-lg font-medium text-sm h-11 transition-colors w-full text-white shadow-sm",
                    formButtonRow: "mt-5",

                    // Alternative methods
                    alternativeMethodsBlockButton:
                      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 !rounded-lg h-11 text-sm font-medium transition-colors w-full",

                    // Footer links
                    footerActionLink:
                      "text-[#003366] font-medium hover:underline text-sm",
                    footerActionText: "text-slate-500 text-sm",
                    footer: "pt-2 pb-0",

                    // Identity preview
                    identityPreviewEditButton:
                      "text-[#003366] text-sm font-medium",
                    identityPreviewText:
                      "text-slate-700 text-sm",

                    // OTP input
                    otpCodeFieldInput:
                      "!h-11 !rounded-lg bg-white border-slate-200 text-slate-900 focus:border-[#003366] transition-all",

                    // Resend code
                    formResendCodeLink:
                      "text-[#003366] font-medium text-sm",

                    // Layout helpers - add internal spacing
                    main: "gap-5",
                    form: "gap-4",
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    showOptionalFields: true,
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 lg:px-12 py-4 text-center flex-shrink-0 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Protected by AES-256 Encryption • GFR 2024 Compliant
          </p>
        </div>
      </div>

      {/* ─── Right Side: Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#003366] relative overflow-hidden items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0">
          <RetroGrid
            className="opacity-20"
            angle={65}
            cellSize={60}
            opacity={0.3}
            lightLineColor="#ffffff30"
            darkLineColor="#ffffff20"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#002244] to-[#001a33]" />

        {/* Decorative glassmorphism circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#FF9933]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-32 h-32 bg-[#FF9933]/20 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-semibold text-xl border border-white/20 rounded-lg">
              N
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">
              NirnayAI
            </span>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-semibold text-white mb-4 leading-tight">
            AI-Powered Tender Evaluation
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Transform government procurement with intelligent document analysis
            and GFR 2024 compliance
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-semibold text-[#FF9933]">99.4%</div>
              <div className="text-xs text-white/60 mt-1">Extraction Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#FF9933]">70%</div>
              <div className="text-xs text-white/60 mt-1">Time Saved</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#FF9933]">100%</div>
              <div className="text-xs text-white/60 mt-1">GFR Compliant</div>
            </div>
          </div>
        </div>

        {/* Bottom corner accent */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-xs text-white/40">
            Experiencing issues?
            <br />
            Contact support@nirnayai.gov.in
          </p>
        </div>
      </div>
    </div>
  );
}