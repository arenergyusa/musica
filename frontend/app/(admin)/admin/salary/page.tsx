"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Loader2, RefreshCw, Zap } from "lucide-react";

type Qual = {
  user_id: string;
  user_name?: string;
  user_email?: string;
  tier: number;
  left_leg_volume: number;
  right_leg_volume: number;
  total_volume: number;
  status: string;
  last_payout_at?: string;
  updated_at: string;
};

type PayoutLog = {
  user_id: string;
  user_name?: string;
  user_email?: string;
  tier: number;
  amount_usd: number;
  total_volume: number;
  cycle_month?: string;
  created_at: string;
};

export default function AdminSalaryPage() {
  const [quals, setQuals] = useState<Qual[]>([]);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const load = async () => {
    try {
      const [qRes, pRes] = await Promise.all([
        api.get("/admin/salary/qualifications?limit=100&offset=0"),
        api.get("/admin/salary/payout-logs?limit=100&offset=0"),
      ]);
      setQuals(qRes.data.data || []);
      setPayouts(pRes.data.data || []);
    } catch (err) {
      console.error("Failed to load salary data", err);
      toast.error("Failed to load salary dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await api.post("/admin/salary/trigger-payout");
      toast.success(`Salary Payout Triggered! Payouts: ${res.data.payout_count}, Total: $${res.data.total_amount}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to trigger salary payout");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <Award className="h-3.5 w-3.5" /> Binary Salary System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Salary Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Qualified members, leg volumes, and monthly salary payout history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setLoading(true); load(); }} variant="outline" size="sm" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleTrigger} disabled={triggering} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl h-9">
            <Zap className={`mr-1.5 h-3.5 w-3.5 ${triggering ? "animate-pulse" : ""}`} />
            {triggering ? "Processing..." : "Trigger Monthly Payout"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="qualified" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <TabsTrigger value="qualified" className="text-xs font-bold rounded-lg px-3">
            Qualified Members ({quals.length})
          </TabsTrigger>
          <TabsTrigger value="payouts" className="text-xs font-bold rounded-lg px-3">
            Payout History ({payouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qualified">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
                  <TableRow>
                    <TableHead className="pl-6 text-xs font-bold text-slate-500">Member</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Tier</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Left Leg</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Right Leg</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Total Volume</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Last Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                        <span className="text-xs font-medium">Loading qualifications...</span>
                      </TableCell>
                    </TableRow>
                  ) : quals.length > 0 ? (
                    quals.map((q) => (
                      <TableRow key={q.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{q.user_name || "—"}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{q.user_email || q.user_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400">
                            Tier {q.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">{formatCurrency(q.left_leg_volume)}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">{formatCurrency(q.right_leg_volume)}</TableCell>
                        <TableCell className="text-xs font-black font-mono text-slate-900 dark:text-white">{formatCurrency(q.total_volume)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                            {q.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                          {q.last_payout_at ? new Date(q.last_payout_at).toLocaleDateString() : "Never"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-slate-400 text-xs font-medium">
                        No salary qualifications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40">
                  <TableRow>
                    <TableHead className="pl-6 text-xs font-bold text-slate-500">Member</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Tier</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Amount Paid</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500">Cycle</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Paid At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                        <span className="text-xs font-medium">Loading payout history...</span>
                      </TableCell>
                    </TableRow>
                  ) : payouts.length > 0 ? (
                    payouts.map((p, i) => (
                      <TableRow key={`${p.user_id}-${i}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{p.user_name || "—"}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{p.user_email || p.user_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400">
                            Tier {p.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-extrabold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount_usd)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">{p.cycle_month || "—"}</TableCell>
                        <TableCell className="text-right pr-6 text-slate-400 text-xs font-mono">
                          {new Date(p.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-slate-400 text-xs font-medium">
                        No salary payouts recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
