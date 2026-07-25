"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  Music,
  Wallet,
  ChevronRight,
} from "lucide-react";

import { APP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { USER_SIDEBAR_LINKS } from "@/lib/navigation";

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userInitials = user?.name
    ? user.name.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : "U";

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    const path = pathname.split("/")[1];
    if (!path) return "Dashboard";
    return path.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 select-none shadow-xs">

      {/* Left: Mobile Toggle + Breadcrumb Title */}
      <div className="flex items-center space-x-3">
        {/* Mobile Navigation Drawer Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

            {/* Drawer Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                  <Music className="h-5 w-5 font-bold" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">{APP.NAME}</span>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col py-5 px-3 space-y-1 flex-1 overflow-y-auto">
              {USER_SIDEBAR_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("h-4 w-4", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Footer Sign Out */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-auto shrink-0">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 rounded-lg"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Title Breadcrumb */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">Musica /</span>
          <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Actions & Simple Avatar */}
      <div className="flex items-center space-x-3">

        {/* Quick Payout Link */}
        <Link
          href="/withdraw"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Payout Wallet</span>
        </Link>

        {/* Simple Avatar */}
        <Link href="/profile" title="Profile Settings">
          <Avatar className="h-9 w-9 border border-blue-200 dark:border-blue-900 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarFallback className="bg-blue-600 text-white font-extrabold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

      </div>
    </header>
  );
}
