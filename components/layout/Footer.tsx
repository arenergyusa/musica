import Link from "next/link";
import { Music, Mail, MapPin } from "lucide-react";
import { APP, NAV_LINKS } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/40 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <Music className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">{APP.NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              India's premier RBF Agreement-based Entertainment Production
              Investment Platform. Empowering creators and investors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/rbf-agreement" className="hover:text-primary transition-colors">
                  RBF Agreement
                </Link>
              </li>
              <li>
                <Link href="/kyc-policy" className="hover:text-primary transition-colors">
                  KYC & AML Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start space-x-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <span>support@musica.in</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  Musica Entertainment Pvt. Ltd.<br />
                  Mumbai, Maharashtra 400053<br />
                  India
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {currentYear} {APP.NAME}. All rights reserved.</p>
          <p className="mt-2 md:mt-0 text-xs">
            Investment in production is subject to market risks. Read all scheme related documents carefully.
          </p>
        </div>
      </div>
    </footer>
  );
}
