"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Sparkles, Music2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WatchMediaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <PageHeader
        title="Entertainment Hub"
        description="Official Haryanvi Music Videos & Exclusive Studio Track Releases."
      />

      {/* Coming Soon Premium Card */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative text-center py-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 pointer-events-none" />

        <CardContent className="relative z-10 max-w-xl mx-auto flex flex-col items-center space-y-5">

          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60 shadow-sm">
            <PlayCircle className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Entertainment Platform Launching Soon
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Exclusive Music Video Releases <br /> Coming Soon
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              We are currently curating and uploading official Haryanvi music video releases and studio audio tracks by <strong>Pure Desi Music (OPC) Private Limited</strong>.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-6 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2">
                <Music2 className="h-4 w-4" /> Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
