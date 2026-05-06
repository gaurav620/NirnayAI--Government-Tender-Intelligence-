import Link from "next/link";
import { 
  Shield, 
  User, 
  ArrowRight, 
  ChevronLeft,
  Building,
  Mail,
  BadgeCheck,
  ShieldAlert
} from "lucide-react";

export default function SignupPage() {
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
          <Link href="/login" className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#003366] transition-colors">
            Already Enrolled? Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* ─── Signup Main ─── */}
      <main className="flex-1 flex items-center justify-center p-6 py-20 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#003366 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="w-full max-w-2xl relative z-10">
          <div className="gov-card shadow-md border-gray-200">
            <div className="gov-card-header notched px-6 py-5">
              <span className="text-[14px] font-black uppercase tracking-[0.2em]">Officer Enrollment</span>
              <BadgeCheck className="h-5 w-5 text-white/50" />
            </div>
            
            <div className="p-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Left Side: Form */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter mb-2">Request Access</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">
                      Only for verified government procurement officers
                    </p>
                  </div>

                  <form className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Full Name (As per Records)</label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                        <input 
                          type="text" 
                          placeholder="Sh. R.K. Sharma"
                          className="w-full border-2 border-gray-100 bg-gray-50/50 px-11 py-3.5 text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Government Email ID (.gov.in / .nic.in)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                        <input 
                          type="email" 
                          placeholder="rksharma.crpf@gov.in"
                          className="w-full border-2 border-gray-100 bg-gray-50/50 px-11 py-3.5 text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#003366] uppercase tracking-widest mb-2">Department / Wing</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                        <select className="w-full border-2 border-gray-100 bg-gray-50/50 px-11 py-3.5 text-sm focus:outline-none focus:border-[#003366] focus:bg-white transition-all font-medium appearance-none">
                          <option>CRPF - Procurement Wing</option>
                          <option>MHA - Strategic Affairs</option>
                          <option>CVC - Audit Division</option>
                          <option>B S F - Logistics</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button className="w-full bg-[#003366] text-white py-4 font-black text-xs uppercase tracking-[0.3em] hover:bg-[#002244] transition-all flex items-center justify-center gap-3 shadow-sm">
                        Submit Enrollment <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Side: Information */}
                <div className="bg-gray-50 border border-gray-100 p-8">
                   <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-6 border-b border-gray-200 pb-4">Verification Process</h3>
                   
                   <ul className="space-y-6">
                     <li className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-[#003366] flex items-center justify-center text-xs font-black">01</div>
                        <div>
                          <p className="text-xs font-black text-[#003366] uppercase tracking-wide mb-1">Email Validation</p>
                          <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                            An OTP will be sent to your official government email for primary identification.
                          </p>
                        </div>
                     </li>
                     <li className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-[#003366] flex items-center justify-center text-xs font-black">02</div>
                        <div>
                          <p className="text-xs font-black text-[#003366] uppercase tracking-wide mb-1">Authority Approval</p>
                          <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                            Your enrollment request will be routed to your respective Nodal Officer for manual approval.
                          </p>
                        </div>
                     </li>
                     <li className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-[#003366] flex items-center justify-center text-xs font-black">03</div>
                        <div>
                          <p className="text-xs font-black text-[#003366] uppercase tracking-wide mb-1">Onboarding</p>
                          <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                            Once approved, you will receive your Digital Signature Key (DSK) credentials via secure channel.
                          </p>
                        </div>
                     </li>
                   </ul>

                   <div className="mt-12 p-4 bg-amber-50 border border-amber-100 flex gap-4">
                      <ShieldAlert className="h-6 w-6 text-amber-600 flex-shrink-0" />
                      <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
                         Note: Vendor enrollment is managed via the Public Procurement Portal. This interface is for internal evaluating officers only.
                      </p>
                   </div>
                </div>

              </div>
            </div>
            
            {/* Warning Footer */}
            <div className="bg-red-50 border-t border-red-100 p-4">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-relaxed text-center">
                All enrollment requests are subject to verification under GFR guidelines.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            © 2026 NirnayAI Platform | Ministry of Home Affairs | e-Governance Division
          </p>
        </div>
      </footer>
    </div>
  );
}
