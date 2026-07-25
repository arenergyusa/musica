"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ShieldCheck, FileCheck, CheckCircle2, Music } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { APP } from "@/lib/constants";

interface PDFReceiptProps {
  subscription: {
    id: string;
    amount: number;
    created_at: string;
    status: string;
    user_name?: string;
    user_email?: string;
    referral_code?: string;
  } | null;
  onClose: () => void;
}

export function PDFReceipt({ subscription, onClose }: PDFReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!subscription) return null;

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const printWin = window.open("", "_blank", "width=800,height=600");
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tax Invoice - ${subscription.id.slice(0, 8).toUpperCase()}</title>
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; color: #111; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              .items-end { align-items: flex-end; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .font-mono { font-family: monospace; }
              .text-xs { font-size: 12px; }
              .text-sm { font-size: 14px; }
              .text-lg { font-size: 18px; }
              .text-2xl { font-size: 24px; }
              .border-b { border-bottom: 1px solid #e5e7eb; }
              .border-t { border-top: 1px solid #e5e7eb; }
              .pb-4 { padding-bottom: 16px; }
              .pt-4 { padding-top: 16px; }
              .mt-1 { margin-top: 4px; }
              .p-3 { padding: 12px; }
              .rounded-lg { border-radius: 8px; }
              .bg-muted\\/30 { background-color: #f9fafb; }
              .border { border: 1px solid #e5e7eb; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { font-size: 11px; text-transform: uppercase; color: #6b7280; }
            </style>
          </head>
          <body>
            <div>${content}</div>
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
    }
  };

  const createdDate = new Date(subscription.created_at || '').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const receiptNo = `MUS-${subscription.id.slice(0, 8).toUpperCase()}`;

  return (
    <Dialog open={!!subscription} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-500" /> Tax Invoice & Subscription Receipt
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-xs">
              <Printer className="mr-1 h-3 w-3" /> Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Receipt Card */}
        <div ref={receiptRef} className="p-6 space-y-6 text-foreground print:p-8">
          
          {/* Company & Receipt Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded text-primary-foreground font-bold text-sm">
                  <Music className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg">{APP.NAME} ENTERTAINMENT</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Digital Entertainment & Content Monetization Platform</p>
              <p className="text-[10px] text-muted-foreground font-mono">GSTIN: 06AAACM1234F1Z8 • Regd. INDIA</p>
            </div>
            
            <div className="text-right space-y-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono text-xs">
                OFFICIAL RECEIPT
              </Badge>
              <p className="text-xs font-mono font-bold text-primary mt-1">{receiptNo}</p>
              <p className="text-[11px] text-muted-foreground">Date: {createdDate}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-lg border">
            <div>
              <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">Billed To (Subscriber)</p>
              <p className="font-bold text-sm mt-0.5">{subscription.user_name || "Valued Subscriber"}</p>
              <p className="text-muted-foreground">{subscription.user_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">Subscription Pass Details</p>
              <p className="font-mono mt-0.5">Ref Code: <strong>{subscription.referral_code || "N/A"}</strong></p>
              <p className={`font-semibold mt-0.5 ${
                subscription.status === 'ACTIVE' || subscription.status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                Status: {subscription.status || 'PENDING'}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-left font-semibold text-muted-foreground">
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Pass Multiple</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-3">
                  <p className="font-semibold text-sm">Musica VIP Content Pass Subscription</p>
                  <p className="text-[10px] text-muted-foreground">
                    Includes 4K Haryanvi streaming access, early premiere passes, and promotional daily reward credit eligibility.
                  </p>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold">
                  {Math.round(subscription.amount / 10000)}x Tier
                </td>
                <td className="py-3 px-3 text-right font-bold text-sm">
                  {formatCurrency(subscription.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="flex justify-between items-end border-t pt-4">
            <div className="text-[10px] text-muted-foreground space-y-1 max-w-[280px]">
              <p className="flex items-center gap-1 font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Platform Compliance Notice:
              </p>
              <p>
                This receipt certifies the purchase of a digital content sponsorship pass. Daily promotional reward credits are capped at 2x (Non-Working) or 3x (Working). Subject to statutory 10% TDS under Section 194B/194R (TAN: RTKP11658D).
              </p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total Amount Paid</p>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(subscription.amount)}</p>
              {subscription.status === 'ACTIVE' || subscription.status === 'APPROVED' ? (
                <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid & Verified
                </p>
              ) : (
                <p className="text-[10px] text-amber-600 font-medium flex items-center justify-end gap-1">
                  Status: {subscription.status || 'Pending Verification'}
                </p>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
