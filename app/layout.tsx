import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "NirnayAI | Explainable Tender Evaluation",
  description:
    "AI-powered government tender evaluation platform with traceable evidence, deterministic rule-engine decisions, and human-in-the-loop verification.",
  keywords: [
    "tender evaluation",
    "government procurement",
    "AI bid analysis",
    "explainable AI",
    "NirnayAI",
  ],
  authors: [{ name: "NirnayAI" }],
  openGraph: {
    title: "NirnayAI — Explainable Tender Evaluation",
    description:
      "Evaluate tenders with evidence, speed, and confidence. Every decision is traceable.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
