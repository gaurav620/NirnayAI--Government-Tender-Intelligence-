import Link from "next/link";
import { 
  Shield, 
  Lock, 
  User, 
  ArrowRight, 
  ChevronLeft,
  KeyRound,
  Fingerprint
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      {/* ─── Tricolor Top ─── */}
      <div className="gov-tricolor">
        <div className="saffron" />
        <div className="white" />
        <div className="green" />
      </div>

      {/* ─── Header ─── */}
      <header className="py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-[#003366] flex items-center justify-center text-white font-black text-xl border border-[#FF9933]">
              N
            </div>
            <div>
              <h1 className="text-lg font-black text-[#003366] tracking-tighter uppercase">
                NirnayAI
              </h1>
              <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">
                Secure Evaluation Portal
              </p>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#003366] transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* ─── Login Main ─── */}
      <main className="flex-1 flex items-center justify-center p-6 py-20 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#003366 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="w-full max-w-md relative z-10">
          <div className="gov-card shadow-md border-gray-200">
            <div className="gov-card-header notched px-6 py-5">
              <span className="text-[14px] font-black uppercase tracking-[0.2em]">Officer Login</span>
              <Shield className="h-5 w-5 text-white/50" />
            </div>
            
            <div className="p-8 bg-white">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter mb-2">Access Secure Environment</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Electronic Tender Scrutiny System (ETSS)
                </p>
              </div>

              <form className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Official Email ID / PIS</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                    <input 
                      type="email" 
                      placeholder="officer.name@crpf.gov.in"
                      className="w-full border-2 border-gray-100 bg-gray-50/50 px-11 py-3.5 text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-black text-[#003366] uppercase tracking-widest">Password</label>
                    <Link href="#" className="text-xs font-bold text-[#FF9933] uppercase hover:underline">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full border-2 border-gray-100 bg-gray-50/50 px-11 py-3.5 text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full bg-[#003366] text-white py-4 font-black text-xs uppercase tracking-[0.3em] hover:bg-[#002244] transition-all flex items-center justify-center gap-3 shadow-sm">
                    Authenticate <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-black text-gray-300 uppercase tracking-widest">Secure Options</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button type="button" className="border-2 border-gray-100 py-3 flex flex-col items-center gap-2 hover:border-[#003366] transition-all group">
                      <Fingerprint className="h-5 w-5 text-gray-300 group-hover:text-[#003366]" />
                      <span className="text-[10px] font-black text-gray-400 group-hover:text-[#003366] uppercase tracking-widest">Biometric</span>
                   </button>
                   <button type="button" className="border-2 border-gray-100 py-3 flex flex-col items-center gap-2 hover:border-[#003366] transition-all group">
                      <KeyRound className="h-5 w-5 text-gray-300 group-hover:text-[#003366]" />
                      <span className="text-[10px] font-black text-gray-400 group-hover:text-[#003366] uppercase tracking-widest">Digital Sign</span>
                   </button>
                </div>
              </form>

              <div className="mt-10 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Don't have an officer account? <Link href="/signup" className="text-[#003366] hover:underline">Enroll Now</Link>
                </p>
              </div>
            </div>
            
            {/* Warning Footer */}
            <div className="bg-red-50 border-t border-red-100 p-4">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-relaxed text-center">
                WARNING: Unauthorized access to this system is prohibited by the IT Act 2000. 
                Your IP and login attempts are being recorded.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            © 2026 NirnayAI Platform | Encryption Standard: AES-256 | Compliant with GFR 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
