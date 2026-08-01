import {
  LayoutDashboard,
  Wallet,
  Users,
  History,
  UserCircle,
  Briefcase
} from "lucide-react";

export const USER_SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/investments", label: "Investments", icon: Briefcase },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/team", label: "Team", icon: Users },
  { href: "/income", label: "History", icon: History },
];
