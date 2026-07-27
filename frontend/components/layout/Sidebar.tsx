"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ChevronRight,
  User as UserIcon,
  LayoutDashboard,
  Wallet,
  Users,
  History,
  UserCircle,
  Briefcase,
  ShieldCheck,
  PlayCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { APP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navSections = [
  {
    title: "MAIN MENU",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/watch", label: "Media Hub", icon: PlayCircle },
      { href: "/investments", label: "My Sponsorships", icon: Briefcase },
    ]
  },
  {
    title: "FINANCE & TEAM",
    links: [
      { href: "/wallet", label: "Reward Wallet", icon: Wallet },
      { href: "/team", label: "My Team", icon: Users },
      { href: "/income", label: "History", icon: History },
    ]
  },
  {
    title: "ACCOUNT",
    links: [
      { href: "/kyc", label: "KYC Verification", icon: ShieldCheck },
      { href: "/profile", label: "Profile Settings", icon: UserCircle },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const userName = user?.name || "Creator";
  const userEmail = user?.email || "";
  const userInitials = userName.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "U";
  const isKycApproved = user?.kycStatus === "APPROVED";

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 z-30 select-none shadow-sm">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <Image src="/brand/musica-icon-192.png" width={36} height={36} alt="Musica" className="h-9 w-9 rounded-lg shadow-sm group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              {APP.NAME}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links Grouped */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 group relative",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
                      <span className="truncate">{link.label}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile & Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        {user && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <Avatar className="h-9 w-9 border border-blue-200 dark:border-blue-900 shrink-0">
              <AvatarFallback className="bg-blue-600 text-white font-extrabold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate leading-tight">
                {userName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={cn(
                  "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                  isKycApproved ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                  {isKycApproved ? "Verified" : "KYC Pending"}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg h-9 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2 text-slate-400 group-hover:text-red-600" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
