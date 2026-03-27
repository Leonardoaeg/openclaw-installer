export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { getSubscription } from "@/lib/subscription";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Verificar admin via service role (bypasea RLS)
  const service = getServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const subscription = await getSubscription();

  return (
    <SubscriptionProvider value={subscription}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isAdmin />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar tenantName="Panel de Administración" userEmail={user.email} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
