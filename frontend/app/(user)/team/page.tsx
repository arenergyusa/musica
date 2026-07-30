"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LEVEL_INCOME, LEVEL_THRESHOLDS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamDirect } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users, Copy, CheckCircle2, UserPlus, TrendingUp, ShieldCheck, Search,
  Zap, QrCode, Download, Share2, Network
} from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { QRCodeCanvas } from "qrcode.react";

export default function TeamPage() {
  const { user } = useAuthStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [directs, setDirects] = useState<TeamDirect[]>([]);
  const [stats, setStats] = useState({
    active_volume: 0,
    levels_unlocked: 0,
    is_working: false,
    direct_count: 0,
    direct_volume: 0,
  });
  const [levelIncomeStats, setLevelIncomeStats] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const referralCode = (user as any)?.invite_code || user?.referralCode || (user as any)?.referral_code || "";
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const referralLink = origin
    ? `${origin}/register?invite=${referralCode}`
    : `https://musica.arenergy.us/register?invite=${referralCode}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const [directRes, statsRes, txRes] = await Promise.all([
          api.get("/team/direct"),
          api.get("/team/stats"),
          api.get("/wallet/transactions?limit=500"),
        ]);

        const directsData = directRes.data.data || [];
        setDirects(directsData.map((d: TeamDirect) => ({
          ...d,
          level: "Level 1",
          // The API returns the user's account status. Preserve it instead of
          // relying on an `is_active` field that is not returned by this endpoint.
          status: d.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          investment: d.total_investment || 0
        })));

        if (statsRes.data.data) {
          setStats(statsRes.data.data);
        }

        const txs = txRes.data.data || [];
        const levelMap: Record<number, number> = {};
        txs.forEach((tx: { source?: string; type?: string; amount: number; description?: string }) => {
          if (tx.source === "LEVEL_INCOME" && (tx.type === "CREDIT" || tx.type === "CREDITED")) {
            const match = tx.description?.match(/Level (\d+)/i);
            if (match) {
              const lvl = parseInt(match[1]);
              levelMap[lvl] = (levelMap[lvl] || 0) + tx.amount;
            }
          }
        });
        setLevelIncomeStats(levelMap);
      } catch (error) {
        console.error("Failed to load team data", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) fetchData();
  }, [user]);

  const handleCopy = (text: string, type: "LINK" | "CODE") => {
    if (!text) {
      toast.error("Invite code not ready yet");
      return;
    }
    navigator.clipboard.writeText(text);
    if (type === "LINK") {
      setCopiedLink(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("referral-qr") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `musica-invite-${referralCode}.png`;
    a.click();
    toast.success("QR code downloaded!");
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`🎵 Join Musica — Official Haryanvi Music Streaming Platform!\n\nUse my invite link to register:\n${referralLink}\n\nInvite Code: ${referralCode}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const filteredTeam = directs.filter(member => {
    const matchesSearch = (member.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isWorking = stats.is_working;
  const levelsUnlocked = stats.levels_unlocked || 0;

  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.levels > levelsUnlocked);
  const progressPct = nextThreshold
    ? Math.min((stats.active_volume / nextThreshold.volume) * 100, 100)
    : 100;

  const totalLevelIncome = Object.values(levelIncomeStats).reduce((sum, v) => sum + v, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <PageHeader
        title="My Network"
        description="Manage your team invites and track network performance."
      />

      {/* Invite Link Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 pointer-events-none" />
        <CardContent className="p-6 md:p-7 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Invite Partners &amp; Build Network
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 pr-2">
                <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {referralCode || "—"}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(referralCode, "CODE")} className="h-7 px-2.5 text-xs text-slate-600 hover:text-blue-600">
                  {copiedCode ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <Button onClick={() => handleCopy(referralLink, "LINK")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs h-9 shadow-sm">
                {copiedLink ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </Button>

              <Button variant="outline" onClick={() => setShowQR(!showQR)} className="text-xs h-9 rounded-lg border-slate-200 font-semibold">
                <QrCode className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                {showQR ? "Hide QR" : "Show QR"}
              </Button>
            </div>
          </div>

          {/* QR Code Panel */}
          {showQR && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-4 bg-background rounded-xl border border-border/50 z-10 relative">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <QRCodeCanvas
                  id="referral-qr"
                  value={referralLink}
                  size={140}
                  level="H"
                  imageSettings={{
                    src: "/favicon.ico",
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <p className="font-semibold text-sm">Your Invite QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan to register with your invite code
                  </p>
                  <p className="text-xs font-mono mt-2 text-blue-600">{referralLink}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" onClick={handleDownloadQR}>
                    <Download className="mr-2 h-3.5 w-3.5" /> Download PNG
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleWhatsApp} className="text-green-600 border-green-500/30 hover:bg-green-500/5">
                    <Share2 className="mr-2 h-3.5 w-3.5" /> Share on WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Status + Level Unlock Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Working Status */}
        <Card className={`shadow-sm ${isWorking ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800"}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${isWorking ? "bg-emerald-500/15" : "bg-slate-100 dark:bg-slate-800"}`}>
                <Zap className={`h-5 w-5 ${isWorking ? "text-emerald-500" : "text-slate-400"}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Working Status</p>
                <p className={`font-bold text-base ${isWorking ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                  {isWorking ? "⚡ Working" : "Non-Working"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Unlock Progress */}
        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Levels Unlocked</p>
                <p className="font-bold text-base text-slate-900 dark:text-white">
                  {levelsUnlocked === 0 ? "No levels yet" : `L1–L${levelsUnlocked} Active`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct Invites</p>
              <Users className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{directs.length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">{directs.filter(d => d.status === "ACTIVE").length} active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Team Volume</p>
              <TrendingUp className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.active_volume || 0)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Level Rewards</p>
              <Network className="h-4 w-4 text-blue-600 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalLevelIncome)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Levels</p>
              <ShieldCheck className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{levelsUnlocked === 0 ? "—" : `L1–L${levelsUnlocked}`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Reward Breakdown */}
      {totalLevelIncome > 0 && (
        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Network className="h-4 w-4 text-blue-600" />
              Level Reward Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => {
                const earned = levelIncomeStats[lvl] || 0;
                const pct = LEVEL_INCOME[lvl as keyof typeof LEVEL_INCOME];
                const active = lvl <= levelsUnlocked;
                return (
                  <div
                    key={lvl}
                    className={`p-2.5 rounded-lg text-center text-xs border transition-all ${earned > 0
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 font-bold"
                        : active
                          ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          : "opacity-30 bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                  >
                    <div className="font-bold mb-0.5">L{lvl}</div>
                    <div className="text-[10px] opacity-75">{pct}%</div>
                    {earned > 0 && (
                      <div className="text-[10px] font-semibold mt-0.5">${Math.floor(earned)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Table */}
      <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">My Direct Invites</CardTitle>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search member..."
                className="pl-9 w-full sm:w-[200px] text-xs h-9 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-[130px] text-xs h-9 rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
              <TableRow className="border-b border-slate-100 dark:border-slate-800">
                <TableHead className="pl-6 text-xs font-bold text-slate-700 dark:text-slate-300">Member</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Binary Placement</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Join Date</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs font-bold text-slate-700 dark:text-slate-300">Sponsorship</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.length > 0 ? (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                          {(member.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={member.leg === "RIGHT" ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-200 dark:border-purple-900 text-[11px] font-bold" : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-900 text-[11px] font-bold"}>
                        {member.leg === "RIGHT" ? "RIGHT LEG" : "LEFT LEG"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date((member.createdAt as string) || (member.created_at as string) || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      {member.status === "ACTIVE" ? (
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[11px] font-bold">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 text-[11px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-xs text-slate-900 dark:text-white">
                      {member.investment && member.investment > 0 ? formatCurrency(member.investment) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>{isLoading ? "Loading network details..." : "No members found in your direct network."}</p>
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
