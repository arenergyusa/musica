"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { Transaction } from "@/lib/types";

import { api } from "@/lib/api";

export default function IncomeHistoryPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchIncome() {
      try {
        const response = await api.get("/wallet/transactions?limit=500");
        const credits = (response.data.data || []).filter((tx: Transaction) => tx.type === "CREDIT" || tx.type === "CREDITED");
        setTransactions(credits);
      } catch (error) {
        console.error("Error fetching income history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncome();
  }, []);

  const filteredHistory = useMemo(() => transactions.filter(tx => {
    const matchesType = typeFilter === "ALL" || 
      tx.source === typeFilter || 
      (typeFilter === "DAILY_ROI" && (tx.source === "DAILY_REWARD" || tx.source === "DAILY_ROI")) ||
      (typeFilter === "REFERRAL" && (tx.source === "INVITE" || tx.source === "REFERRAL")) ||
      (typeFilter === "SALARY_INCOME" && (tx.source === "SALARY" || tx.source === "SALARY_INCOME"));
    const matchesSearch = (tx.description || tx.source).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }), [transactions, typeFilter, searchQuery]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "DAILY_ROI":
      case "DAILY_REWARD":
        return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 text-xs font-semibold">📈 Daily Income</Badge>;
      case "REFERRAL":
      case "INVITE":
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 text-xs font-semibold">👥 Invite Income</Badge>;
      case "LEVEL_INCOME":
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 text-xs font-semibold">🌐 Level Income</Badge>;
      case "SALARY_INCOME":
      case "SALARY":
        return <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200 text-xs font-semibold">💰 Salary Income</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <PageHeader title="Income History" />

      {/* Income History Table */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">Detailed Income Statement</CardTitle>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search description..."
                className="pl-9 w-full sm:w-[200px] h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 font-semibold text-slate-900 dark:text-white outline-none"
            >
              <option value="ALL">All Income Sources</option>
              <option value="DAILY_ROI">Daily Income</option>
              <option value="REFERRAL">Invite Income</option>
              <option value="LEVEL_INCOME">Level Income</option>
              <option value="SALARY_INCOME">Salary Income</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="pl-5 text-xs font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Income Type</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</TableHead>
                <TableHead className="text-right pr-5 text-xs font-bold text-slate-700 dark:text-slate-300">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <TableCell className="pl-5 font-medium whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                      {new Date(tx.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{getTypeBadge(tx.source)}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-900 dark:text-white max-w-[250px] truncate">
                      {tx.description || tx.source}
                    </TableCell>
                    <TableCell className="text-right pr-5 font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-xs text-slate-400">
                    {isLoading ? "Loading income records..." : "No income records found for this filter."}
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
