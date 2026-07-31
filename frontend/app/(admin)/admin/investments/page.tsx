"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Loader2, TrendingUp } from "lucide-react";

type Investment = { id: string; user_id: string; amount: number; status: string; created_at: string; total_reward_earned: number };

export default function AdminInvestmentsPage() {
  const [items, setItems] = useState<Investment[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/investments${filter === "ALL" ? "" : `?status=${filter}`}`);
      setItems(res.data.data || []);
    } catch { toast.error("Failed to fetch sponsorships"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.put(`/admin/investments/${id}/status`, { status });
      toast.success(`Sponsorship marked ${status.toLowerCase()}`);
      load();
    } catch { toast.error("Failed to update sponsorship status"); }
    finally { setUpdating(null); }
  };

  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
      <div><div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1"><TrendingUp className="h-3.5 w-3.5" /> Sponsorship Review</div><h1 className="text-2xl sm:text-3xl font-extrabold">Investment Queue</h1><p className="text-xs text-slate-400 mt-1">Approve or close pending investment/sponsorship requests.</p></div>
      <Button onClick={load} variant="outline" size="sm" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
    </div>
    <Card className="rounded-xl overflow-hidden"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Sponsorships</CardTitle><Select value={filter} onValueChange={(value) => setFilter(value || "ALL")}><SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="CLOSED">Closed</SelectItem><SelectItem value="ALL">All</SelectItem></SelectContent></Select></CardHeader><CardContent className="p-0 overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50 dark:bg-slate-950/40"><tr><th className="text-left p-4">User</th><th className="text-left p-4">Amount</th><th className="text-left p-4">Created</th><th className="text-left p-4">Status</th><th className="text-right p-4">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-12 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr> : items.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-400">No sponsorships found.</td></tr> : items.map(item => <tr key={item.id} className="border-t"><td className="p-4 font-mono">{item.user_id}</td><td className="p-4 font-bold">{formatCurrency(item.amount)}</td><td className="p-4 text-slate-500">{new Date(item.created_at).toLocaleString()}</td><td className="p-4"><Badge variant="outline">{item.status}</Badge></td><td className="p-4 text-right">{item.status === "PENDING" && <div className="flex justify-end gap-2"><Button disabled={updating === item.id} onClick={() => updateStatus(item.id, "ACTIVE")} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs">{updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}</Button><Button disabled={updating === item.id} onClick={() => updateStatus(item.id, "CLOSED")} size="sm" variant="outline" className="h-8 text-xs text-rose-600">Close</Button></div>}</td></tr>)}</tbody></table></CardContent></Card>
  </div>;
}
