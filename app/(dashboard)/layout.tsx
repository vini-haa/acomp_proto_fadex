import { Sidebar } from "@/components/dashboard/Sidebar";
import { CacheWarmer } from "@/components/dashboard/CacheWarmer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Pré-carrega o cache de protocolos em background */}
        <CacheWarmer />
        {children}
      </main>
    </div>
  );
}
