 
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Minus, Plus, TrendingUp, Info } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils";

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 1000000;
const STEP_AMOUNT = 10000;
const DAILY_RATE_PCT = 0.3333;

export function PlansSection() {
  const [amount, setAmount] = useState<number>(50000); // Default to 50k for showcase

  const handleDecrease = () => {
    if (amount > MIN_AMOUNT) {
      setAmount(amount - STEP_AMOUNT);
    }
  };

  const handleIncrease = () => {
    if (amount < MAX_AMOUNT) {
      setAmount(amount + STEP_AMOUNT);
    }
  };

  const dailyReturn = (amount * DAILY_RATE_PCT) / 100;
  const monthlyReturn = dailyReturn * 30;

  return (
    <section id="plans" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Investment Pools</h2>
          <p className="text-lg text-muted-foreground">
            No fixed plans. Invest in multiples of ₹10,000 and start generating daily rewards instantly. Calculate your potential earnings below.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="relative overflow-hidden border-2 bg-gradient-to-b from-primary/5 to-transparent border-primary/20 shadow-xl">
            <CardHeader className="pt-8 text-center pb-4">
              <CardTitle className="text-3xl font-bold">Calculate Returns</CardTitle>
              <CardDescription className="text-base">
                Adjust the slider to see your potential daily and monthly rewards
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8 mt-4">
              <div className="flex flex-col items-center justify-center space-y-8">
                <div className="flex items-center justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={handleDecrease}
                    disabled={amount <= MIN_AMOUNT}
                    aria-label="Decrease amount"
                  >
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <div className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-primary tabular-nums min-w-[200px] sm:min-w-[280px] text-center">
                    {formatCurrency(amount)}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                    onClick={handleIncrease}
                    disabled={amount >= MAX_AMOUNT}
                    aria-label="Increase amount"
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>
                
                <div className="w-full max-w-xl px-4">
                  <Slider
                    value={[amount]}
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step={STEP_AMOUNT}
                    onValueChange={(vals) => setAmount(Array.isArray(vals) ? vals[0] : vals as number)}
                    className="cursor-pointer py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2 font-medium">
                    <span>{formatCurrency(MIN_AMOUNT)}</span>
                    <span>{formatCurrency(MAX_AMOUNT)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto pt-4">
                <div className="bg-background rounded-2xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="flex items-center text-muted-foreground mb-2">
                    <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                    <span className="font-medium">Daily Reward</span>
                  </div>
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(dailyReturn)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Every Day</span>
                </div>
                
                <div className="bg-background rounded-2xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="flex items-center text-muted-foreground mb-2">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="font-medium">Monthly Estimate</span>
                  </div>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(monthlyReturn)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Per Month</span>
                </div>
              </div>

              <div className="flex items-start justify-center text-sm text-muted-foreground max-w-xl mx-auto bg-primary/5 border border-primary/10 p-4 rounded-xl">
                <Info className="h-5 w-5 mr-3 shrink-0 mt-0.5 text-primary" />
                <p>
                  Enjoy a steady daily return of <strong>{DAILY_RATE_PCT}%</strong>. 
                  Total rewards are capped at <strong>2x</strong> (Non-Working) or up to <strong>3x</strong> (Working) of your invested capital.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="justify-center pb-10 pt-4">
              <Link 
                href="/register" 
                className={buttonVariants({ size: "lg", className: "w-full max-w-md text-lg h-14 font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all" })}
              >
                Start Earning Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
