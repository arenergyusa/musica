/* eslint-disable */
"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { CapProgressBar } from "@/components/shared/CapProgressBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Investment } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Calendar, Activity, Lock, Wallet, PlusCircle } from "lucide-react";
import Link from "next/link";

import { useEffect } from "react";
import { api } from "@/lib/api";

export default function InvestmentsPage() {
  const [filter, setFilter] = useState("ALL");
  const [investments, setInvestments] = useState<Investment[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const invRes = await api.get("/investment/my");
        setInvestments(invRes.data.data || []);
      } catch (error) {
        console.error("Error fetching investments:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    totalInvested: investments.reduce((acc, curr) => acc + curr.amount, 0),
    totalEarned: investments.reduce((acc, curr) => acc + (curr.total_reward_earned || 0), 0),
    activeCount: investments.filter(i => i.status === "ACTIVE").length,
  };

  const enrichedInvestments = investments.map(inv => {
    return {
      ...inv,
      planName: "RBF Pool Contribution",
      dailyRoi: inv.daily_rate_pct ? (inv.amount * (inv.daily_rate_pct as number)) / 100 : (inv.amount * 0.3333) / 100
    };
  });

  const filteredInvestments = enrichedInvestments.filter(inv => {
    if (filter === "ALL") return true;
    return inv.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Active</Badge>;
      case "CAPPED":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">Capped (Max Reached)</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <PageHeader
        title="My Investments"
        description="Track your active RBF pool contributions, daily revenue share credits, and cap progress."
        action={
          <Link href="/invest">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Investment
            </Button>
          </Link>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-primary">Total Invested</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalInvested)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalEarned)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-none w-full">
        {["ALL", "ACTIVE", "CAPPED", "CLOSED"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="rounded-full shrink-0 px-5"
            onClick={() => setFilter(f)}
          >
            {f === "ALL" ? "All Plans" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      <div className="w-full">
          {filteredInvestments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInvestments.map((inv) => (
                <Card key={inv.id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  <div className={`h-1.5 w-full ${inv.status === "ACTIVE" ? "bg-primary" : "bg-muted"}`} />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-xl">{inv.planName}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="mr-1 h-3.5 w-3.5" />
                          Started: {new Date(inv.created_at || '').toLocaleDateString()}
                        </div>
                      </div>
                      {getStatusBadge(inv.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-grow">
                    
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Principal Invested</p>
                        <p className="text-xl font-bold">{formatCurrency(inv.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Daily ROI</p>
                        <p className="text-xl font-bold text-emerald-500">+{formatCurrency(inv.dailyRoi)}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="font-normal text-xs">
                          {inv.working_cap_at_creation ? "3X Working Cap" : "2X Non-Working Cap"}
                        </Badge>
                      </div>
                      <CapProgressBar 
                        currentAmount={inv.total_reward_earned || 0} 
                        maxCapAmount={inv.cap_limit || 0} 
                      />
                    </div>

                  </CardContent>
                  <CardFooter className="pt-4 border-t bg-muted/10">
                    <Link href="/wallet" className="w-full">
                      <Button variant="ghost" className="w-full text-primary justify-between">
                        View ROI History <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No investments found"
              description="You don't have any contributions matching this filter. Check out our RBF pools to participate."
              action={
                <Link href="/invest">
                  <Button>Explore Pools</Button>
                </Link>
              }
            />
          )}
      </div>

    </div>
  );
}
