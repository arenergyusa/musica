"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Music,
  LogOut,
  ChevronRight
} from "lucide-react";
import { APP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { USER_SIDEBAR_LINKS } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col bg-card border-r border-border/40 h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Music className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">{APP.NAME}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {USER_SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{link.label}</span>
              {isActive && (
                <span className="absolute right-2 text-primary">
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/40">
        <Button onClick={logout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
