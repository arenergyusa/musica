import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP } from "@/lib/constants";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { AutoLogout } from "@/components/AutoLogout";

export const metadata: Metadata = {
  metadataBase: new URL(APP.URL),
  title: {
    default: "Musica — Community Rewards & Income Platform",
    template: "%s | Musica",
  },
  description: "Musica is a community-driven rewards platform. Earn daily rewards, level income, and monthly salary through sponsorships and team building.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/musica-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/musica-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  keywords: [
    "Musica",
    "Musica Rewards",
    "Musica Income",
    "Community Rewards",
    "Sponsorship Plans",
    "Level Income",
    "Monthly Salary",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Musica",
    title: "Musica — Community Rewards & Income Platform",
    description: "Earn daily rewards, level income, and monthly salary by building your Musica team.",
    url: "https://the-musica.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Musica — Community Rewards Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Musica — Community Rewards",
    description: "Earn daily rewards, level income, and monthly salary with Musica.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: APP.URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            {/* Skip to content — accessibility */}
            <a href="#main-content" className="skip-to-content">
              Skip to main content
            </a>
            <AuthProvider>
              <AutoLogout />
              {children}
            </AuthProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                style: { fontFamily: "var(--font-inter)" },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
