"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { User as UserType } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Phone,
  Mail,
  Calendar,
  Wallet,
  TrendingUp,
  Loader2,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    kycStatus: string;
    joinDate: string;
    status: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name?: string } | null>(null);
  const [userSummary, setUserSummary] = useState<{
    user?: { id: string; name: string; email: string; phone: string; kyc_status: string; status: string; created_at: string };
    wallet?: { balance: number; total_credited: number };
    investments?: Array<{ id: string; amount: number; total_reward_earned: number; cap_limit: number; status: string }>;
  } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

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
          kycStatus: (u.kycStatus as string) || (u.kyc_status as string) || "",
          joinDate: new Date((u.createdAt as string) || (u.created_at as string) || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: u.status
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      toast.success("User blocked successfully");
      fetchUsers();
      if (selectedUser?.id === userId) {
        openUserSummary(userId);
      }
    } catch (error) {
      toast.error("Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/unblock`);
      toast.success("User unblocked successfully");
      fetchUsers();
      if (selectedUser?.id === userId) {
        openUserSummary(userId);
      }
    } catch (error) {
      toast.error("Failed to unblock user");
    }
  };

  const openUserSummary = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    setSelectedUser(u || { id: userId });
    setIsSummaryLoading(true);
    setUserSummary(null);
    try {
      const res = await api.get(`/admin/users/${userId}/summary`);
      setUserSummary(res.data.data);
    } catch (error) {
      console.error("Failed to load user summary", error);
      toast.error("Failed to load user financial summary");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const getKycBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Approved</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status || "Uninitialized"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Users Management</h1>
          <p className="text-muted-foreground text-sm">
            View, filter, and review full financial summaries for all platform users.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Users</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="APPROVED">KYC Approved</SelectItem>
                <SelectItem value="PENDING">KYC Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">Ref: {user.referralCode}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    </TableCell>
                    <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.joinDate}</TableCell>
                    <TableCell>
                      {user.status === "ACTIVE" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openUserSummary(user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Summary
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "ACTIVE" ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleBlockUser(user.id)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Block User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => handleUnblockUser(user.id)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Unblock User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details & Financial Summary Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>User Financial Summary</SheetTitle>
            <SheetDescription>
              Complete profile, investments, and wallet summary.
            </SheetDescription>
          </SheetHeader>
          
          {isSummaryLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userSummary ? (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{userSummary.user?.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getKycBadge(userSummary.user?.kyc_status)}
                        {userSummary.user?.status === "BLOCKED" && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">Blocked</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-foreground">{userSummary.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-foreground">{userSummary.user?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-foreground">
                        Joined {new Date(userSummary.user?.created_at || '').toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium uppercase">Wallet Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(userSummary.wallet?.balance || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Credited: {formatCurrency(userSummary.wallet?.total_credited || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium uppercase">Investments</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {(userSummary.investments || []).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Active: {(userSummary.investments || []).filter((i) => i.status === "ACTIVE").length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Details */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold mb-2">Investments List</p>
                  {(userSummary.investments || []).length > 0 ? (
                    (userSummary.investments || []).map((inv) => (
                      <div key={inv.id} className="p-3 bg-muted/30 rounded-lg text-xs flex justify-between items-center border">
                        <div>
                          <p className="font-bold text-sm">{formatCurrency(inv.amount)}</p>
                          <p className="text-muted-foreground">
                            Earned: {formatCurrency(inv.total_reward_earned || 0)} / {formatCurrency(inv.cap_limit)}
                          </p>
                        </div>
                        <Badge variant={inv.status === "ACTIVE" ? "default" : "secondary"}>
                          {inv.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No investments found</p>
                  )}
                </CardContent>
              </Card>

              {/* Administrative Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Account Status Controls</h4>
                {userSummary.user?.status === "ACTIVE" ? (
                  <Button variant="destructive" className="w-full" onClick={() => userSummary.user?.id && handleBlockUser(userSummary.user.id)}>
                    <Ban className="mr-2 h-4 w-4" />
                    Block User Account
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-500/10" onClick={() => userSummary.user?.id && handleUnblockUser(userSummary.user.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Unblock User Account
                  </Button>
                )}
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>

    </div>
  );
}
