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
  { href: "/investments", label: "My Investments", icon: Briefcase },
  { href: "/wallet", label: "Reward Wallet", icon: Wallet },
  { href: "/team", label: "My Team", icon: Users },
  { href: "/income", label: "Income History", icon: History },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
