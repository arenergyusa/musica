import { Music } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
          <div className="relative bg-primary/30 p-4 rounded-2xl backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/20">
            <Music className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold tracking-tight mb-1">Musica</h2>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading experience...
          </p>
        </div>
      </div>
    </div>
  );
}
