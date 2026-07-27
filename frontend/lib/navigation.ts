import {
  LayoutDashboard,
  Wallet,
  Users,
  History,
  UserCircle,
  Briefcase,
  ShieldCheck,
  PlayCircle
} from "lucide-react";

export const USER_SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/watch", label: "Media Hub", icon: PlayCircle },
  { href: "/investments", label: "My Sponsorships", icon: Briefcase },
  { href: "/wallet", label: "Reward Wallet", icon: Wallet },
  { href: "/team", label: "My Team", icon: Users },
  { href: "/income", label: "History", icon: History },
  { href: "/kyc", label: "KYC Verification", icon: ShieldCheck },
];
