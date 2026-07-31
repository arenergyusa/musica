"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { LEVEL_INCOME, LEVEL_THRESHOLDS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TeamBreakdown, TeamMemberDetail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users, Copy, CheckCircle2, UserPlus, TrendingUp, ShieldCheck,
  Zap, QrCode, Download, Share2, Network
} from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { QRCodeCanvas } from "qrcode.react";

export default function TeamPage() {
  const { user } = useAuthStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const [stats, setStats] = useState({
    active_volume: 0,
    team_value: 0,
    levels_unlocked: 0,
    is_working: false,
    direct_count: 0,
    direct_volume: 0,
    invite_income: 0,
  });
  const [levelIncomeStats, setLevelIncomeStats] = useState<Record<number, number>>({});
  const [breakdown, setBreakdown] = useState<TeamBreakdown>({ levels: [], members: [] });
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [memberStatus, setMemberStatus] = useState("ALL");
  const [breakdownMembers, setBreakdownMembers] = useState<TeamMemberDetail[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const referralCode = inviteCode || (user as any)?.invite_code || user?.referralCode || (user as any)?.referral_code || "";
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const referralLink = origin
    ? `${origin}/register?invite=${referralCode}`
    : `https://musica.arenergy.us/register?invite=${referralCode}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, statsRes, txRes, breakdownRes] = await Promise.all([
          api.get("/user/profile").catch((error) => { console.error("Profile load failed", error); return null; }),
          api.get("/team/stats").catch((error) => { console.error("Team stats load failed", error); return null; }),
          api.get("/wallet/transactions?limit=500").catch((error) => { console.error("Income load failed", error); return null; }),
          api.get("/team/breakdown").catch((error) => { console.error("Team breakdown load failed", error); return null; }),
        ]);

        const profile = profileRes?.data?.data?.user || profileRes?.data?.data;
        setInviteCode(profile?.invite_code || profile?.inviteCode || profile?.referral_code || "");

        if (statsRes?.data?.data) {
          setStats(statsRes.data.data);
        }

        const breakdownData = breakdownRes?.data?.data as TeamBreakdown | undefined;
        setBreakdown(breakdownData || { levels: [], members: [] });
        setBreakdownMembers([]);

        const txs = txRes?.data?.data || [];
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
      }
    }

    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchMembers() {
      if (!selectedLevel) {
        setBreakdownMembers([]);
        return;
      }
      try {
        const query = new URLSearchParams({ status: memberStatus });
        if (selectedLevel) query.set("level", String(selectedLevel));
        const res = await api.get(`/team/breakdown?${query.toString()}`);
        setBreakdownMembers(res.data.data?.members || []);
      } catch (error) {
        console.error("Failed to load level members", error);
        toast.error("Failed to load this team level");
      }
    }
    fetchMembers();
  }, [selectedLevel, memberStatus, breakdown.members]);

  const maskPhone = (phone: string) => {
    if (!phone) return "—";
    const value = phone.replace(/\s+/g, "");
    return value.length <= 4 ? "***" : `${value.slice(0, 2)}******${value.slice(-2)}`;
  };

  const maskEmail = (email: string) => {
    if (!email) return "—";
    const [name, domain] = email.split("@");
    return domain ? `${name.slice(0, 2)}***@${domain}` : "***";
  };

  const maskedInviteCode = (code: string) => code ? `${code.slice(0, 2)}***` : "—";

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

  const isWorking = stats.is_working;
  const levelsUnlocked = Math.max(1, stats.levels_unlocked || 0);

  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.levels > levelsUnlocked);
  const progressPct = nextThreshold
    ? Math.min((stats.active_volume / nextThreshold.volume) * 100, 100)
    : 100;

  const totalLevelIncome = Object.values(levelIncomeStats).reduce((sum, v) => sum + v, 0);
  const levelMemberCount = (level: number) => {
    const summary = breakdown.levels.find((item) => item.level === level);
    const membersCount = breakdown.members.filter((member) => member.level === level).length;
    return Math.max(summary?.total_members || 0, membersCount);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-0 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <PageHeader
        title="My Network"
        description="Manage your team invites and track network performance."
      />

      {/* Invite Link Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-md shadow-blue-950/5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 pointer-events-none" />
        <CardContent className="p-4 sm:p-6 md:p-7 relative z-10">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <UserPlus className="h-3 w-3" /> Referral program
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Invite Partners &amp; Build Network
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">Share your personal invite link and grow your verified community.</p>
            </div>

          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">Your invite code</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-xl sm:text-2xl font-black tracking-[0.18em] text-slate-900 dark:text-white">{referralCode || "Loading..."}</span>
                <Button variant="outline" size="sm" onClick={() => handleCopy(referralCode, "CODE")} className="h-8 shrink-0 rounded-lg bg-white dark:bg-slate-900 text-xs">
                  {copiedCode ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                  {copiedCode ? "Copied" : "Copy code"}
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:items-stretch">
              <Button onClick={() => handleCopy(referralLink, "LINK")} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm">
                {copiedLink ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                {copiedLink ? "Link copied" : "Copy invite link"}
              </Button>
              <Button variant="outline" onClick={() => setShowQR(!showQR)} className="h-10 rounded-lg border-slate-200 font-semibold text-xs">
                <QrCode className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                {showQR ? "Hide QR" : "Show QR code"}
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
        <Card className={`rounded-2xl shadow-sm ${isWorking ? "bg-gradient-to-br from-emerald-500/10 to-white dark:to-slate-900 border-emerald-500/20" : "bg-gradient-to-br from-slate-100/70 to-white dark:from-slate-900 dark:to-slate-950 border-slate-200/80 dark:border-slate-800"}`}>
          <CardContent className="p-4 sm:p-5">
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
        <Card className="rounded-2xl shadow-sm bg-gradient-to-br from-blue-500/10 to-white dark:to-slate-900 border-blue-200/70 dark:border-slate-800">
          <CardContent className="p-4 sm:p-5">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl shadow-sm border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct Invites</p>
              <Users className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{levelMemberCount(1)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Team Value</p>
              <TrendingUp className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.team_value ?? stats.active_volume ?? 0)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Level Income</p>
              <Network className="h-4 w-4 text-blue-600 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalLevelIncome)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200/80 dark:border-slate-800 hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Invite Income</p>
              <ShieldCheck className="h-4 w-4 text-blue-600 opacity-60" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.invite_income || 0)}</p>

          </CardContent>
        </Card>
      </div>

      {/* L1-L15 Team Breakdown */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-5 shadow-sm overflow-hidden">
        <div className="px-1 py-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Network className="h-4 w-4 text-blue-600" />Team Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-1">Click a level row to expand its members.</p>
        </div>
        {(breakdown.levels.length ? breakdown.levels : Array.from({ length: 15 }, (_, i) => ({ level: i + 1, total_members: 0, inactive_count: 0, non_working_count: 0, working_count: 0, total_investment: 0, lifetime_income: 0 }))).map((level) => (
          <div key={level.level} className="border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedLevel(selectedLevel === level.level ? null : level.level);
                setMemberStatus("ALL");
                setExpandedMemberId(null);
              }}
              className="w-full grid grid-cols-[52px_1fr_auto] sm:grid-cols-[70px_1fr_1fr_1fr_auto] items-center gap-3 px-1 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/60"
            >
              <span className="text-sm font-black text-blue-600">{selectedLevel === level.level ? "−" : "+"} L{level.level}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{Math.max(level.total_members, breakdown.members.filter((member) => member.level === level.level).length)} members</span>
              <span className="hidden sm:block text-xs text-slate-500">Invested {formatCurrency(level.total_investment)}</span>
              <span className="hidden sm:block text-xs text-slate-500">Income {formatCurrency(level.lifetime_income)}</span>
              <span className="text-[11px] text-slate-500 whitespace-nowrap">I {level.inactive_count} · N {level.non_working_count} · W {level.working_count}</span>
            </button>

            {selectedLevel === level.level && (
              <div className="pb-4 pl-1 pr-1 sm:pl-[70px]">
                <div className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {["ALL", "INACTIVE", "NON_WORKING", "WORKING"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => { setMemberStatus(status); setExpandedMemberId(null); }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold ${memberStatus === status ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    >
                      {status === "ALL" ? "All" : status === "NON_WORKING" ? "Non-Working" : status.charAt(0) + status.slice(1).toLowerCase()}
                      <span className="ml-1 opacity-70">{status === "ALL" ? Math.max(level.total_members, breakdown.members.filter((member) => member.level === level.level).length) : status === "INACTIVE" ? level.inactive_count : status === "NON_WORKING" ? level.non_working_count : level.working_count}</span>
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {breakdownMembers.length > 0 ? breakdownMembers.map((member) => (
                    <div key={member.id}>
                      <button type="button" onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)} className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_110px_130px_30px] items-center gap-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <span>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">{expandedMemberId === member.id ? "−" : "+"} {member.name}</span>
                          <span className="block text-[11px] text-slate-500">{maskEmail(member.email)} · {maskPhone(member.phone)}</span>
                        </span>
                        <span className="hidden sm:block text-xs text-slate-500">{formatCurrency(member.total_investment)}</span>
                        <span className="hidden sm:block text-xs text-emerald-600">{formatCurrency(member.lifetime_income)}</span>
                        <Badge variant="outline" className={`text-[10px] ${member.status === "WORKING" ? "text-emerald-600 border-emerald-200" : member.status === "NON_WORKING" ? "text-blue-600 border-blue-200" : "text-slate-500"}`}>{member.status === "NON_WORKING" ? "Non-Working" : member.status}</Badge>
                      </button>
                      {expandedMemberId === member.id && (
                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md bg-slate-50 dark:bg-slate-900/70 px-3 py-3 text-xs">
                          <div><p className="text-[10px] uppercase text-slate-400">Phone</p><p className="font-semibold">{maskPhone(member.phone)}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Email</p><p className="font-semibold break-all">{maskEmail(member.email)}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Invite Code</p><p className="font-semibold">{maskedInviteCode(member.invite_code)}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Joined</p><p className="font-semibold">{new Date(member.created_at).toLocaleDateString("en-IN")}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Level / Leg</p><p className="font-semibold">L{member.level} / {member.leg || "—"}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Direct Active</p><p className="font-semibold">{member.direct_active_count}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Invested</p><p className="font-semibold">{formatCurrency(member.total_investment)}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Lifetime Income</p><p className="font-semibold text-emerald-600">{formatCurrency(member.lifetime_income)}</p></div>
                        </div>
                      )}
                    </div>
                  )) : <p className="py-5 text-xs text-slate-500">No members found for this filter.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Level Reward Breakdown */}
      {totalLevelIncome > 0 && (
        <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Network className="h-4 w-4 text-blue-600" />
              Level Income Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-8 gap-2">
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

    </div>
  );
}
