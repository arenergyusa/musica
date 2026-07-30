import {
  LayoutDashboard,
  Wallet,
  Users,
  History,
  UserCircle,
  Briefcase,
  PlayCircle
} from "lucide-react";

export const USER_SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/watch", label: "Media Hub", icon: PlayCircle },
  { href: "/investments", label: "My Investments", icon: Briefcase },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/team", label: "My Team", icon: Users },
  { href: "/income", label: "History", icon: History },
];
