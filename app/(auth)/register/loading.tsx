import { Loader2 } from "lucide-react";

export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading registration...</p>
      </div>
    </div>
  );
}
