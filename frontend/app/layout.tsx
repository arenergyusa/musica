import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP } from "@/lib/constants";

import { AuthProvider } from "@/components/providers/AuthProvider";

// Font configuration removed to prevent Docker build timeout

export const metadata: Metadata = {
  metadataBase: new URL(APP.URL),
  title: {
    default: `${APP.NAME} — RBF Investment Platform`,
    template: `%s | ${APP.NAME}`,
  },
  description: APP.DESCRIPTION,
  keywords: [
    "RBF platform India",
    "revenue based financing",
    "entertainment funding",
    "music production funding",
    "revenue sharing India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: APP.NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Musica — Fund Entertainment, Earn Revenue Share",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@musicainvest",
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
