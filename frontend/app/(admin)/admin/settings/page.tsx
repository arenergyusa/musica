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
  payment_upi_id: string;
  payment_bank_name: string;
  payment_account_name: string;
  payment_account_number: string;
  payment_ifsc: string;
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      console.error("Failed to load settings", err);
      const errMsg = err.response?.data?.message || "Failed to load platform settings.";
      if (showLoading) {
        setError(errMsg);
      } else {
        toast.error(errMsg);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const handleChange = (field: keyof PlatformSettings, value: number | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    } as unknown as PlatformSettings);
  };

  const handleIfscBlur = async () => {
    if (!settings || !settings.payment_ifsc) return;
    const ifsc = settings.payment_ifsc.trim().toUpperCase();
    
    // Quick regex for IFSC before API call
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return;

    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.BANK) {
          setSettings((prev) => prev ? { ...prev, payment_bank_name: data.BANK } as unknown as PlatformSettings : prev);
          toast.success(`Bank found: ${data.BANK}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch IFSC details:", error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    const percentageFields = [
      'daily_roi_pct', 'withdrawal_fee_pct', 
      'ref_reward_l1_pct', 'ref_reward_l2_pct', 'ref_reward_l3_pct',
      'level_income_l1_pct', 'level_income_l2_pct', 'level_income_l3_pct',
      'level_income_l4_to_l10_pct', 'level_income_l11_to_l15_pct'
    ];
    const directCountFields = [
      'level1_to_5_directs', 'level1_to_10_directs', 'level1_to_15_directs'
    ];

    const paymentFields = [
      'payment_upi_id', 'payment_bank_name', 'payment_account_name', 
      'payment_account_number', 'payment_ifsc'
    ];

    const payload: Record<string, string | number> = { id: settings.id as number };

    for (const [key, val] of Object.entries(settings)) {
      if (key === 'id' || key === 'updated_at' || key === 'created_at') continue;
      
      // Treat null or undefined as empty string
      const strVal = val == null ? '' : String(val).trim();
      if (strVal === '' && !paymentFields.includes(key)) {
        toast.error(`Missing value for ${key.replace(/_/g, ' ')}`);
        return;
      }

      if (paymentFields.includes(key)) {
        if (strVal === '') {
          payload[key] = '';
          continue;
        }
        if (key === 'payment_upi_id' && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(strVal)) {
          toast.error("Invalid UPI ID format. E.g., name@bank");
          return;
        }
        if (key === 'payment_ifsc' && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(strVal)) {
          toast.error("Invalid IFSC format. E.g., HDFC0001234");
          return;
        }
        if (key === 'payment_account_number' && !/^\d{9,18}$/.test(strVal)) {
          toast.error("Account Number must be between 9 and 18 digits");
          return;
        }
        
        // uppercase IFSC on save
        payload[key] = key === 'payment_ifsc' ? strVal.toUpperCase() : strVal;
        continue;
      }

      const num = Number(strVal);
      if (!Number.isFinite(num) || num < 0) {
        toast.error(`Invalid value for ${key.replace(/_/g, ' ')}`);
        return;
      }
      
      if (directCountFields.includes(key) && !Number.isInteger(num)) {
        toast.error(`Invalid value for ${key.replace(/_/g, ' ')}`);
        return;
      }
      
      if (percentageFields.includes(key) && num > 100) {
        toast.error(`${key.replace(/_/g, ' ')} cannot exceed 100%`);
        return;
      }

      if (key === 'daily_roi_pct') {
        const decimals = strVal.split('.')[1];
        if (decimals && decimals.length > 4) {
          toast.error(`Invalid value for ${key.replace(/_/g, ' ')}`);
          return;
        }
      }
      
      payload[key] = num;
    }
    
    if ((payload.non_working_cap_multiplier as number) < 1 || (payload.working_cap_multiplier as number) < 1) {
      toast.error("Cap multipliers must be at least 1");
      return;
    }
    
    if ((payload.level1_to_10_directs as number) < (payload.level1_to_5_directs as number) || (payload.level1_to_15_directs as number) < (payload.level1_to_10_directs as number)) {
      toast.error("Direct referral requirements must be ordered (L5 <= L10 <= L15)");
      return;
    }
    
    if ((payload.level1_to_10_business as number) < (payload.level1_to_5_business as number) || (payload.level1_to_15_business as number) < (payload.level1_to_10_business as number)) {
      toast.error("Business thresholds must be ordered (L5 <= L10 <= L15)");
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/admin/settings', payload);
      toast.success("Settings updated successfully");
      await fetchSettings(false);
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
        <Button onClick={() => fetchSettings(true)} variant="outline">
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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>Configure bank details and UPI for user subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input 
                  placeholder="e.g. musica@hdfcbank"
                  value={settings.payment_upi_id || ''}
                  onChange={(e) => handleChange('payment_upi_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input 
                  placeholder="e.g. HDFC Bank"
                  value={settings.payment_bank_name || ''}
                  onChange={(e) => handleChange('payment_bank_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input 
                  placeholder="e.g. Musica RBF Solutions Pvt Ltd"
                  value={settings.payment_account_name || ''}
                  onChange={(e) => handleChange('payment_account_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                  placeholder="e.g. 50200012345678"
                  value={settings.payment_account_number || ''}
                  onChange={(e) => handleChange('payment_account_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input 
                  placeholder="e.g. HDFC0001234"
                  value={settings.payment_ifsc || ''}
                  onChange={(e) => handleChange('payment_ifsc', e.target.value.toUpperCase())}
                  onBlur={handleIfscBlur}
                />
                <p className="text-xs text-muted-foreground">Bank name will be auto-filled if valid</p>
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
