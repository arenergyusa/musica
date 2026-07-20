"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APP } from "@/lib/constants";
import { api } from "@/lib/api";

interface RbfAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export function RbfAgreementModal({ open, onOpenChange, onAccept }: RbfAgreementModalProps) {
  const [adminFee, setAdminFee] = useState<number>(0);
  const [nonWorkingCap, setNonWorkingCap] = useState<number>(2);
  const [workingCap, setWorkingCap] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const tdsPct = 5; // Immutable TDS rule

  useEffect(() => {
    let isActive = true;
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      setError(null);
      setAdminFee(0);
      setNonWorkingCap(2);
      setWorkingCap(3);
      api.get("/settings")
        .then(res => {
          if (!isActive) return;
          const data = res.data?.data;
          if (
            !data ||
            data.withdrawal_fee_pct == null ||
            data.non_working_cap_multiplier == null ||
            data.working_cap_multiplier == null
          ) {
            throw new Error("Incomplete settings data");
          }
          const totalFee = data.withdrawal_fee_pct ?? 10;
          // Admin fee is the total minus the immutable TDS
          setAdminFee(Math.max(0, totalFee - tdsPct));
          setNonWorkingCap(data.non_working_cap_multiplier ?? 2);
          setWorkingCap(data.working_cap_multiplier ?? 3);
        })
        .catch(err => {
          if (!isActive) return;
          console.error("Failed to load settings for agreement", err);
          setError("Failed to load latest terms. Please try again later.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    }
    return () => {
      isActive = false;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl">Platform Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please read the terms carefully before subscribing to {APP.NAME}.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="mx-6 mt-4 p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">1. Nature of the Digital Subscription</h3>
              <p>
                By subscribing to {APP.NAME}, you are purchasing a digital content and services subscription. This is strictly a digital product subscription and promotional reward program. 
                This is <strong>not</strong> an equity purchase, financial security, investment scheme, loan, fixed deposit, or collective investment scheme under any Indian financial regulations (including SEBI or RBI guidelines). You are paying a subscription fee to access premium platform features, content, and promotional benefits.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">2. Non-Refundable Policy</h3>
              <p>
                Your subscription fee is immediately applied towards the provisioning of digital services and the platform&apos;s digital ecosystem. Therefore, the subscription fee is <strong>strictly non-refundable</strong>. You acknowledge that you cannot request a withdrawal, chargeback, or return of your initial subscription fee at any point after successful activation.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">3. Promotional Revenue Share (Rewards) and Caps</h3>
              <p>
                As a promotional benefit to active subscribers, the platform may distribute discretionary daily reward points or revenue share credits based on platform performance. These are promotional rewards and not guaranteed financial returns.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>For <strong>Passive (Non-Working) Subscribers</strong>, total accumulated promotional rewards from all sources (including any referral benefits) are strictly capped at <strong>{nonWorkingCap}x</strong> of the subscription value.</li>
                <li>For <strong>Working Subscribers</strong> (who actively participate in affiliate promotions and refer others), the total promotional reward cap from all sources is extended to <strong>{workingCap}x</strong> of the subscription value.</li>
              </ul>
              <p className="mt-2">Once the respective cap ({nonWorkingCap}x or {workingCap}x) is reached through any combination of promotional rewards, your current reward cycle is considered fully fulfilled and automatically closed. No further rewards will accrue on that subscription.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">4. Affiliate and Referral Program</h3>
              <p>
                Users may choose to participate in our optional affiliate program. Referral rewards are distributed purely as promotional incentives for bringing new active subscribers to the platform. The platform reserves the right to modify, suspend, or terminate affiliate structures at its sole discretion to maintain ecosystem health.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">5. KYC (Know Your Customer) and Compliance</h3>
              <p>
                To comply with local Indian laws, prevent fraud, and adhere to AML (Anti-Money Laundering) guidelines, you must submit valid, government-issued KYC documents (e.g., PAN, Aadhaar) before utilizing withdrawal features. 
                Failure to provide accurate documentation, or providing falsified information, will result in immediate account termination and forfeiture of all accumulated rewards.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">6. Withdrawals, Platform Fees, and Taxes (TDS)</h3>
              <p>
                Withdrawal requests for accumulated reward points can only be initiated on designated processing dates (10th, 20th, and 30th of every month), subject to a minimum balance threshold of ₹1,000. 
                In compliance with the Income Tax Act of India, a mandatory <strong>{tdsPct}% TDS (Tax Deducted at Source)</strong> is deducted on withdrawals. Additionally, a platform maintenance and processing fee of <strong>{adminFee}%</strong> applies to each withdrawal transaction.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">7. Risk Acknowledgement and Liability Disclaimer</h3>
              <p>
                Participation in the subscription and rewards program carries inherent uncertainties. Rewards are directly tied to the platform&apos;s digital content generation and general revenues. While {APP.NAME} employs robust strategies to maintain consistency, actual daily promotional rewards can fluctuate. 
                By proceeding, you explicitly acknowledge that <strong>no fixed or guaranteed returns are promised</strong>. {APP.NAME} and its operating entities shall not be held liable for any direct, indirect, or incidental loss of anticipated rewards. You agree to participate solely at your own discretion.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">8. Dispute Resolution and Jurisdiction</h3>
              <p>
                These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms, the subscription, or the promotional rewards program shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
            </section>
          </div>
        </div>

        <div className="p-6 pt-4 border-t bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onAccept && (
            <Button 
              disabled={isLoading || !!error}
              onClick={() => {
                onAccept();
                onOpenChange(false);
              }}
            >
              I Accept
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
