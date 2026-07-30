"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Withdrawal } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Copy,
  Wallet
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
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/withdrawals");
      if (res.data.data) {
        const mapped = res.data.data.map((w: Withdrawal) => ({
          id: w.id,
          user: w.user_id,
          amount: w.amount,
          requested: new Date(w.created_at || '').toLocaleString(),
          status: w.status,
          usdt_address: (w as any).usdt_address || (w as any).payment_ref || "N/A",
          tx_hash: (w as any).tx_hash || "",
          reason: w.admin_note
        }));
        setWithdrawals(mapped);
      }
    } catch (err) {
      console.error("Failed to load withdrawals", err);
      toast.error("Failed to fetch payout requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionType: "approve" | "reject") => {
    setIsSubmitting(true);
    try {
      const targetIds = activeTx ? [activeTx.id] : selectedIds;
      const results = await Promise.allSettled(
        targetIds.map(id => api.put(`/admin/withdrawals/${id}/${actionType}`, { admin_note: adminNote }))
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(`Successfully ${actionType}d ${successful} payout request(s)`);
      } else {
        toast.warning(`Processed ${successful} request(s), ${failed} failed`);
      }

      setApproveModalOpen(false);
      setRejectModalOpen(false);
      setActiveTx(null);
      setSelectedIds([]);
      setAdminNote("");
      fetchWithdrawals();
    } catch (error) {
      console.error(`Failed to ${actionType} withdrawal`, error);
      toast.error(`Action failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (activeTab !== "ALL" && w.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.id.toLowerCase().includes(q) || w.user.toLowerCase().includes(q) || String(w.amount).includes(q);
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredWithdrawals.map(w => w.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> Automated Payout Monitor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Withdrawal Payouts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor and process automated USDT (BEP-20) payout requests via master key.
          </p>
        </div>

        <Button 
          onClick={fetchWithdrawals} 
          variant="outline" 
          size="sm" 
          className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9 self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Payouts
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* Filter Controls & Tabs */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                <TabsTrigger value="ALL" className="text-xs font-bold rounded-lg px-3">All ({withdrawals.length})</TabsTrigger>
                <TabsTrigger value="PENDING" className="text-xs font-bold rounded-lg px-3">Pending ({withdrawals.filter(w=>w.status==='PENDING').length})</TabsTrigger>
                <TabsTrigger value="PROCESSED" className="text-xs font-bold rounded-lg px-3">Processed ({withdrawals.filter(w=>w.status==='PROCESSED').length})</TabsTrigger>
                <TabsTrigger value="REJECTED" className="text-xs font-bold rounded-lg px-3">Rejected ({withdrawals.filter(w=>w.status==='REJECTED').length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Tx ID, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

          </div>

          {/* Batch Action Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs">
              <span className="font-bold text-blue-700 dark:text-blue-300">
                {selectedIds.length} payout request(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => { setActiveTx(null); setApproveModalOpen(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-lg"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => { setActiveTx(null); setRejectModalOpen(true); }}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs h-8 rounded-lg"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject Selected
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
              <TableRow>
                <TableHead className="w-12 pl-4">
                  <Checkbox 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredWithdrawals.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Amount ($)</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">USDT (BEP-20) Address</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Requested At</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs font-medium">Loading withdrawal queue...</span>
                  </TableCell>
                </TableRow>
              ) : filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((wx) => (
                  <TableRow key={wx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="pl-4">
                      <Checkbox 
                        checked={selectedIds.includes(wx.id)}
                        onCheckedChange={(checked) => handleSelectOne(wx.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-extrabold font-mono text-xs text-slate-900 dark:text-white">
                      {formatCurrency(wx.amount)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      <span className="truncate max-w-[200px] inline-block align-middle">{wx.usdt_address}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {wx.requested}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        wx.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        wx.status === "PROCESSED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-rose-50 text-rose-600 border-rose-200"
                      }`}>
                        {wx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {wx.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            onClick={() => { setActiveTx(wx); setApproveModalOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 rounded-lg px-2.5"
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setActiveTx(wx); setRejectModalOpen(true); }}
                            className="border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs h-7 rounded-lg px-2.5"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-slate-400 text-xs font-medium">
                    No withdrawal requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Approve Payout Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm automated USDT (BEP-20) transfer authorization from master private key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Total Payout Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(activeTx ? activeTx.amount : 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admin Note (Optional)</Label>
              <Input
                placeholder="Optional notes or transaction hash..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="text-xs rounded-xl h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} className="text-xs font-bold rounded-xl h-9">
              Cancel
            </Button>
            <Button onClick={() => handleAction("approve")} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl h-9">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Execute Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Reject Payout Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The requested amount will be refunded back to the user's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rejection Reason</Label>
              <Input
                placeholder="Reason for rejection (e.g. Invalid USDT address)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="text-xs rounded-xl h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="text-xs font-bold rounded-xl h-9">
              Cancel
            </Button>
            <Button onClick={() => handleAction("reject")} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl h-9">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
