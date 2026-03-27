export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSubscription } from "@/lib/subscription";
import { getProfile } from "@/lib/profile";
import { SubscriptionProvider } from "@/contexts/subscription-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [subscription, profile] = await Promise.all([
    getSubscription(),
    getProfile(),
  ]);

  const isAdmin = profile?.isAdmin ?? false;

  return (
    <SubscriptionProvider value={subscription}>
      <DashboardShell
        isAdmin={isAdmin}
        planName={subscription.planName}
        daysRemaining={subscription.daysRemaining}
        isTrial={subscription.isTrial}
        tenantName={subscription.tenantName || "Mi organización"}
        userEmail={user.email}
      >
        {children}
      </DashboardShell>
    </SubscriptionProvider>
  );
}
