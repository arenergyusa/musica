import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-[#F8F9FA] dark:bg-slate-800/60 max-w-4xl mx-auto p-8 md:p-12 text-center rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-4 border border-blue-200/60 dark:border-blue-900">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Join Musica Streaming</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Ready to Explore Official <span className="text-blue-600 dark:text-blue-400">Haryanvi Music Videos?</span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Create your free account today to browse official Haryanvi songs and high-definition video releases.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/register" 
              className={buttonVariants({ 
                size: "lg", 
                className: "w-full sm:w-auto h-11 px-8 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all" 
              })}
            >
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-[11px] font-semibold text-slate-400">
            Instant Access &bull; 100% Free Registration &bull; High-Definition Playback
          </p>
        </div>
      </div>
    </section>
  );
}
