import { Music } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping opacity-75" />
          <div className="absolute inset-2 bg-blue-600/10 rounded-2xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-600/20">
            <Music className="h-9 w-9 text-white animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-extrabold tracking-tight mb-1 text-slate-900 dark:text-white">Musica</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            Loading experience...
          </p>
        </div>
      </div>
    </div>
  );
}
