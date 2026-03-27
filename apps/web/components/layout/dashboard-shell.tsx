"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface Props {
  isAdmin: boolean;
  planName: string;
  daysRemaining: number;
  isTrial: boolean;
  tenantName: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  isAdmin, planName, daysRemaining, isTrial, tenantName, userEmail, children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isAdmin={isAdmin}
        planName={planName}
        daysRemaining={daysRemaining}
        isTrial={isTrial}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          tenantName={tenantName}
          userEmail={userEmail}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
