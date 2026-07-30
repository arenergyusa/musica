"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { WITHDRAWAL, CAP_MULTIPLIER } from "@/lib/constants";
import { Building2, ShieldCheck, Mail } from "lucide-react";

const LAST_UPDATED = new Date("2026-07-24T00:00:00Z");

export default function TermsPage() {
  const [nonWorkingCap, setNonWorkingCap] = useState<number | null>(null);
  const [workingCap, setWorkingCap] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/settings")
      .then(res => {
        const data = res.data?.data;
        if (data && data.non_working_cap_multiplier != null && data.working_cap_multiplier != null) {
          setNonWorkingCap(data.non_working_cap_multiplier);
          setWorkingCap(data.working_cap_multiplier);
        } else {
          setNonWorkingCap(CAP_MULTIPLIER.NON_WORKING);
          setWorkingCap(CAP_MULTIPLIER.WORKING);
        }
      })
      .catch(err => {
        console.error("Failed to load terms settings", err);
        setError("Failed to load dynamic terms settings. Presenting guaranteed default parameters.");
        setNonWorkingCap(CAP_MULTIPLIER.NON_WORKING);
        setWorkingCap(CAP_MULTIPLIER.WORKING);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 flex flex-col pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4 border border-blue-200/60 dark:border-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Official Legal Agreement</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Terms of Service
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">
              Last updated: {LAST_UPDATED.toLocaleDateString("en-IN", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" })}
            </p>

            {/* Corporate Registration Box */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#F8F9FA] dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">Pure Desi Music </span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">

              </div>
            </div>
          </div>

          {/* Main Terms Body */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 md:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Acceptance of Terms &amp; Corporate Details
              </h2>
              <p>
                By accessing and using the Musica platform (<strong>https://the-musica.com</strong>), operated exclusively by <strong>Pure Desi Music</strong>, you agree to be bound by these Terms of Service. The company operates exclusively in Haryanvi music video production, audio recording, and official music distribution. If you do not agree with any portion of these terms, please discontinue platform use immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Nature of Digital Music Content &amp; Sponsorship
              </h2>
              <p>
                Musica is a dedicated digital streaming portal for official Haryanvi music videos, songs, and audio releases. Project sponsorships on Musica support digital Haryanvi music video production and grant access to exclusive digital music streams and promotional benefits.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-[#F8F9FA] dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <strong>Non-Financial Disclaimer:</strong> A Project Sponsorship is an internal content funding program. It is not an investment, stock purchase, fixed return scheme, or financial security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                3. Sponsorship Refund Policy
              </h2>
              <p>
                All project sponsorship contributions paid on Musica directly fund music video production, studio recording, and digital hosting, and are generally non-refundable once content production is initiated, subject to applicable Indian consumer protection regulations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                4. Promotional Reward Credits &amp; Cap Multipliers
              </h2>
              <p>
                Active project sponsors are eligible to receive promotional revenue share credits based on platform activity under the following parameters:
              </p>
              {isLoading ? (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse text-xs">Loading multiplier settings...</div>
              ) : (
                <>
                  {error && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs">
                      {error}
                    </div>
                  )}
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li><strong>Standard (Passive) Sponsors:</strong> Accumulated rewards are capped at <strong>{nonWorkingCap}x</strong> ({(nonWorkingCap ?? CAP_MULTIPLIER.NON_WORKING) * 100}%) of the sponsorship value.</li>
                    <li><strong>Affiliate (Active) Sponsors:</strong> Total rewards from all sources are extended up to a maximum cap of <strong>{workingCap}x</strong> ({(workingCap ?? CAP_MULTIPLIER.WORKING) * 100}%) of the sponsorship value.</li>
                  </ul>
                  <p className="text-xs text-slate-500">
                    Upon reaching the cap ({nonWorkingCap}x or {workingCap}x), the sponsorship cycle completes automatically.
                  </p>
                </>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                5. Identity Verification (KYC)
              </h2>
              <p>
                To comply with statutory regulations, users requesting payout withdrawals must complete identity verification (KYC) by providing valid government-issued identifiers (such as PAN). Account information must match official submitted documents.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                6. Withdrawals &amp; Statutory Tax Deductions (TDS)
              </h2>
              <p>
                Withdrawal requests are processed on designated monthly schedule dates (<strong>10th, 20th, and 30th</strong> of each month, or the final day of the month), subject to a minimum threshold of $10 USD.
              </p>
              <div className="bg-[#F8F9FA] dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">Statutory Tax Deductions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Standard <strong>10% Tax Deducted at Source (TDS)</strong> under Income Tax regulations under TAN is deducted.</li>
                  <li><strong>0% Platform Administrative Fee</strong> is charged on payout requests.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                7. Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms of Service are governed by the laws of India. Any disputes arising from platform use shall be submitted to the exclusive jurisdiction of competent courts in Haryana, India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                8. Contact &amp; Corporate Communication
              </h2>
              <p>
                For official legal inquiries or support regarding these terms, please contact:
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
