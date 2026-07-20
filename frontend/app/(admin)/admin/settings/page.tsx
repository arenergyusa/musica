"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { AdminHeader } from "@/components/layout/AdminHeader";

interface PlatformSettings {
  id?: number;
  daily_roi_pct: number;
  withdrawal_fee_pct: number;
  withdrawal_min_amount: number;
  level1_to_5_directs: number;
  level1_to_5_business: number;
  level1_to_10_directs: number;
  level1_to_10_business: number;
  level1_to_15_directs: number;
  level1_to_15_business: number;
  ref_reward_l1_pct: number;
  ref_reward_l2_pct: number;
  ref_reward_l3_pct: number;
  level_income_l1_pct: number;
  level_income_l2_pct: number;
  level_income_l3_pct: number;
  level_income_l4_to_l10_pct: number;
  level_income_l11_to_l15_pct: number;
  non_working_cap_multiplier: number;
  working_cap_multiplier: number;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      console.error("Failed to load settings", err);
      setError(err.response?.data?.message || "Failed to load platform settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const handleChange = (field: keyof PlatformSettings, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: parseFloat(value) || 0,
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success("Settings updated successfully");
      fetchSettings();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      console.error("Failed to update settings", err);
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <div className="text-destructive font-semibold">{error}</div>
        <Button onClick={fetchSettings} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General & Financial</CardTitle>
            <CardDescription>Configure core financial parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Daily ROI Percentage (%)</Label>
              <Input 
                type="number" 
                step="0.0001" 
                value={settings.daily_roi_pct}
                onChange={(e) => handleChange('daily_roi_pct', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Withdrawal Fee Percentage (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.withdrawal_fee_pct}
                onChange={(e) => handleChange('withdrawal_fee_pct', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum Withdrawal Amount (₹)</Label>
              <Input 
                type="number" 
                value={settings.withdrawal_min_amount}
                onChange={(e) => handleChange('withdrawal_min_amount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Non-Working Cap Multiplier (e.g. 2x)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.non_working_cap_multiplier}
                onChange={(e) => handleChange('non_working_cap_multiplier', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Working Cap Multiplier (e.g. 3x)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.working_cap_multiplier}
                onChange={(e) => handleChange('working_cap_multiplier', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level Income Unlocking</CardTitle>
            <CardDescription>Requirements to unlock level income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>L1-L5 Directs Required</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_5_directs}
                  onChange={(e) => handleChange('level1_to_5_directs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>L1-L5 Direct Business (₹)</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_5_business}
                  onChange={(e) => handleChange('level1_to_5_business', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>L1-L10 Directs Required</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_10_directs}
                  onChange={(e) => handleChange('level1_to_10_directs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>L1-L10 Direct Business (₹)</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_10_business}
                  onChange={(e) => handleChange('level1_to_10_business', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>L1-L15 Directs Required</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_15_directs}
                  onChange={(e) => handleChange('level1_to_15_directs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>L1-L15 Direct Business (₹)</Label>
                <Input 
                  type="number" 
                  value={settings.level1_to_15_business}
                  onChange={(e) => handleChange('level1_to_15_business', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct Referral Rewards</CardTitle>
            <CardDescription>One-time percentage reward on subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Level 1 Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.ref_reward_l1_pct}
                onChange={(e) => handleChange('ref_reward_l1_pct', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Level 2 Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.ref_reward_l2_pct}
                onChange={(e) => handleChange('ref_reward_l2_pct', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Level 3 Reward (%)</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={settings.ref_reward_l3_pct}
                onChange={(e) => handleChange('ref_reward_l3_pct', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level Income Rewards</CardTitle>
            <CardDescription>Daily/Recurring income distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level 1 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l1_pct}
                  onChange={(e) => handleChange('level_income_l1_pct', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Level 2 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l2_pct}
                  onChange={(e) => handleChange('level_income_l2_pct', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Level 3 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l3_pct}
                  onChange={(e) => handleChange('level_income_l3_pct', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Level 4-10 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l4_to_l10_pct}
                  onChange={(e) => handleChange('level_income_l4_to_l10_pct', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Level 11-15 (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={settings.level_income_l11_to_l15_pct}
                  onChange={(e) => handleChange('level_income_l11_to_l15_pct', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
