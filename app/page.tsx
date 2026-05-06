import Link from "next/link";
import { 
  FileText, 
  Search, 
  Calendar, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  PlayCircle,
  Image as ImageIcon,
  Clock,
  Shield,
  Gavel,
  Zap,
  CheckCircle,
  FileSearch,
  Database,
  BarChart3,
  Cpu,
  Moon,
  Volume2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ─── Ultra-Modern Welcome Bar ─── */}
      <div className="bg-slate-50 text-[#003366] py-2 border-b border-slate-200">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FF9933] rounded-full animate-pulse" />
            <span className="text-[11px] font-bold tracking-tight opacity-80 uppercase">
              Official Digital Portal of NirnayAI • Government of India
            </span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <Link href="#" className="hover:text-[#FF9933] transition-colors">Screen Reader Access</Link>
            <div className="h-3 w-[1px] bg-slate-300" />
            <div className="flex items-center gap-4">
              <button className="text-[#FF9933]">English</button>
              <button className="hover:text-[#FF9933] transition-colors">हिंदी</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tricolor Top Bar ─── */}
      <div className="gov-tricolor">
        <div className="saffron" />
        <div className="white" />
        <div className="green" />
      </div>

      {/* ─── Header / Navigation ─── */}
      <header className="py-6 bg-white border-b border-gray-100 relative z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-gray-100 pr-6">
              <img src="/logo/Ashok_Emblem_svg.svg" alt="Emblem of India" className="h-16 w-auto" />
              <img src="/logo/Central_Reserve_Police_Force_emblem.svg" alt="CRPF Emblem" className="h-16 w-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#003366] tracking-tighter leading-none uppercase flex items-center gap-3">
                NirnayAI
              </h1>
              <p className="text-[11px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1">
                Central Reserve Police Force • MHA
              </p>
              <p className="text-[9px] font-black text-[#FF9933] tracking-[0.1em] uppercase">
                Government of India
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <nav className="flex gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
              <Link href="#" className="text-[#003366] border-b-2 border-[#FF9933] pb-1">Platform</Link>
              <Link href="#" className="hover:text-[#003366] transition-colors">Governance</Link>
              <Link href="#" className="hover:text-[#003366] transition-colors">Security</Link>
              <Link href="#" className="hover:text-[#003366] transition-colors">Resources</Link>
            </nav>
            <Link href="/login" className="bg-[#003366] text-white px-8 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#002244] transition-all shadow-sm">
              Internal Login
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Spotlight Strip (Cleaned up) ─── */}
      <div className="spotlight-strip h-[38px] text-sm mt-1" style={{ '--spotlight-height': '38px' } as any}>
        <div className="spotlight-label px-6">
          NOTICE
        </div>
        <div className="spotlight-content overflow-hidden">
          <div className="animate-ticker whitespace-nowrap flex gap-12 font-bold uppercase tracking-wider text-white/90">
            <span>UPCOMING: Mandatory GFR 2024 compliance workshop for Procurement Officers (Aug 15)</span>
            <span>SYSTEM: AI Extraction accuracy improved to 99.4% for technical specifications.</span>
            <span>SECURITY: Multi-factor authentication is now mandatory for all evaluators.</span>
          </div>
        </div>
      </div>

      {/* ─── Hero Section (Centered High-Impact with BG) ─── */}
      <section className="relative py-40 overflow-hidden border-b border-gray-100 bg-white">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
            style={{ backgroundImage: "url('/images/hero.jpg')" }}
          />
          {/* Faded White Bottom Edge - Sharper and More Pronounced */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
          
          {/* Light Overlay to ensure navy text legibility on a bright image */}
          <div className="absolute inset-0 bg-white/10" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-[#003366]/20 text-[#003366] text-xs font-black uppercase tracking-[0.2em] mb-10 shadow-sm">
              <Shield className="h-4 w-4" /> Enterprise Grade Tender AI
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-[#003366] leading-[1.05] tracking-tighter mb-10 uppercase drop-shadow-sm">
              Precision Evaluation <br />
              <span className="text-[#FF9933] drop-shadow-sm">at Institutional Scale.</span>
            </h2>
            <p className="text-xl text-[#003366] mb-12 leading-relaxed font-bold max-w-3xl mx-auto bg-white/10 backdrop-blur-[2px] p-4 inline-block">
              Transforming complex tender technicalities into deterministic outcomes. 
              NirnayAI automates criteria extraction and compliance verification with absolute traceability.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/upload" className="bg-[#003366] text-white px-10 py-5 text-xs font-black uppercase tracking-[0.3em] hover:bg-[#002244] transition-all flex items-center gap-3 shadow-sm">
                Begin Evaluation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="bg-white border-2 border-[#003366] text-[#003366] px-10 py-5 text-xs font-black uppercase tracking-[0.3em] hover:bg-[#003366] hover:text-white transition-all shadow-sm">
                Access Archives
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Capabilities Grid ─── */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-100">
            <div className="p-12 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition-colors group">
              <Zap className="h-10 w-10 text-[#FF9933] mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-tighter mb-4">Neural Extraction</h3>
              <p className="text-sm text-gray-500 font-bold leading-relaxed">
                Automatically identifies technical eligibility criteria from unstructured 500+ page PDFs with zero manual tagging.
              </p>
            </div>
            <div className="p-12 border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition-colors group">
              <Gavel className="h-10 w-10 text-[#FF9933] mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-tighter mb-4">Rule-Based Scrutiny</h3>
              <p className="text-sm text-gray-500 font-bold leading-relaxed">
                Cross-references bidder documents against GeM and GFR guidelines to highlight compliance deviations instantly.
              </p>
            </div>
            <div className="p-12 hover:bg-gray-50 transition-colors group">
              <CheckCircle className="h-10 w-10 text-[#FF9933] mb-8 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-tighter mb-4">Audit Traceability</h3>
              <p className="text-sm text-gray-500 font-bold leading-relaxed">
                Every AI result is linked to a specific paragraph in the source document, providing a legally defensible audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interface & Resources (Galleries) ─── */}
      <section className="py-24 bg-[#fcfcfc]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Component Style 1: Photo/Image Gallery */}
            <div className="gov-card shadow-xl border-gray-200">
              <div className="gov-card-header notched px-6 py-4">
                <span className="text-[14px] font-black uppercase tracking-widest">Interface Preview</span>
                <ImageIcon className="h-5 w-5 text-white/50" />
              </div>
              <div className="p-0 border-t border-gray-100">
                <div className="aspect-video bg-gray-100 relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-[#003366] opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="flex items-center justify-center h-full flex-col gap-4">
                    <ImageIcon className="h-12 w-12 text-gray-200" />
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Confidential Platform Screenshot</p>
                  </div>
                  {/* Subtle caption bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform">
                     <div className="text-xs font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
                       <div className="w-1.5 h-4 bg-[#FF9933]" /> Dashboard: Technical Eligibility Overview
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Style 2: Video/Tutorial */}
            <div className="gov-card shadow-xl border-gray-200">
              <div className="gov-card-header notched px-6 py-4">
                <span className="text-[14px] font-black uppercase tracking-widest">Training Portal</span>
                <div className="flex gap-3">
                   <ChevronLeft className="h-5 w-5 cursor-pointer hover:text-white/70" />
                   <ExternalLink className="h-5 w-5 cursor-pointer hover:text-white/70" />
                   <ChevronRight className="h-5 w-5 cursor-pointer hover:text-white/70" />
                </div>
              </div>
              <div className="p-0">
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <div className="relative z-20 text-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-none border border-white/20 group-hover:scale-110 transition-transform mx-auto mb-4">
                       <PlayCircle className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-xs font-black text-white/80 uppercase tracking-[0.3em]">Module 01: Evidence Management</p>
                  </div>
                  {/* Placeholder Background */}
                  <div className="absolute inset-0 bg-[#001a33] opacity-40" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── The Evaluation Lifecycle (Process Flow) ─── */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter mb-4">The Evaluation Lifecycle</h2>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Standardized Workflow for CRPF Procurement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-100 shadow-xl">
             {[
               { step: "01", title: "Digital Ingestion", desc: "Upload multi-format tender documents (PDF/DOCX). AI automatically sanitizes and indexes metadata.", icon: <Download className="h-6 w-6" /> },
               { step: "02", title: "Criteria Extraction", desc: "Automated parsing of technical eligibility, financial parameters, and performance requirements.", icon: <FileSearch className="h-6 w-6" /> },
               { step: "03", title: "Rule Alignment", desc: "Real-time matching against GeM guidelines and departmental procurement rules.", icon: <Gavel className="h-6 w-6" /> },
               { step: "04", title: "Audit Ready Export", desc: "Generation of comprehensive evaluation reports with full citation and traceability.", icon: <BarChart3 className="h-6 w-6" /> }
             ].map((item, idx) => (
               <div key={idx} className={`p-10 bg-white hover:bg-gray-50 transition-colors relative group ${idx !== 3 ? 'border-r border-gray-100' : ''}`}>
                 <div className="text-[#003366] mb-8 group-hover:scale-110 transition-transform">{item.icon}</div>
                 <div className="text-[10px] font-black text-[#FF9933] uppercase tracking-[0.3em] mb-3">Phase {item.step}</div>
                 <h3 className="text-lg font-black text-[#003366] uppercase tracking-tighter mb-4">{item.title}</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-[#003366] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ─── Explainable Intelligence (Value Prop) ─── */}
      <section className="py-32 bg-[#003366] text-white relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                 <Cpu className="h-4 w-4" /> Why NirnayAI?
               </div>
               <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-8">
                 Beyond Blackbox AI. <br />
                 <span className="text-blue-400">Total Traceability.</span>
              </h2>
              <p className="text-lg text-blue-100 font-medium leading-relaxed mb-10 opacity-80">
                Unlike generic LLMs, NirnayAI uses a deterministic extraction engine. Every extracted criteria is linked to a specific page and paragraph in the source document, ensuring legally defensible evaluations.
              </p>
              
              <ul className="space-y-6">
                {[
                  "Automated GFR 2017/2024 compliance checking",
                  "Direct link to page & paragraph citations",
                  "Anti-bias rule sets for neutral scrutiny",
                  "Encrypted audit trail for CVC compliance"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                    <CheckCircle className="h-5 w-5 text-[#FF9933]" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-12 backdrop-blur-sm">
               <div className="space-y-10">
                  <div className="border-l-4 border-[#FF9933] pl-8">
                    <p className="text-3xl font-black uppercase tracking-tighter mb-2">99.4%</p>
                    <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Extraction Accuracy across 5,000+ Tenders</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-8">
                    <p className="text-3xl font-black uppercase tracking-tighter mb-2">85%</p>
                    <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Reduction in Manual Scrutiny Man-Hours</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-8">
                    <p className="text-3xl font-black uppercase tracking-tighter mb-2">ZERO</p>
                    <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Compliance Deviations in Pilot Phase</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="bg-[#003366] text-white py-16 overflow-hidden relative">
        <div className="container mx-auto px-6 flex flex-wrap justify-between items-center gap-12 relative z-10">
          <div className="flex items-center gap-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
             <div className="text-center">
               <Shield className="h-8 w-8 mx-auto mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">MHA Secure</p>
             </div>
             <div className="text-center">
               <Gavel className="h-8 w-8 mx-auto mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">GFR Compliant</p>
             </div>
             <div className="text-center">
               <LockIcon className="h-8 w-8 mx-auto mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">ISO 27001</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-2xl font-black uppercase tracking-tighter mb-1">Government Cloud Native</p>
             <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">On-Premise Deployment Available for Strategic Units</p>
          </div>
        </div>
        {/* Subtle decorative bar */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
      </section>

      {/* ─── FAQ Section (Institutional Style) ─── */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-20">
             <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter mb-4">Security & Compliance FAQ</h2>
             <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Critical Information for Procurement Officers</p>
          </div>

          <div className="space-y-4">
             {[
               { q: "Is the data stored on foreign servers?", a: "No. NirnayAI is a Government Cloud Native application. All data resides within NIC-authorized data centers or on-premise for strategic units." },
               { q: "Does the AI make final procurement decisions?", a: "Strictly no. NirnayAI acts as a Scrutiny Assistant. Final decisions and verification are performed by the evaluating officer, supported by the AI's evidence-linked results." },
               { q: "Is the system GFR 2024 compliant?", a: "Yes. The platform's evaluation logic is regularly updated to align with General Financial Rules and CVC guidelines." },
               { q: "How are the AI results verified?", a: "Every result provided by NirnayAI comes with a 'Context Link' that opens the source document at the exact location from which the information was extracted." }
             ].map((faq, i) => (
               <div key={i} className="border border-gray-100 p-8 hover:border-[#003366] transition-all group">
                 <h4 className="text-sm font-black text-[#003366] uppercase tracking-widest mb-4 flex justify-between items-center">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 text-[#FF9933] group-hover:translate-x-1 transition-transform" />
                 </h4>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    {faq.a}
                 </p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ─── Footer (Streamlined) ─── */}
      <footer className="bg-slate-50 py-20 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xs">
               <div className="flex items-center gap-4 mb-6">
                 <img src="/logo/Ashok_Emblem_svg.svg" alt="Emblem of India" className="h-12 w-auto grayscale opacity-50" />
                 <img src="/logo/Central_Reserve_Police_Force_emblem.svg" alt="CRPF Emblem" className="h-12 w-auto grayscale opacity-50" />
               </div>
               <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
                 The official intelligence portal for automated tender analysis and rule-based evaluation. 
                 A CRPF Digital Transformation Initiative.
               </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div>
                <h6 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6">Resources</h6>
                <ul className="text-xs font-bold text-gray-500 space-y-4 uppercase tracking-wider">
                  <li><Link href="#" className="hover:text-[#003366]">CVC Manual</Link></li>
                  <li><Link href="#" className="hover:text-[#003366]">Officer Docs</Link></li>
                  <li><Link href="#" className="hover:text-[#003366]">API Access</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="text-xs font-black text-[#003366] uppercase tracking-[0.2em] mb-6">Legal</h6>
                <ul className="text-xs font-bold text-gray-500 space-y-4 uppercase tracking-wider">
                  <li><Link href="#" className="hover:text-[#003366]">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-[#003366]">Data Retention</Link></li>
                  <li><Link href="#" className="hover:text-[#003366]">IT Act 2000</Link></li>
                </ul>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <img src="/logo/Digital_India_logo.svg" alt="Digital India" className="h-14 w-auto mb-4" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Power to Empower</span>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center md:text-left">
              © 2026 NirnayAI Platform | Ministry of Home Affairs | Digital India Initiative
            </p>
            <div className="flex gap-8 text-xs font-black text-[#003366] uppercase tracking-widest">
               <span className="cursor-pointer hover:text-[#FF9933]">Hindi</span>
               <span className="cursor-pointer hover:text-[#FF9933]">English</span>
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
