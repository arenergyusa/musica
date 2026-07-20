"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { APP } from "@/lib/constants";

interface RbfAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export function RbfAgreementModal({ open, onOpenChange, onAccept }: RbfAgreementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl">Revenue-Based Financing (RBF) Agreement</DialogTitle>
          <DialogDescription>
            Please read the terms carefully before investing with {APP.NAME}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">1. Nature of Investment</h3>
              <p>
                By investing in {APP.NAME}, you are participating in a Revenue-Based Financing (RBF) arrangement. 
                This is <strong>not</strong> an equity purchase, loan, or a traditional fixed deposit. You are 
                providing capital to be utilized for entertainment production in exchange for a share of future revenues.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">2. Non-Refundable Principal</h3>
              <p>
                In an RBF model, your initial capital (the principal amount) is immediately deployed into 
                production pipelines and is <strong>strictly non-refundable</strong>. You cannot request a withdrawal 
                or return of your initial principal at any point.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">3. Daily Rewards and Caps</h3>
              <p>
                Returns are generated purely through daily payouts (Revenue Share) based on your selected plan.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>For <strong>Passive (Non-Working) Investors</strong>, total earnings from all income sources are capped at <strong>2x</strong> of the investment amount.</li>
                <li>For <strong>Working Investors</strong> (who actively refer others and build a team), the total earnings cap is extended to <strong>3x</strong> of the investment amount.</li>
              </ul>
              <p className="mt-2">Once the respective cap (2x or 3x) is reached, the investment agreement is considered fulfilled and automatically closed.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">4. KYC and Compliance</h3>
              <p>
                You are required to submit valid KYC documents (Aadhaar and PAN) before making any investment. 
                Failure to provide accurate documentation may result in account suspension and forfeiture of rewards.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">5. Withdrawals and Taxes</h3>
              <p>
                Withdrawals can only be requested on designated dates (10th, 20th, and 30th of every month) 
                subject to a minimum balance of ₹1,000. All withdrawals are subject to a mandatory <strong>10% TDS deduction</strong> as per Indian tax laws.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground text-base mb-2">6. Risk Acknowledgement</h3>
              <p>
                Investment in entertainment production carries inherent market risks. While {APP.NAME} employs 
                strict risk-mitigation strategies, actual revenues can fluctuate. By proceeding, you acknowledge 
                these risks.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onAccept && (
            <Button onClick={() => {
              onAccept();
              onOpenChange(false);
            }}>
              I Accept
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
