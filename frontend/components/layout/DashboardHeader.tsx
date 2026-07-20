"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, Settings, LogOut, Music } from "lucide-react";

import { APP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { USER_SIDEBAR_LINKS } from "@/lib/navigation";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "U";
  
  // Format pathname to display as Title
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    const path = pathname.split("/")[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1).replace("-", " ") : "Dashboard";
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden mr-2 -ml-2" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col h-full">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                  <Music className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">{APP.NAME}</span>
              </Link>
            </div>
            <div className="flex flex-col py-6 px-3 space-y-1 flex-1 overflow-y-auto">
              {USER_SIDEBAR_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-border/40 mt-auto shrink-0">
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="font-semibold text-lg sm:text-xl capitalize">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full" />}>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "Loading..."}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "..."}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer flex items-center w-full">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer flex items-center w-full">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 cursor-pointer flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
