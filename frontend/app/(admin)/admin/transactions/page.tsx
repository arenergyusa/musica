"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ReceiptText, Loader2, RefreshCw, Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type Tx = {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  type: string;
  amount: number;
  source: string;
  reference_id?: string;
  description?: string;
  created_at: string;
};

const SOURCES = [
  { value: "", label: "All Sources" },
  { value: "DAILY_REWARD", label: "Daily Reward" },
  { value: "LEVEL_INCOME", label: "Level Income" },
  { value: "INVITE", label: "Invite Bonus" },
  { value: "SALARY_INCOME", label: "Salary Income" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
];

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 50;
  const [hasMore, setHasMore] = useState(false);

  const load = async (nextOffset = 0, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      if (search) params.set("user_id", search);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(nextOffset));
      const res = await api.get(`/admin/transactions?${params.toString()}`);
      const data = res.data.data || [];
      setItems(prev => (append ? [...prev, ...data] : data));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(nextOffset);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      toast.error("Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const handleSearch = () => {
    setItems([]);
    load(0);
  };

  const totalCredits = items.filter(t => t.type === "CREDIT").reduce((a, c) => a + c.amount, 0);
  const totalDebits = items.filter(t => t.type === "DEBIT").reduce((a, c) => a + c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <ReceiptText className="h-3.5 w-3.5" /> Wallet Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Transaction Ledger</h1>
        </div>
        <Button onClick={() => { setIsLoading(true); load(0); }} variant="outline" size="sm" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page Credits</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(totalCredits)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page Debits</p>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(totalDebits)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>
          <Select value={source} onValueChange={(val) => setSource(val || "")}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SOURCES.map(s => (
                <SelectItem key={s.value || "all"} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
              <TableRow>
                <TableHead className="pl-6 text-xs font-bold text-slate-500">Member</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Type</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Source</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Amount</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs font-medium">Loading transactions...</span>
                  </TableCell>
                </TableRow>
              ) : items.length > 0 ? (
                items.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{tx.user_name || "—"}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{tx.user_email || tx.user_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${tx.type === "CREDIT" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"}`}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{tx.source}</TableCell>
                    <TableCell className={`font-extrabold font-mono text-xs ${tx.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {tx.type === "CREDIT" ? "+" : "−"}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-slate-400 text-xs font-medium">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {hasMore && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => load(offset + PAGE_SIZE, true)} disabled={isLoading} className="text-xs font-bold rounded-lg h-8">
                {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
