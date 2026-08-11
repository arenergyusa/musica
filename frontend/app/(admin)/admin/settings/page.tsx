"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PlatformSettings } from "@/lib/types";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Sparkles, RefreshCw, Zap, ShieldCheck, DollarSign, Award, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [salaryTiers, setSalaryTiers] = useState<Record<number, { min_volume_usd: number; monthly_salary_usd: number; max_strong_leg_pct: number; min_weaker_leg_pct: number; monthly_increment_pct: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSalaryTiers();
  }, []);

  const fetchSalaryTiers = async () => {
    try {
      const res = await api.get("/admin/salary/tiers");
      if (Array.isArray(res.data.data)) {
        const toFinite = (val: any, fallback: number) => {
          const n = Number(val);
          return Number.isFinite(n) ? n : fallback;
        };
        const byTier: Record<number, any> = {};
        for (const t of res.data.data) {
          byTier[t.tier] = {
            min_volume_usd: toFinite(t.min_volume_usd, 0),
            monthly_salary_usd: toFinite(t.monthly_salary_usd, 0),
            max_strong_leg_pct: toFinite(t.max_strong_leg_pct, 60),
            min_weaker_leg_pct: toFinite(t.min_weaker_leg_pct, 40),
            monthly_increment_pct: toFinite(t.monthly_increment_pct, 25),
          };
        }
        setSalaryTiers(byTier);
      }
    } catch (error) {
      console.error("Failed to load salary tiers:", error);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/settings");
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load platform settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings, val: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: val,
    } as PlatformSettings);
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const payload: Record<string, string | number> = { id: settings.id as number };

      for (const [key, val] of Object.entries(settings)) {
        if (key === 'id' || key === 'updated_at' || key === 'created_at') continue;
        
        const strVal = val == null ? '' : String(val).trim();
        if (strVal === '') {
          toast.error(`Missing value for ${key.replace(/_/g, ' ')}`);
          setIsSaving(false);
          return;
        }

        const num = Number(strVal);
        if (!Number.isFinite(num) || num < 0) {
          toast.error(`Invalid value for ${key.replace(/_/g, ' ')}`);
          setIsSaving(false);
          return;
        }

        payload[key] = num;
      }

      await api.put("/admin/settings", payload);
      toast.success("Platform settings updated successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-medium">Loading platform configuration parameters...</p>
      </div>
    );
  }

  const dailyReturnPct = (settings.monthly_reward_pct || 10.0) / 30.0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-widest mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Platform Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Settings</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchSettings} 
            variant="outline" 
            size="sm" 
            className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl h-9"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl h-9 shadow-md"
          >
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Global Financial Limits */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <DollarSign className="h-4 w-4 text-blue-600" /> Financial Parameters
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-200 bg-blue-50">USD ($)</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            
            {/* Monthly ROI % */}
            <div className="space-y-1.5 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-900 dark:text-white">Monthly ROI Reward (%)</Label>
                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  Daily: {dailyReturnPct.toFixed(4)}% / day
                </span>
              </div>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.monthly_reward_pct}
                onChange={(e) => handleChange('monthly_reward_pct', parseFloat(e.target.value) || 0)}
                className="h-10 text-xs font-mono font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Minimum Withdrawal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Withdrawal Amount ($)</Label>
              <Input 
                type="number" 
                step="1" 
                value={settings.withdrawal_min_amount}
                onChange={(e) => handleChange('withdrawal_min_amount', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Cap Multipliers */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">INACTIVE/ACTIVE Cap (Multiplier)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.non_working_cap_multiplier}
                  onChange={(e) => handleChange('non_working_cap_multiplier', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Working Cap (Multiplier)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.working_cap_multiplier}
                  onChange={(e) => handleChange('working_cap_multiplier', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Level Unlock Business Requirements */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Award className="h-4 w-4 text-emerald-500" /> Level Unlock Requirements ($)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Levels 1-5 Required Business ($)</Label>
              <Input 
                type="number" 
                step="100" 
                value={settings.level1_to_5_business}
                onChange={(e) => handleChange('level1_to_5_business', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Levels 6-10 Required Business ($)</Label>
              <Input 
                type="number" 
                step="100" 
                value={settings.level1_to_10_business}
                onChange={(e) => handleChange('level1_to_10_business', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Levels 11-15 Required Business ($)</Label>
              <Input 
                type="number" 
                step="100" 
                value={settings.level1_to_15_business}
                onChange={(e) => handleChange('level1_to_15_business', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

          </CardContent>
        </Card>

        {/* Invite Income Rewards */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="h-4 w-4 text-blue-600" /> Invite Income Rates (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 1 Direct Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.invite_reward_l1_pct}
                onChange={(e) => handleChange('invite_reward_l1_pct', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 2 Direct Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.invite_reward_l2_pct}
                onChange={(e) => handleChange('invite_reward_l2_pct', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 3 Direct Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.invite_reward_l3_pct}
                onChange={(e) => handleChange('invite_reward_l3_pct', parseFloat(e.target.value) || 0)}
                className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Level Income Rewards */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Layers className="h-4 w-4 text-indigo-500" /> Level Income Rates (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 1 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l1_pct}
                  onChange={(e) => handleChange('level_income_l1_pct', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 2 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l2_pct}
                  onChange={(e) => handleChange('level_income_l2_pct', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 3 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l3_pct}
                  onChange={(e) => handleChange('level_income_l3_pct', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 4-10 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l4_to_l10_pct}
                  onChange={(e) => handleChange('level_income_l4_to_l10_pct', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Level 11-15 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l11_to_l15_pct}
                  onChange={(e) => handleChange('level_income_l11_to_l15_pct', parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database-Driven Salary Tiers Configuration Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Award className="h-4 w-4 text-purple-600" />
                Dynamic Monthly Salary Tiers Config ($ USD)
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-purple-200 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
              onClick={async () => {
                try {
                  const res = await api.post("/admin/salary/trigger-payout");
                  toast.success(`Salary Payout Triggered! Payouts: ${res.data.payout_count}, Total: $${res.data.total_amount}`);
                } catch (err: any) {
                  toast.error(err.response?.data?.error || "Failed to trigger salary payout");
                }
              }}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Trigger Monthly Salary Payout
            </Button>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((tierNo) => {
                const tier = salaryTiers[tierNo] || {
                  min_volume_usd: 0,
                  monthly_salary_usd: 0,
                  max_strong_leg_pct: 60,
                  min_weaker_leg_pct: 40,
                  monthly_increment_pct: 25,
                };
                const updateTier = async (patch: Partial<typeof tier>) => {
                  try {
                    await api.put("/admin/salary/tiers", {
                      tier: tierNo,
                      min_volume_usd: patch.min_volume_usd ?? tier.min_volume_usd,
                      monthly_salary_usd: patch.monthly_salary_usd ?? tier.monthly_salary_usd,
                      max_strong_leg_pct: tier.max_strong_leg_pct,
                      min_weaker_leg_pct: tier.min_weaker_leg_pct,
                      monthly_increment_pct: tier.monthly_increment_pct,
                    });
                    setSalaryTiers((prev) => ({ ...prev, [tierNo]: { ...tier, ...patch } }));
                    toast.success(`Tier ${tierNo} updated successfully!`);
                  } catch (err: any) {
                    toast.error("Failed to update salary tier");
                  }
                };
                return (
                  <div key={tierNo} className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-purple-600 dark:text-purple-400">Tier {tierNo}</span>
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                        ${tier.monthly_salary_usd}/mo
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500 font-bold">Min Volume ($ USD)</Label>
                      <Input
                        type="number"
                        defaultValue={tier.min_volume_usd}
                        key={`vol-${tierNo}-${tier.min_volume_usd}`}
                        className="h-8 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        onBlur={(e) => {
                          const parsed = Number(e.target.value);
                          const newVol = Number.isFinite(parsed) ? parsed : tier.min_volume_usd;
                          if (newVol !== tier.min_volume_usd) updateTier({ min_volume_usd: newVol });
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500 font-bold">Monthly Salary ($ USD)</Label>
                      <Input
                        type="number"
                        defaultValue={tier.monthly_salary_usd}
                        key={`sal-${tierNo}-${tier.monthly_salary_usd}`}
                        className="h-8 text-xs font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        onBlur={(e) => {
                          const parsed = Number(e.target.value);
                          const newSal = Number.isFinite(parsed) ? parsed : tier.monthly_salary_usd;
                          if (newSal !== tier.monthly_salary_usd) updateTier({ monthly_salary_usd: newSal });
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 font-semibold pt-1 flex justify-between">
                      <span>{tier.max_strong_leg_pct}:{tier.min_weaker_leg_pct} Leg Ratio</span>
                      <span>{tier.monthly_increment_pct}% Maintenance</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl px-8 h-11 text-sm shadow-md">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Platform Configuration
        </Button>
      </div>

    </div>
  );
}
