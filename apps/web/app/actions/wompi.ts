"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLAN_META, toCents, buildCheckoutUrl } from "@/lib/wompi";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function createWompiCheckout(planId: string, annual = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const plan = PLAN_META[planId];
  if (!plan || plan.priceCOP === 0) {
    throw new Error(`Plan inválido o gratuito: ${planId}`);
  }

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) throw new Error("No se encontró tenant para este usuario");

  const tenantId = membership.tenant_id;
  const tenantName = (membership.tenants as { name?: string })?.name ?? "";

  const priceCOP = annual ? plan.annualPriceCOP : plan.priceCOP;
  const amountInCents = toCents(priceCOP);

  // reference: {tenantId}-{planId}-{timestamp}
  // UUID tiene exactamente 4 guiones → al hacer split("-") el UUID ocupa las primeras 5 posiciones
  const reference = `${tenantId}-${planId}-${Date.now()}`;

  const checkoutUrl = buildCheckoutUrl({
    reference,
    amountInCents,
    redirectUrl: `${SITE_URL}/dashboard/billing?success=1`,
    customerEmail: user.email,
    customerFullName: tenantName,
  });

  redirect(checkoutUrl);
}
