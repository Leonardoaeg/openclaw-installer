import { createClient } from "@/lib/supabase/server";

export interface SubscriptionInfo {
  tenantId: string;
  tenantName: string;
  planName: string;
  planPrice: number;
  maxPortfolios: number | null; // null = ilimitado
  hasAiAgent: boolean;
  hasAlerts: boolean;
  status: "trialing" | "active" | "past_due" | "cancelled";
  trialEndsAt: string | null;
  daysRemaining: number;
  isTrial: boolean;
  isActive: boolean;
  isAdmin: boolean;
}

const FALLBACK: SubscriptionInfo = {
  tenantId: "",
  tenantName: "",
  planName: "Trial",
  planPrice: 0,
  maxPortfolios: 1,
  hasAiAgent: true,
  hasAlerts: true,
  status: "trialing",
  trialEndsAt: null,
  daysRemaining: 14,
  isTrial: true,
  isActive: true,
  isAdmin: false,
};

/**
 * Server-side helper: obtiene la suscripción activa del usuario autenticado.
 * Usa la función RPC `get_my_subscription` definida en Supabase.
 */
export async function getSubscription(): Promise<SubscriptionInfo> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_my_subscription");

    if (error || !data || data.length === 0) return FALLBACK;

    const row = data[0];
    return {
      tenantId: row.tenant_id ?? "",
      tenantName: row.tenant_name ?? "",
      planName: row.plan_name ?? "Trial",
      planPrice: Number(row.plan_price ?? 0),
      maxPortfolios: row.max_portfolios ?? 1,
      hasAiAgent: row.has_ai_agent ?? true,
      hasAlerts: row.has_alerts ?? true,
      status: (row.status as SubscriptionInfo["status"]) ?? "trialing",
      trialEndsAt: row.trial_ends_at ?? null,
      daysRemaining: row.days_remaining ?? 0,
      isTrial: row.status === "trialing",
      isActive: row.status === "trialing" || row.status === "active",
      isAdmin: row.is_admin ?? false,
    };
  } catch {
    return FALLBACK;
  }
}

/**
 * Server-side helper: obtiene el tenant_id del usuario actual.
 */
export async function getTenantId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1)
      .single();
    return data?.tenant_id ?? null;
  } catch {
    return null;
  }
}
