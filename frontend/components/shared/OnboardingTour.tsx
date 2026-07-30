"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Network, 
  Calendar, 
  X, 
  ChevronRight, 
  CheckCircle2 
} from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";

const TOUR_STEPS = [
  {
    icon: TrendingUp,
    title: "1. Daily Reward (Revenue Share)",
    badge: "0.3333%/day",
    color: "text-emerald-500 bg-emerald-500/10",
    description: "Every active project sponsorship earns 0.3333% daily reward credits (10% monthly). Credits are deposited into your wallet every night at 12:00 AM IST."
  },
  {
    icon: Zap,
    title: "2. Income Cap System",
    badge: "2x or 3x Cap",
    color: "text-amber-500 bg-amber-500/10",
    description: "Total earnings (Reward + Invite + Level Income) are capped at 2x for Non-Working members, and extended to 3x once you invite active members."
  },
  {
    icon: Network,
    title: "3. Level Income (L1–L15)",
    badge: "Up to 15 Levels",
    color: "text-primary bg-primary/10",
    description: "Earn daily revenue share credits based on your network's reward earnings — L1 gets 15%, L2 10%, L3 5%, down to L15!"
  },
  {
    icon: Calendar,
    title: "4. Withdrawal Windows",
    badge: "10th, 20th, 30th",
    color: "text-blue-500 bg-blue-500/10",
    description: "Withdrawal requests are processed on the 10th, 20th, and 30th of every month directly to your registered bank account."
  }
];

export function OnboardingTour() {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
      if (!dismissed) {
        setIsDismissed(false);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
    }
    setIsDismissed(true);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  if (isDismissed || !user) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Card className="border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 shadow-sm mb-6 relative overflow-hidden rounded-lg animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-white to-sky-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 pointer-events-none" />
      
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Welcome Guide</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-1 text-slate-500 border-slate-200">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} aria-label="Dismiss welcome guide" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 my-1">
          <div className={`p-3 rounded-lg ${step.color} shrink-0`}>
            <StepIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{step.title}</h3>
              <Badge variant="secondary" className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{step.badge}</Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? "w-5 bg-blue-600" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                }`} 
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs text-slate-500 hover:text-slate-700">
              Skip Tour
            </Button>
            <Button size="sm" onClick={handleNext} className="text-xs font-semibold px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 shadow-sm">
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>Get Started <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" /></>
              ) : (
                <>Next Step <ChevronRight className="ml-1.5 h-3.5 w-3.5" /></>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
