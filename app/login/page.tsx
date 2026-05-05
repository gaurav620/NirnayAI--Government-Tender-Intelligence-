import Link from "next/link";
import { ArrowRight, Landmark, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Role-based officer access",
  "Evidence trail preserved",
  "Human approval workflow",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-[680px] gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch animate-fade-in">
      {/* Left Panel */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white shadow-elevated">
        <CardContent className="flex h-full flex-col justify-between p-8 md:p-10">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
              <Landmark className="h-6 w-6 text-amber-300" />
            </div>
            <h1 className="mt-8 text-3xl font-black tracking-tight md:text-4xl leading-tight">Welcome back to NirnayAI</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-200/70">
              Access your secure tender evaluation workspace, continue criteria verification,
              and review evidence-backed vendor decisions.
            </p>
          </div>
          <div className="mt-10 space-y-2.5">
            {features.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.1]"
              >
                <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel */}
      <Card className="glass-panel flex items-center border-slate-200/60 bg-white/85 shadow-elevated">
        <CardContent className="w-full p-8 md:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-sm font-bold text-blue-800 shadow-soft">
              <LockKeyhole className="h-4 w-4 text-blue-600" />
              Secure officer login
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-black text-slate-950 md:text-3xl">Sign in to your account</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-2">Use your official email to access NirnayAI.</CardDescription>
            </CardHeader>
            <form className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="officer@gov.in"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 font-medium text-slate-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" /> Remember me
                </label>
                <Link href="/login" className="font-semibold text-blue-700 hover:underline">Forgot password?</Link>
              </div>
              <Button
                className="w-full rounded-xl shadow-glow transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-elevated"
                size="lg"
                type="button"
              >
                Login <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              New to NirnayAI?{" "}
              <Link href="/signup" className="font-bold text-blue-700 hover:underline">Create an account</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
