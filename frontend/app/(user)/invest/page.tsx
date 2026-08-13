"use client";

import { AppKitProvider } from "@/components/providers/AppKitProvider";
import { InvestForm } from "@/components/forms/InvestForm";

export default function InvestPage() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AppKitProvider>
        <InvestForm />
      </AppKitProvider>
    </div>
  );
}
