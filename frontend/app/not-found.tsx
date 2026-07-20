/* eslint-disable */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500">
          <AlertCircle size={64} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          Oops! It seems the page you are looking for doesn't exist, has been moved, or you don't have access to it.
        </p>
        <Link href="/dashboard" passHref>
          <Button size="lg" className="mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
