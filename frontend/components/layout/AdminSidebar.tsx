"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP } from "@/lib/constants";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileCheck,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";

const navItems = [
  {
    title: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Withdrawals",
    href: "/admin/withdrawals",
    icon: CreditCard,
  },
  {
    title: "KYC Verification",
    href: "/admin/kyc",
    icon: FileCheck,
  },
  {
    title: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r">
      <div className="p-6 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl leading-none">M</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-primary">
          {APP.NAME} <span className="text-muted-foreground text-sm font-normal">Admin</span>
        </span>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t space-y-2">
        <Link href="/dashboard" className="w-full">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Settings className="mr-3 h-5 w-5" />
            Switch to User View
          </Button>
        </Link>
        <Button onClick={logout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
