/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { User as UserType } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ShieldAlert, 
  Eye,
  User,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Loader2
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
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      if (res.data.data) {
        // Map backend domain.User fields to what UI expects
        const mappedUsers = res.data.data.map((u: UserType) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          referralCode: (u.referralCode as string) || (u.referral_code as string) || "",
          kycStatus: (u.kycStatus as string) || (u.kyc_status as string) || "",
          activeInvestments: 0, // Mock for now, or fetch later
          walletBalance: 0,
          joinDate: new Date((u.createdAt as string) || (u.created_at as string) || '').toLocaleDateString(),
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || "").includes(searchQuery);
    
    const matchesKyc = kycFilter === "ALL" || user.kycStatus === kycFilter;
    
    return matchesSearch && matchesKyc;
  });

  const handleBlockUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      toast.success("User blocked successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to block user");
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Users Management</h1>
        <p className="text-muted-foreground">
          View, manage, and monitor all platform users.
        </p>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Select value={kycFilter} onValueChange={(val) => setKycFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All KYC</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
                <TableHead>KYC</TableHead>
                <TableHead>Investments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="animate-spin text-primary">⟳</span>
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">Ref: {user.referralCode}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    </TableCell>
                    <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{user.activeInvestments}</Badge>
                    </TableCell>
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
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "ACTIVE" ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleBlockUser(user.id)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Block User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600">
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
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Comprehensive profile and stats for this user.
            </SheetDescription>
          </SheetHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getKycBadge(selectedUser.kycStatus)}
                        {selectedUser.status === "BLOCKED" && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">Blocked</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-foreground">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-foreground">{selectedUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-foreground">Joined {selectedUser.joinDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Reward Wallet</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-500">{formatCurrency(selectedUser.walletBalance)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Active Plans</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedUser.activeInvestments}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Administrative Actions</h4>
                {selectedUser.status === "ACTIVE" ? (
                  <Button variant="destructive" className="w-full" onClick={() => handleBlockUser(selectedUser.id)}>
                    <Ban className="mr-2 h-4 w-4" />
                    Block User Account
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-500/10">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Unblock User Account
                  </Button>
                )}
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
