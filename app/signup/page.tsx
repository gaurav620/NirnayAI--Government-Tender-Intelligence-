import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Landmark, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Building2, text: "Department-ready workspace" },
  { icon: ShieldCheck, text: "Criteria and evidence governance" },
  { icon: CheckCircle2, text: "Backend API integration prepared" },
];

export default function SignupPage() {
  return (
    <div className="grid min-h-[720px] gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch animate-fade-in">
      {/* Left Panel - Form */}
      <Card className="glass-panel flex items-center border-slate-200/60 bg-white/85 shadow-elevated">
        <CardContent className="w-full p-8 md:p-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-soft">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Create procurement workspace
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-black text-slate-950 md:text-3xl">
                Start using NirnayAI for tender evaluation
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-2">
                Register your department account and prepare for secure AI-assisted bid review.
              </CardDescription>
            </CardHeader>
            <form className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="name">Full name</label>
                <input
                  id="name"
                  placeholder="Procurement Officer"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="department">Department</label>
                <input
                  id="department"
                  placeholder="Public Works"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">Official email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@department.gov.in"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="role">Role</label>
                <select
                  id="role"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option>Evaluation officer</option>
                  <option>Procurement admin</option>
                  <option>Review committee</option>
                </select>
              </div>
              <Button
                className="md:col-span-2 w-full rounded-xl shadow-glow transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-elevated"
                size="lg"
                type="button"
              >
                Create account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-700 hover:underline">Login</Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Info */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white shadow-elevated">
        <CardContent className="flex h-full flex-col justify-between p-8 md:p-10">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
              <Landmark className="h-6 w-6 text-amber-300" />
            </div>
            <h1 className="mt-8 text-3xl font-black tracking-tight md:text-4xl leading-tight">
              A trusted product for transparent procurement
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-200/70">
              Deploy a polished review layer across tender upload, AI criteria extraction,
              vendor evaluation, and source evidence validation.
            </p>
          </div>
          <div className="mt-10 space-y-2.5">
            {features.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.1]"
              >
                <item.icon className="h-4 w-4 text-amber-300 shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
