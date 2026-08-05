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
    default: "Musica — Official Haryanvi Music Videos & Song Streaming",
    template: "%s | Musica",
  },
  description: "Official Musica streaming platform. Watch trending Haryanvi music videos, audio releases, and studio tracks in high definition.",
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
    "Musica Streaming",
    "Musica Haryanvi",
    "Musica Music Videos",
    "Haryanvi Music Videos",
    "Haryanvi Songs",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Musica",
    title: "Musica — Official Haryanvi Music Videos & Tracks",
    description: "Stream official Haryanvi music videos & studio song releases on Musica.",
    url: "https://the-musica.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Musica — Official Haryanvi Music Streaming Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Musica — Haryanvi Music Streaming",
    description: "Official Haryanvi music video releases on Musica.",
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
