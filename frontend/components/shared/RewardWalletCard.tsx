"use client";

import { useState } from "react";
import { Wallet, ArrowRight, Eye, EyeOff, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface RewardWalletProps {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  nextWithdrawalDate?: Date;
}

export function RewardWalletCard({
  balance,
  totalEarned,
  totalWithdrawn,
  nextWithdrawalDate = new Date(new Date().setHours(23, 59, 59, 999)) // Default to end of today
}: RewardWalletProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none shadow-xl relative">
      {/* Decorative background patterns */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />
      
      <CardContent className="p-6 sm:p-8 relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center text-primary-foreground/80 mb-2">
              <Wallet className="h-5 w-5 mr-2" />
              <h2 className="font-medium text-lg">Reward Wallet</h2>
            </div>
            
            <div className="flex items-center">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight flex items-center">
                <IndianRupee className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
                {showBalance ? balance.toLocaleString('en-IN') : "••••••"}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-3 text-primary-foreground/70 hover:text-white hover:bg-white/20 rounded-full"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          <Link href="/wallet" passHref>
            <Button 
              className="bg-white text-primary hover:bg-white/90 shadow-lg font-semibold rounded-full px-6"
            >
              Withdraw <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Separator className="bg-primary-foreground/20 mb-6" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">Total Earned</p>
            <p className="text-lg font-semibold">{formatCurrency(totalEarned)}</p>
          </div>
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">Total Withdrawn</p>
            <p className="text-lg font-semibold">{formatCurrency(totalWithdrawn)}</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">Next Settlement</p>
            <p className="text-lg font-semibold">
              {nextWithdrawalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
