import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const LAST_UPDATED = new Date("2026-07-20T00:00:00Z");

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Last updated: {LAST_UPDATED.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introduction</h2>
              <p>
                Pure Desi Music (OPC) Private Limited (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our platform, Musica.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Data We Collect</h2>
              <p>
                We may collect and process the following data about you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Data:</strong> Name, username, or similar identifier.</li>
                <li><strong>Contact Data:</strong> Email address and mobile number.</li>
                <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform.</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, including video views, watch history, and preferences.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. How We Use Your Data</h2>
              <p>
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To register you as a new user and manage your account.</li>
                <li>To deliver relevant content, personalized recommendations, and advertisements.</li>
                <li>To improve our platform, products/services, marketing, and user experience.</li>
                <li>To communicate with you about updates, support, and promotional offers.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Data Security</h2>
              <p>
                We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is limited to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Cookies</h2>
              <p>
                Our platform uses cookies to distinguish you from other users. This helps us to provide you with a good experience when you browse our platform and also allows us to improve our site. You can set your browser to refuse all or some browser cookies, but this may affect your ability to use certain features.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Third-Party Links</h2>
              <p>
                This platform may include links to third-party websites, plug-ins, and applications (e.g., YouTube embeds). Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Your Rights</h2>
              <p>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
