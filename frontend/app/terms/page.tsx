import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const LAST_UPDATED = new Date("2026-07-20T00:00:00Z");

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Last updated: {LAST_UPDATED.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Musica platform, provided by Pure Desi Music (OPC) Private Limited, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Platform Services</h2>
              <p>
                Musica provides a premium digital entertainment platform for streaming Haryanvi music, web series, and exclusive content. We grant you a limited, non-exclusive, non-transferable license to access and view content on our platform for personal, non-commercial use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Accounts</h2>
              <p>
                To access certain features, you may need to register an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate and complete information during registration.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Content and Copyright</h2>
              <p>
                All content available on Musica, including but not limited to music videos, text, graphics, logos, and software, is the property of Pure Desi Music (OPC) Private Limited or its content suppliers and is protected by Indian and international copyright laws.
              </p>
              <p>
                You may not copy, reproduce, distribute, publish, or create derivative works from any content on our platform without explicit written permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Acceptable Use</h2>
              <p>
                You agree not to use the platform in any way that causes, or may cause, damage to the platform or impairment of the availability or accessibility of the service. Prohibited behaviors include attempting to bypass security measures, scraping content, or uploading malicious code.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Pure Desi Music (OPC) Private Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. We will notify users of any significant changes. Your continued use of the platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: hello@themusica.in</li>
                <li>Address: 223, Sector 20, Huda, Sirsa, Haryana, India</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
