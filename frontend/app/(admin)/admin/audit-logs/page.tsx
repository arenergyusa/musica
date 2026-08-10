"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText, Loader2, RefreshCw } from "lucide-react";

type AuditLog = {
  id: string;
  user_id?: string;
  action: string;
  amount_usd: number;
  usdt_amount: number;
  tx_hash: string;
  status: string;
  details: string;
  created_at: string;
};

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/admin/audit-logs?limit=100&offset=0");
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      toast.error("Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <ScrollText className="h-3.5 w-3.5" /> Transaction Audit Trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            On-chain payout and deposit reconciliation history.
          </p>
        </div>
        <Button onClick={() => { setIsLoading(true); load(); }} variant="outline" size="sm" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">Recent On-Chain Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
              <TableRow>
                <TableHead className="pl-6 text-xs font-bold text-slate-500">Action</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">User</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Amount USD</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">USDT</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Tx Hash</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs font-medium">Loading audit trail...</span>
                  </TableCell>
                </TableRow>
              ) : items.length > 0 ? (
                items.map((a) => (
                  <TableRow key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="pl-6 text-xs font-bold text-slate-900 dark:text-white">{a.action}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {a.user_id ? a.user_id.substring(0, 8) + "…" : "System"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">{formatCurrency(a.amount_usd)}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">{a.usdt_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        a.status === "SUCCESS" || a.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                        a.status === "FAILED" || a.status === "ERROR" ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400" :
                        "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-slate-400 max-w-[160px] truncate">{a.tx_hash || "—"}</TableCell>
                    <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                      {new Date(a.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-400 text-xs font-medium">
                    No audit records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
