"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  TrendingUp,
  Settings,
  Users,
  Award,
  Network,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Protocolos",
    href: "/protocolos",
    icon: FileText,
  },
];

const equipesNavigation = [
  {
    name: "Visao Geral",
    href: "/equipes",
    icon: Users,
  },
  {
    name: "Performance",
    href: "/equipes/usuarios",
    icon: Award,
  },
  {
    name: "Colaboracao",
    href: "/equipes/colaboracao",
    icon: Network,
  },
];

const analytics = [
  {
    name: "Por Assunto",
    href: "/analises/por-assunto",
    icon: FolderKanban,
  },
  {
    name: "Por Setores",
    href: "/analises/setores",
    icon: Building2,
  },
  {
    name: "Por Projeto",
    href: "/analises/por-projeto",
    icon: TrendingUp,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-48 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-3">
        <h2 className="text-sm font-semibold">Protocolos FADEX</h2>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Separator className="my-2" />

        <div className="space-y-0.5">
          <div className="px-2 py-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Equipes</p>
          </div>
          {equipesNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Separator className="my-2" />

        <div className="space-y-0.5">
          <div className="px-2 py-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Analises</p>
          </div>
          {analytics.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Separator className="my-2" />

        <div className="space-y-0.5">
          <Link
            href="/configuracoes"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              pathname === "/configuracoes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </div>
      </nav>

      <div className="border-t p-2">
        <div className="text-[10px] text-muted-foreground">
          <p className="font-semibold">Protocolos</p>
          <p>Fundação FADEX</p>
        </div>
      </div>
    </div>
  );
}
