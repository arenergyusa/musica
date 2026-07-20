"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
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

const navItems = [
  { title: "Overview", href: "/admin/dashboard" },
  { title: "Users", href: "/admin/users" },
  { title: "Withdrawals", href: "/admin/withdrawals" },
  { title: "KYC", href: "/admin/kyc" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "AD";

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b lg:border-none lg:bg-transparent">
      <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 gap-4 justify-between lg:justify-end">
        
        {/* Mobile Nav & Logo */}
        <div className="flex items-center gap-4 lg:hidden">
          <Sheet>
            <SheetTrigger 
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Admin Menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex items-center space-x-2 mb-8 mt-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl leading-none">M</span>
                </div>
                <span className="font-bold text-xl tracking-tight">Admin</span>
              </div>
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-xl tracking-tight text-primary">
            {APP.NAME} Admin
          </span>
        </div>

        {/* Desktop Header Items */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search user, tx..."
              className="w-full pl-9 bg-background"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full" />
              }
            >
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard" className="cursor-pointer w-full" />}>
                Switch to User View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
