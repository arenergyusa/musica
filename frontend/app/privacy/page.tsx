import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Building2, ShieldCheck, Mail } from "lucide-react";

const LAST_UPDATED = new Date("2026-07-24T00:00:00Z");

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 flex flex-col pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 border border-blue-200/60 dark:border-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Data Protection &amp; Privacy Policy</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Privacy Policy
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">
              Last updated: {LAST_UPDATED.toLocaleDateString("en-IN", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" })}
            </p>

            {/* Corporate Registration Box */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#F8F9FA] dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">Pure Desi Music (OPC) Private Limited</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                CIN: U92490HR2020OPC091236 &bull; PAN: AALCP6210F &bull; TAN: RTKP11658D
              </div>
            </div>
          </div>

          {/* Main Privacy Body */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 md:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Introduction
              </h2>
              <p>
                <strong>Pure Desi Music (OPC) Private Limited</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, process, and safeguard your personal information when you use our Haryanvi music streaming platform, <strong>Musica</strong> (https://themusica.in).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Information We Collect
              </h2>
              <p>
                We collect personal information necessary to deliver seamless music video streaming services and platform functionality:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Account Registration Data:</strong> Name, email address, mobile number, and authentication credentials.</li>
                <li><strong>Identity Verification Data (KYC):</strong> Government-issued tax identifiers (e.g., PAN) submitted solely for statutory compliance during account verification and payout processing.</li>
                <li><strong>Technical &amp; Usage Data:</strong> IP address, device type, browser specifications, video watch history, and content interaction metrics.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                3. Purpose of Data Processing
              </h2>
              <p>
                Your personal data is processed strictly for legitimate operational purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>To manage user accounts and provide access to Haryanvi music video streams.</li>
                <li>To verify user identity and ensure statutory compliance for tax reporting (TDS under TAN RTKP11658D).</li>
                <li>To improve video playback quality, mobile responsiveness, and streaming performance.</li>
                <li>To communicate platform announcements, system updates, and customer support responses.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Data Security &amp; Encryption
              </h2>
              <p>
                We implement industry-standard administrative, physical, and technical security protocols to safeguard your personal information against unauthorized access, loss, or alteration. Sensitive records (such as account credentials and tax identifiers) are transmitted using encrypted SSL protocols.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                5. Third-Party Integrations &amp; Embeds
              </h2>
              <p>
                Musica may feature official third-party media embeds (such as YouTube official channel video players). Interacting with embedded players may allow third parties to record viewing metrics in accordance with their respective privacy policies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                6. Data Retention &amp; Rights
              </h2>
              <p>
                We retain personal information only for as long as necessary to fulfill service delivery and legal compliance requirements. Users have the right to request account data updates, corrections, or deletion by contacting our support desk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                7. Contact Us
              </h2>
              <p>
                For privacy inquiries or data protection concerns, please contact the Data Protection Officer at:
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs pt-2">
                <a href="mailto:hello@themusica.in" className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
                  <Mail className="h-4 w-4" /> hello@themusica.in
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
