/* eslint-disable */
"use client";

import { useState, useEffect, useMemo } from "react";
import { APP } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Coins, Users, Network, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        const response = await api.get("/wallet/transactions?limit=100");
        // Only keep CREDIT transactions
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

  const stats = {
    dailyRoi: transactions.filter(t => t.source === "DAILY_ROI").reduce((acc, curr) => acc + curr.amount, 0),
    referral: transactions.filter(t => t.source === "REFERRAL").reduce((acc, curr) => acc + curr.amount, 0),
    level: transactions.filter(t => t.source === "LEVEL_INCOME").reduce((acc, curr) => acc + curr.amount, 0),
  };

  const filteredHistory = transactions.filter(tx => {
    const matchesType = typeFilter === "ALL" || tx.source === typeFilter;
    const matchesSearch = (tx.description || tx.source).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "DAILY_ROI":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Daily ROI</Badge>;
      case "REFERRAL":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Referral</Badge>;
      case "LEVEL_INCOME":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Level</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <PageHeader
        title="Income History"
        description="Detailed breakdown of your lifetime revenue share credits across all pool contributions."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Total Daily ROI
              <Coins className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.dailyRoi)}</div>
            <p className="text-xs text-muted-foreground mt-1">From active investments</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Total Referral Income
              <Users className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.referral)}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct L1 referrals</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
              Total Level Income
              <Network className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.level)}</div>
            <p className="text-xs text-muted-foreground mt-1">From network activity</p>
          </CardContent>
        </Card>
      </div>


      {/* History Table */}
      <Card className="shadow-sm border">
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
          <CardTitle className="text-lg">Detailed Statement</CardTitle>
          
          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto items-start lg:items-center justify-between">
            {/* Pill Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 lg:pb-0 w-full lg:w-auto">
              {[
                { id: "ALL", label: "All" }, 
                { id: "DAILY_ROI", label: "Daily ROI" }, 
                { id: "REFERRAL", label: "Referral" }, 
                { id: "LEVEL_INCOME", label: "Level Income" }
              ].map((f) => (
                <Button
                  key={f.id}
                  variant={typeFilter === f.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full shrink-0"
                  onClick={() => setTypeFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search source..."
                className="pl-9 w-full rounded-full bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right pr-6">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6 text-muted-foreground">{new Date(tx.created_at || '').toLocaleDateString()}</TableCell>
                    <TableCell>{getTypeBadge(tx.source)}</TableCell>
                    <TableCell className="font-medium">{tx.description || tx.source}</TableCell>
                    <TableCell className="text-right pr-6 font-bold text-emerald-500">
                      +{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No income records found for this filter.
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
