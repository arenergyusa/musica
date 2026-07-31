"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP } from "@/lib/constants";
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpRight,
  LogOut,
  Settings,
  Sparkles,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    title: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Investment Queue",
    href: "/admin/investments",
    icon: TrendingUp,
  },
  {
    title: "Withdrawal Payouts",
    href: "/admin/withdrawals",
    icon: ArrowUpRight,
  },
  {
    title: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const adminName = user?.name || "Administrator";
  const adminEmail = user?.email || "admin@musica.com";
  const adminInitials = adminName.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "AD";

  return (
    <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 bg-slate-900 border-r border-slate-800 text-white shadow-xl select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 justify-between">
        <Link href="/admin/dashboard" className="flex items-center space-x-2.5 group">
          <Image src="/brand/musica-icon-192.png" width={34} height={34} alt="Musica" className="h-8 w-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white leading-none">
              {APP.NAME}
            </span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
              Admin Suite
            </span>
          </div>
        </Link>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] font-bold px-2 py-0.5">
          v2.0
        </Badge>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Management Console
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}`));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "group flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-extrabold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    isActive ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Status Card */}
      <div className="px-4 py-3 mx-4 mb-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> System Online
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          USDT (BEP-20) Active
        </div>
      </div>

      {/* User Switch & Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <Link href="/dashboard" className="w-full block">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-semibold rounded-xl h-9">
            <Sparkles className="mr-2.5 h-4 w-4 text-blue-400" />
            Switch to User View
          </Button>
        </Link>
        <Button 
          onClick={logout} 
          variant="ghost" 
          className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-semibold rounded-xl h-9"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
