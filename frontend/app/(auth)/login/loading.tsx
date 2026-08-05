import { Music } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0B0F19]">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md">
            <Music className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">Musica</span>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping opacity-75" />
            <div className="relative bg-blue-600 p-3.5 rounded-xl text-white shadow-md">
              <Music className="h-7 w-7 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse font-medium">Loading login...</p>
        </div>
      </div>
    </div>
  );
}