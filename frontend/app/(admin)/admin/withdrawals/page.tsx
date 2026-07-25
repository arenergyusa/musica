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
          user: w.user_id,
          amount: w.amount,
          tds: w.amount * 0.10,
          fee: 0,
          net: w.amount * 0.90,
          requested: new Date(w.created_at || '').toLocaleString(),
          scheduled: "N/A",
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
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Processed</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Approved (Queue)</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Withdrawal Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review, approve, and process user withdrawal requests (0% Admin Fee, 10% Statutory TDS - TAN: RTKP11658D).
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <Tabs defaultValue="PENDING" onValueChange={setFilter} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex overflow-x-auto justify-start sm:inline-flex h-auto p-1 rounded-lg">
              <TabsTrigger value="PENDING" className="whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-md">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED" className="whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-md">Approved</TabsTrigger>
              <TabsTrigger value="PROCESSED" className="whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-md">Processed</TabsTrigger>
              <TabsTrigger value="REJECTED" className="whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-md">Rejected</TabsTrigger>
              <TabsTrigger value="ALL" className="whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-md">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search user or Tx ID..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {(filter === "PENDING" || filter === "APPROVED") && selectedIds.length > 0 && (
          <div className="bg-blue-50/60 dark:bg-blue-950/40 border-b border-blue-100 p-3 flex items-center justify-between animate-in fade-in">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {selectedIds.length} requests selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8" onClick={() => openReject()}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject Selected
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8" onClick={() => openApprove()}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> 
                {filter === "PENDING" ? "Approve Selected" : "Mark as Processed"}
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                {(filter === "PENDING" || filter === "APPROVED") && (
                  <TableHead className="w-[50px] pl-5">
                    <Checkbox 
                      checked={filteredWithdrawals.length > 0 && selectedIds.length === filteredWithdrawals.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className={filter !== "PENDING" && filter !== "APPROVED" ? "pl-5 text-xs font-semibold" : "text-xs font-semibold"}>User</TableHead>
                <TableHead className="text-xs font-semibold">Amount</TableHead>
                <TableHead className="text-xs font-semibold">Net (After 10% TDS)</TableHead>
                <TableHead className="text-xs font-semibold">Requested</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-right pr-5 text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((wx) => (
                  <TableRow key={wx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {(filter === "PENDING" || filter === "APPROVED") && (
                      <TableCell className="pl-5">
                        <Checkbox 
                          checked={selectedIds.includes(wx.id)}
                          onCheckedChange={() => toggleSelect(wx.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className={filter !== "PENDING" && filter !== "APPROVED" ? "pl-5" : ""}>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{wx.user}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{wx.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">{formatCurrency(wx.amount)}</div>
                      <div className="text-[10px] text-slate-400">10% Statutory TDS: {formatCurrency(wx.tds)}</div>
                    </TableCell>
                    <TableCell className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(wx.net)}</TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{wx.requested}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(wx.status)}</TableCell>
                    <TableCell className="text-right pr-5">
                      {wx.status === "PENDING" || wx.status === "APPROVED" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {wx.status === "PENDING" && (
                              <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 text-xs font-semibold" onClick={() => openApprove(wx)}>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {wx.status === "APPROVED" && (
                              <DropdownMenuItem className="text-blue-600 focus:text-blue-600 text-xs font-semibold" onClick={() => openApprove(wx)}>
                                <Banknote className="mr-1.5 h-3.5 w-3.5" />
                                Mark as Processed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 text-xs font-semibold" onClick={() => openReject(wx)}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-xs text-slate-400">
                    No withdrawal requests found in this view.
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
