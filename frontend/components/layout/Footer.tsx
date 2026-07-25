import Link from "next/link";
import { Music, Mail } from "lucide-react";
import { APP, NAV_LINKS } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 pt-14 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2.5 mb-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                <Music className="h-5 w-5 font-bold" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">{APP.NAME}</span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Official Haryanvi Music Streaming Platform. Discover exclusive Haryanvi music videos, audio releases, and artist tracks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Legal &amp; Policy</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Contact Us</h3>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>hello@themusica.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/80 dark:border-slate-800 pt-6 flex flex-col space-y-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Company Notice:</strong> {APP.NAME} is a digital music streaming platform operated by <strong>Pure Desi Music (OPC) Private Limited</strong>. The company works exclusively in Haryanvi music video production, song recording, and official music distribution.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col space-y-1 text-center md:text-left">
              <p className="font-semibold text-slate-900 dark:text-white">© {currentYear} Pure Desi Music (OPC) Private Limited. All rights reserved.</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                CIN: U92490HR2020OPC091236 &bull; PAN: AALCP6210F &bull; TAN: RTKP11658D
              </p>
            </div>
            <p className="mt-3 md:mt-0 text-xs font-medium text-slate-500">
              Powered by Pure Desi Haryanvi Music.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
