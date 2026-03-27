"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPlanPrices, getOrCreateCustomer } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function createCheckoutSession(planId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const prices = getPlanPrices();
  const priceId = prices[planId];
  if (!priceId) {
    throw new Error(`Precio no configurado para plan "${planId}". Agrega STRIPE_PRICE_${planId.toUpperCase()} en .env.local`);
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

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", tenantId)
    .single();

  const customerId = await getOrCreateCustomer({
    tenantId,
    email: user.email!,
    name: tenantName,
    existingCustomerId: sub?.stripe_customer_id,
  });

  if (!sub?.stripe_customer_id) {
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("tenant_id", tenantId);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/dashboard/billing?cancelled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { tenant_id: tenantId, plan_id: planId },
    },
    metadata: { tenant_id: tenantId, plan_id: planId },
  });

  if (!session.url) throw new Error("No se pudo crear la sesión de pago");
  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) throw new Error("Sin tenant");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", membership.tenant_id)
    .single();

  if (!sub?.stripe_customer_id) {
    throw new Error("No hay suscripción de pago activa.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE_URL}/dashboard/billing`,
  });

  redirect(session.url);
}
