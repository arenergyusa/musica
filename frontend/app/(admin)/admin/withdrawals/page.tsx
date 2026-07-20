/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Withdrawal } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard,
  Banknote,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get("/admin/withdrawals");
      if (res.data.data) {
        const mapped = res.data.data.map((w: Withdrawal) => ({
          id: w.id,
          user: w.user_id, // Could fetch actual username if available
          amount: w.amount,
          tds: w.amount * 0.05,
          fee: w.amount * 0.05,
          net: w.amount * 0.90,
          requested: new Date(w.created_at || '').toLocaleString(),
          scheduled: "N/A", // Not implemented yet
          status: w.status,
          reason: w.admin_note
        }));
        setWithdrawals(mapped);
      }
    } catch (err) {
      console.error("Failed to load withdrawals", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionType: "approve" | "reject") => {
    const results = await Promise.allSettled(
      selectedIds.map(id => api.put(`/admin/withdrawals/${id}/${actionType}`, { admin_note: adminNote }))
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - successful;

    if (failed === 0) {
      toast.success(`Successfully ${actionType}d ${successful} request(s)`);
    } else if (successful === 0) {
      toast.error(`Failed to ${actionType} ${failed} request(s)`);
    } else {
      toast.error(`Successfully ${actionType}d ${successful} request(s), but ${failed} failed`);
    }

    setApproveModalOpen(false);
    setRejectModalOpen(false);
    setSelectedIds([]);
    setAdminNote("");
    fetchWithdrawals();
  };
  
  const filteredWithdrawals = withdrawals.filter(wx => {
    const matchesFilter = filter === "ALL" || wx.status === filter;
    const matchesSearch = wx.user.toLowerCase().includes(searchQuery.toLowerCase()) || wx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredWithdrawals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWithdrawals.map(wx => wx.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openApprove = (tx?: Withdrawal) => {
    if (tx) {
      setActiveTx(tx);
      setSelectedIds([tx.id]);
    }
    setApproveModalOpen(true);
  };

  const openReject = (tx?: Withdrawal) => {
    if (tx) {
      setActiveTx(tx);
      setSelectedIds([tx.id]);
    }
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Processed</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Approved (Queue)</Badge>;
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Withdrawal Management</h1>
        <p className="text-muted-foreground">
          Review, approve, and process user withdrawal requests.
        </p>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <Tabs defaultValue="PENDING" onValueChange={setFilter} className="w-full sm:w-auto">
            <TabsList className="bg-background border flex overflow-x-auto justify-start sm:inline-flex h-auto p-1">
              <TabsTrigger value="PENDING" className="whitespace-nowrap px-4 py-2">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED" className="whitespace-nowrap px-4 py-2">Approved</TabsTrigger>
              <TabsTrigger value="PROCESSED" className="whitespace-nowrap px-4 py-2">Processed</TabsTrigger>
              <TabsTrigger value="REJECTED" className="whitespace-nowrap px-4 py-2">Rejected</TabsTrigger>
              <TabsTrigger value="ALL" className="whitespace-nowrap px-4 py-2">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user or Tx ID..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {(filter === "PENDING" || filter === "APPROVED") && selectedIds.length > 0 && (
          <div className="bg-primary/5 border-b p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="text-sm font-medium text-primary">
              {selectedIds.length} requests selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10" onClick={() => openReject()}>
                <XCircle className="mr-2 h-4 w-4" /> Reject Selected
              </Button>
              <Button size="sm" onClick={() => openApprove()}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> 
                {filter === "PENDING" ? "Approve Selected" : "Mark as Processed"}
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                {(filter === "PENDING" || filter === "APPROVED") && (
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox 
                      checked={filteredWithdrawals.length > 0 && selectedIds.length === filteredWithdrawals.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className={filter !== "PENDING" && filter !== "APPROVED" ? "pl-6" : ""}>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Net (After 10%)</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((wx) => (
                  <TableRow key={wx.id} className="hover:bg-muted/10">
                    {(filter === "PENDING" || filter === "APPROVED") && (
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedIds.includes(wx.id)}
                          onCheckedChange={() => toggleSelect(wx.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className={filter !== "PENDING" && filter !== "APPROVED" ? "pl-6" : ""}>
                      <div className="font-medium">{wx.user}</div>
                      <div className="text-xs text-muted-foreground uppercase">{wx.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(wx.amount)}</div>
                      <div className="text-xs text-muted-foreground">TDS: {formatCurrency(wx.tds)} | Fee: {formatCurrency(wx.fee)}</div>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">{formatCurrency(wx.net)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{wx.requested}</div>
                      <div className="text-xs text-muted-foreground">Sch: {wx.scheduled}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(wx.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                      {wx.status === "PENDING" || wx.status === "APPROVED" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {wx.status === "PENDING" && (
                              <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={() => openApprove(wx)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {wx.status === "APPROVED" && (
                              <DropdownMenuItem className="text-blue-600 focus:text-blue-600" onClick={() => openApprove(wx)}>
                                <Banknote className="mr-2 h-4 w-4" />
                                Mark as Processed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openReject(wx)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No withdrawals found in this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Modals */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {filter === "PENDING" ? "Approve Withdrawals" : "Process Withdrawals"}
            </DialogTitle>
            <DialogDescription>
              You are about to {filter === "PENDING" ? "approve" : "mark as processed"} {selectedIds.length} request(s).
            </DialogDescription>
          </DialogHeader>
          
          {filter === "APPROVED" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="paymentRef">Payment Reference Number (Optional)</Label>
                <Input 
                  id="paymentRef" 
                  placeholder="e.g. UTR1234567890" 
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave blank if applying bulk processing without distinct UTRs.</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAction("approve")}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawals</DialogTitle>
            <DialogDescription>
              You are rejecting {selectedIds.length} request(s). The funds will be refunded to their reward wallets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for Rejection (Required)</Label>
              <Input 
                id="rejectReason" 
                placeholder="e.g. Invalid bank details provided" 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => handleAction("reject")}
              disabled={!adminNote}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
