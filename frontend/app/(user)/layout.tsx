import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileNav } from "@/components/layout/MobileNav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen h-dvh bg-[#F8F9FA] dark:bg-[#0B0F19] relative overflow-hidden">
      {/* Premium Dot Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
