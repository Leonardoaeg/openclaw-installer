"use client";

import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/contexts/subscription-context";

interface TopbarProps {
  tenantName?: string;
  userEmail?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ tenantName, userEmail, onMenuToggle }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";
  const sub = useSubscription();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
        <Menu className="w-5 h-5" />
      </Button>

      <p className="text-sm font-medium text-muted-foreground hidden md:block">
        {tenantName ?? "Mi organización"}
      </p>

      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
        </Button>

        <ThemeSwitcher />

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <span className="text-sm font-medium hidden lg:block max-w-[120px] truncate">
              {userEmail ?? "usuario@email.com"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border bg-card shadow-lg py-1.5 z-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {userEmail ?? "usuario@email.com"}
                </p>
                <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full border ${sub.isTrial ? "bg-amber-950/60 text-amber-400 border-amber-500/30" : "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"}`}>
                  {sub.planName}{sub.isTrial ? ` · ${sub.daysRemaining}d restantes` : " · Activo"}
                </span>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Mi perfil
              </Link>
              <Link
                href="/dashboard/billing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Plan y Facturación
              </Link>
              <div className="border-t mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
