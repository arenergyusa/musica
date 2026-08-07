"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Award, AlertCircle, CheckCircle2, Clock, Scale, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export interface SalaryProgress {
  current_tier: number;
  current_salary_usd: number;
  next_tier?: {
    tier: number;
    min_volume_usd: number;
    monthly_salary_usd: number;
    max_strong_leg_pct: number;
    min_weaker_leg_pct: number;
    monthly_increment_pct: number;
  };
  left_leg_volume: number;
  right_leg_volume: number;
  total_volume: number;
  target_volume_usd: number;
  remaining_volume_usd: number;
  strong_leg_volume: number;
  weaker_leg_volume: number;
  weaker_leg_required_usd: number;
  weaker_leg_remaining_usd: number;
  leg_ratio_met: boolean;
  monthly_increment_target: number;
  monthly_increment_achieved: number;
  monthly_increment_remaining: number;
  days_remaining_in_cycle: number;
  status: string;
  has_received_salary: boolean;
}

// ─── Animated circular progress ring ─────────────────────────────────────────
function CircularProgress({ value, size = 80, stroke = 6, color = "#a78bfa" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700/60" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeDasharray={circumference}
        style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
      />
    </svg>
  );
}

// ─── Animated horizontal bar ─────────────────────────────────────────────────
function GlowBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <div className="relative h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)`, boxShadow: `0 0 12px ${color}40` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function SalaryProgressCard() {
  const [data, setData] = useState<SalaryProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSalaryProgress() {
      try {
        const res = await api.get("/salary/progress");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load salary progress", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSalaryProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-lg animate-pulse">
        <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg mb-5" />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </div>
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const targetVol = data.target_volume_usd || 50000;
  const volPct = Math.min(100, Math.max(0, (data.total_volume / targetVol) * 100));

  const totalLegVol = data.left_leg_volume + data.right_leg_volume;
  const leftPct = totalLegVol > 0 ? (data.left_leg_volume / totalLegVol) * 100 : 50;
  const rightPct = totalLegVol > 0 ? (data.right_leg_volume / totalLegVol) * 100 : 50;

  const monthlyIncPct = data.monthly_increment_target > 0
    ? Math.min(100, Math.max(0, (data.monthly_increment_achieved / data.monthly_increment_target) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 p-6 sm:p-7 space-y-6">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25">
                <Award className="h-6 w-6" />
              </div>
              {data.current_tier > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 shadow">
                  {data.current_tier}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                Salary Program
              </h3>
            </div>
          </div>

          {/* Salary amount hero */}
          <div className="flex items-center gap-4 sm:text-right">
            <div className="hidden sm:block">
              <CircularProgress value={volPct} size={64} stroke={5} color="#8b5cf6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Monthly Salary</span>
              <span className="text-2xl sm:text-3xl font-black font-mono bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent leading-none">
                {formatCurrency(data.current_salary_usd)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium ml-0.5">/ month</span>
            </div>
          </div>
        </div>

        {/* ═══ QUICK STATS ROW ═══ */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Volume */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 transition-all hover:border-blue-300 dark:hover:border-blue-700/60">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Total Volume</span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white">{formatCurrency(data.total_volume)}</span>
            <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          {/* Target */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 transition-all hover:border-purple-300 dark:hover:border-purple-700/60">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Target</span>
            <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white">{formatCurrency(targetVol)}</span>
            <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <ArrowUpRight className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          {/* Remaining */}
          <div className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 transition-all hover:border-amber-300 dark:hover:border-amber-700/60">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Remaining</span>
            <span className={`text-base sm:text-lg font-extrabold font-mono ${data.remaining_volume_usd > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {data.remaining_volume_usd > 0 ? formatCurrency(data.remaining_volume_usd) : "Done ✓"}
            </span>
            <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className="h-12 w-12 text-amber-500" />
            </div>
          </div>
        </div>

        {/* ═══ VOLUME PROGRESS BAR ═══ */}
        <div className="space-y-2.5 rounded-xl bg-gradient-to-r from-blue-50/60 via-slate-50/40 to-purple-50/60 dark:from-blue-950/20 dark:via-slate-800/30 dark:to-purple-950/20 p-4 border border-slate-100/80 dark:border-slate-700/40">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              Volume Progress
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
              {volPct.toFixed(1)}%
            </span>
          </div>
          <GlowBar value={volPct} color="#3b82f6" />
          <div className="text-[11px] pt-0.5">
            {data.remaining_volume_usd > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formatCurrency(data.remaining_volume_usd)} remaining to unlock next tier
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Target achieved
              </span>
            )}
          </div>
        </div>

        {/* ═══ 60:40 LEG BALANCE ═══ */}
        <div className="space-y-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-violet-50/50 dark:from-blue-950/20 dark:to-violet-950/20 p-4 border border-slate-100/80 dark:border-slate-700/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-purple-500" />
              Leg Balance (60:40 Ratio)
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${data.leg_ratio_met
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"}`}>
              {data.leg_ratio_met ? <><CheckCircle2 className="h-3 w-3" /> Balanced</> : <><AlertCircle className="h-3 w-3" /> Pending</>}
            </span>
          </div>

          {/* Dual-color split bar */}
          <div className="relative w-full h-4 rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-700/50 flex">
            <motion.div
              className="h-full rounded-l-full"
              style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)", boxShadow: "0 0 10px #3b82f640" }}
              initial={{ width: 0 }}
              animate={{ width: `${leftPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa)", boxShadow: "0 0 10px #8b5cf640" }}
              initial={{ width: 0 }}
              animate={{ width: `${rightPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
            />
            {/* Center divider marker */}
            <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-white/60 dark:bg-slate-300/30" />
          </div>

          {/* Leg stat chips */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 p-3 border border-blue-100/80 dark:border-blue-900/40">
              <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Left Leg (Junior)</span>
                <span className="text-sm font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.left_leg_volume)} <span className="text-[10px] font-semibold text-slate-400">({leftPct.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 p-3 border border-purple-100/80 dark:border-purple-900/40">
              <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-purple-500 to-violet-400" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Right Leg (Big)</span>
                <span className="text-sm font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {formatCurrency(data.right_leg_volume)} <span className="text-[10px] font-semibold text-slate-400">({rightPct.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          </div>

          {data.weaker_leg_remaining_usd > 0 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-200/60 dark:border-amber-800/40">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span><strong>{formatCurrency(data.weaker_leg_remaining_usd)}</strong> more volume needed in weaker leg</span>
            </div>
          )}
        </div>

        {/* ═══ 25% MONTHLY INCREMENT TRACKER ═══ */}
        {data.has_received_salary && (
        <div className="space-y-2.5 rounded-xl bg-gradient-to-r from-purple-50/60 to-fuchsia-50/40 dark:from-purple-950/25 dark:to-fuchsia-950/15 p-4 border border-purple-100/80 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-purple-500" />
              Monthly Growth (25% Target)
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-mono text-xs font-bold">
              {monthlyIncPct.toFixed(0)}%
            </span>
          </div>
          <GlowBar value={monthlyIncPct} color="#8b5cf6" delay={0.3} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-0.5">
            {data.monthly_increment_remaining > 0 ? (
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                <strong className="text-purple-600 dark:text-purple-400">{formatCurrency(data.monthly_increment_remaining)}</strong> remaining
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold">
              <Clock className="h-3 w-3" />
              {data.days_remaining_in_cycle} days left
            </span>
          </div>
        </div>
        )}

      </div>
    </motion.div>
  );
}
