"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { User as UserType } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Search, 
  MoreHorizontal, 
  Ban, 
  CheckCircle2, 
  Eye,
  User,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  ShieldCheck,
  UserCog
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  super_admin: { label: "Super Admin", cls: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400" },
  admin: { label: "Admin", cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" },
  user: { label: "User", cls: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    joinDate: string;
    status: string;
    role: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name?: string } | null>(null);
  const [userSummary, setUserSummary] = useState<{
    user?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      username: string;
      invite_code: string;
      leg: string;
      status: string;
      role: string;
      usdt_address?: string;
      created_at: string;
    };
    wallet?: { balance: number; total_credited: number };
    investments?: Array<{ id: string; amount: number; total_reward_earned: number; cap_limit: number; status: string }>;
    status?: "INACTIVE" | "ACTIVE" | "WORKING";
  } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    email: string;
    usdt_address: string;
  }>({ name: "", phone: "", email: "", usdt_address: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);

      const res = await api.get(`/admin/users?${queryParams.toString()}`);
      if (res.data.data) {
        const mappedUsers = res.data.data.map((u: UserType) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          referralCode: (u.referralCode as string) || (u.referral_code as string) || "",
          joinDate: new Date((u.createdAt as string) || (u.created_at as string) || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: u.status || "ACTIVE",
          role: u.role || "user"
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to fetch user list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchUserSummary = async (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsSummaryLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/summary`);
      if (res.data.data) {
        setUserSummary(res.data.data);
        const u = res.data.data.user;
        if (u) {
          setEditForm({
            name: u.name || "",
            phone: u.phone || "",
            email: u.email || "",
            usdt_address: u.usdt_address || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch user summary", error);
      toast.error("Failed to load user detail summary");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    try {
      // Backend exposes /admin/users/:id/block and /admin/users/:id/unblock
      const endpoint = nextStatus === "BLOCKED" ? `/admin/users/${userId}/block` : `/admin/users/${userId}/unblock`;
      await api.put(endpoint);
      toast.success(`User status updated to ${nextStatus}`);
      fetchUsers();
      if (selectedUser?.id === userId && userSummary?.user) {
        setUserSummary({
          ...userSummary,
          user: { ...userSummary.user, status: nextStatus }
        });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  const handleSaveUserDetails = async () => {
    if (!selectedUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      setIsSaving(true);
      await api.put(`/admin/users/${selectedUser.id}`, editForm);
      toast.success("User details updated");
      fetchUsers();
      if (userSummary?.user) {
        setUserSummary({
          ...userSummary,
          user: { ...userSummary.user, ...editForm },
        });
      }
    } catch (error: any) {
      console.error("Failed to update user details", error);
      toast.error(error.response?.data?.error || "Failed to update user details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <User className="h-3.5 w-3.5" /> User Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">User Management</h1>
        </div>

        <Button 
          onClick={fetchUsers} 
          variant="outline" 
          size="sm" 
          className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9 self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh List
        </Button>
      </div>

      {/* Filter & Controls Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, email, invite code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
                <SelectTrigger className="h-9 w-36 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
              <TableRow>
                <TableHead className="pl-6 text-xs font-bold text-slate-500">Member</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Phone</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Role</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Invite Code</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Joined</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs font-medium">Loading user directory...</span>
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{u.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${ROLE_LABELS[u.role]?.cls || ROLE_LABELS.user.cls}`}>
                        {ROLE_LABELS[u.role]?.label || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] font-bold bg-blue-50/50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60">
                        {u.referralCode || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {u.joinDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${u.status === "BLOCKED" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 outline-none">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[11px] font-bold text-slate-400">Actions</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => handleFetchUserSummary(u.id, u.name)} className="cursor-pointer text-xs font-semibold">
                            <Eye className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            View Detail Summary
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleChangeRole(u.id, "admin")} disabled={u.role === "admin"} className="cursor-pointer text-xs font-semibold">
                            <Shield className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(u.id, "user")} disabled={u.role === "user"} className="cursor-pointer text-xs font-semibold">
                            <UserCog className="mr-2 h-3.5 w-3.5 text-slate-500" />
                            Make Regular User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(u.id, u.status)} 
                            className={`cursor-pointer text-xs font-semibold ${u.status === "BLOCKED" ? "text-emerald-600 focus:text-emerald-600" : "text-rose-600 focus:text-rose-600"}`}
                          >
                            {u.status === "BLOCKED" ? (
                              <>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                Unblock Account
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-3.5 w-3.5" />
                                Block Account
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-400 text-xs font-medium">
                    No users found matching filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Summary Drawer */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto p-6">
          <SheetHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <SheetTitle className="text-lg font-black text-slate-900 dark:text-white">User Overview</SheetTitle>
          </SheetHeader>

          {isSummaryLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading portfolio summary...
            </div>
          ) : userSummary ? (
            <div className="space-y-6 pt-6">
              
              {/* Profile Card */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{userSummary.user?.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{userSummary.user?.email}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{userSummary.user?.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] font-bold ${userSummary.user?.status === "BLOCKED" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                      {userSummary.user?.status}
                    </Badge>
                    {userSummary.status && (
                      <Badge variant="outline" className={`text-[10px] font-bold ${userSummary.status === "WORKING" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : userSummary.status === "ACTIVE" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                        {userSummary.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* All Account Details */}
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Details</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Username</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{userSummary.user?.username || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Invite Code</span>
                    <span className="font-mono font-bold text-blue-600">{userSummary.user?.invite_code || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Leg</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{userSummary.user?.leg || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Role</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{userSummary.user?.role || "user"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Joined</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {userSummary.user?.created_at ? new Date(userSummary.user.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Details */}
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Edit Details</p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="h-9 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">USDT (BEP-20) Address</Label>
                  <Input
                    value={editForm.usdt_address}
                    onChange={(e) => setEditForm({ ...editForm, usdt_address: e.target.value })}
                    placeholder="0x..."
                    className="h-9 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <Button
                  onClick={handleSaveUserDetails}
                  disabled={isSaving}
                  className="w-full h-9 text-xs font-extrabold rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {/* Wallet Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Wallet Balance</p>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                    {formatCurrency(userSummary.wallet?.balance || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Credited</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    {formatCurrency(userSummary.wallet?.total_credited || 0)}
                  </p>
                </div>
              </div>

              {/* Investments List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" /> Active Investments ({userSummary.investments?.length || 0})
                </h4>
                {userSummary.investments && userSummary.investments.length > 0 ? (
                  userSummary.investments.map((inv) => (
                    <div key={inv.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border-emerald-200">
                          {inv.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                        <span>Earned: {formatCurrency(inv.total_reward_earned)}</span>
                        <span>Cap: {formatCurrency(inv.cap_limit)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No investments active
                  </p>
                )}
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>

    </div>
  );
}
