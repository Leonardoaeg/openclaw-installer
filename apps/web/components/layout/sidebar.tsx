"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Settings,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/portfolios", label: "Portafolios", icon: Briefcase },
  { href: "/dashboard/meta", label: "Meta Ads", icon: Megaphone },
  { href: "/dashboard/campaigns", label: "Campañas", icon: Zap },
  { href: "/dashboard/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/dashboard/alerts", label: "Alertas", icon: Bell },
  { href: "/dashboard/ai-agent", label: "Agente IA", icon: Bot },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/profile", label: "Mi perfil", icon: User },
  { href: "/dashboard/billing", label: "Plan y Facturación", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

const ADMIN_ITEMS = [
  { href: "/admin", label: "Panel Admin", icon: Shield, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: User },
  { href: "/admin/metrics", label: "Métricas config.", icon: BarChart3 },
  { href: "/admin/assistant", label: "Asistente IA", icon: Bot },
  { href: "/admin/plans", label: "Planes", icon: CreditCard },
];

interface SidebarProps {
  isAdmin?: boolean;
  planName?: string;
  daysRemaining?: number;
  isTrial?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  isAdmin, planName, daysRemaining, isTrial, onClose,
}: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));

  return (
    <div className="flex flex-col w-64 border-r bg-card h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Agente<span className="text-indigo-500">Flow</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Plan badge */}
      {isTrial && (
        <div className="mx-3 mt-3 rounded-xl overflow-hidden shrink-0" style={{ background: "linear-gradient(135deg, #1e1408 0%, #2d1f0a 100%)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white">{planName}</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                {daysRemaining}d
              </span>
            </div>
            <p className="text-[10px] text-amber-200/60 mb-2">
              {(daysRemaining ?? 0) <= 3 ? "⚠️ ¡Tu trial expira pronto!" : `${daysRemaining} días restantes de prueba`}
            </p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(4, Math.min(100, ((daysRemaining ?? 14) / 14) * 100))}%`,
                  background: (daysRemaining ?? 14) <= 3
                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                    : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                }}
              />
            </div>
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="flex items-center justify-center gap-1 w-full text-[11px] font-semibold py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
            >
              Actualizar plan →
            </Link>
          </div>
        </div>
      )}

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Administración
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", adminOpen && "rotate-180")} />
          </button>
          {adminOpen && (
            <div className="mt-1 space-y-0.5 pl-1">
              {ADMIN_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="px-3 pb-3 border-t pt-3 space-y-0.5 shrink-0">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({
  isAdmin = false,
  planName = "Trial",
  daysRemaining = 14,
  isTrial = true,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0">
        <SidebarContent
          isAdmin={isAdmin}
          planName={planName}
          daysRemaining={daysRemaining}
          isTrial={isTrial}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full shadow-2xl">
            <SidebarContent
              isAdmin={isAdmin}
              planName={planName}
              daysRemaining={daysRemaining}
              isTrial={isTrial}
              onClose={onMobileClose}
            />
          </aside>
        </div>
      )}
    </>
  );
}
