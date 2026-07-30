"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, Sparkles, LogOut, LayoutDashboard, Users, ArrowUpRight, Settings } from "lucide-react";
import { APP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Withdrawal Payouts", href: "/admin/withdrawals", icon: ArrowUpRight },
  { title: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const userInitials = user?.name ? user.name.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "AD";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-all">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 gap-4 justify-between">
        
        {/* Mobile Nav & Logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center bg-transparent border-none cursor-pointer">
              <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              <span className="sr-only">Toggle Admin Menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900 border-slate-800 text-white p-0">
              <div className="p-6 flex items-center space-x-2.5 border-b border-slate-800">
                <Image src="/brand/musica-icon-192.png" width={32} height={32} alt="Musica" className="h-8 w-8 rounded-lg" />
                <span className="font-extrabold text-lg tracking-tight text-white">Admin Suite</span>
              </div>
              <div className="flex flex-col space-y-1.5 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                      pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}`))
                        ? "bg-blue-600 text-white font-extrabold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              {APP.NAME} <span className="text-blue-600 font-bold">Admin</span>
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search users, transactions..."
            className="w-full pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600"
          />
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Network
          </Badge>

          <Button variant="ghost" size="icon" className="relative rounded-xl h-9 w-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full cursor-pointer outline-none bg-transparent border-none p-0">
              <Avatar className="h-9 w-9 border-2 border-blue-600/30 shadow-sm">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-black">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1 p-1">
                  <p className="text-xs font-bold leading-none text-slate-900 dark:text-white">{user?.name || "Administrator"}</p>
                  <p className="text-[11px] leading-none text-slate-400 font-normal">{user?.email || "admin@musica.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.assign("/dashboard")} className="cursor-pointer text-xs font-medium">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-blue-600" />
                Switch to User View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-rose-600 focus:text-rose-600 cursor-pointer text-xs font-medium">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
