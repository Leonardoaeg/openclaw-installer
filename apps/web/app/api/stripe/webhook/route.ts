import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Cliente de Supabase con service_role para escrituras desde webhook
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      // ── Suscripción creada / actualizada ───────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata.tenant_id;
        const planId = sub.metadata.plan_id ?? "starter";

        if (!tenantId) break;

        // Obtener el plan_id de Supabase por nombre
        const { data: plan } = await supabase
          .from("plans")
          .select("id")
          .ilike("name", planId === "starter" ? "Starter" : planId === "business_pro" ? "Business Pro" : "Business")
          .single();

        const status = mapStripeStatus(sub.status);

        await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer as string,
            plan_id: plan?.id ?? null,
            status,
            trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            current_period_end: (sub as unknown as { current_period_end?: number }).current_period_end
              ? new Date(((sub as unknown as { current_period_end: number }).current_period_end) * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        // Actualizar el plan del tenant también
        if (plan?.id) {
          await supabase
            .from("tenants")
            .update({ plan_id: plan.id })
            .eq("id", tenantId);
        }

        console.log(`✅ Suscripción ${event.type} → tenant ${tenantId}, plan ${planId}`);
        break;
      }

      // ── Suscripción cancelada ──────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata.tenant_id;
        if (!tenantId) break;

        // Degradar al plan Trial
        const { data: trialPlan } = await supabase
          .from("plans")
          .select("id")
          .eq("name", "Trial")
          .single();

        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            plan_id: trialPlan?.id ?? null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        if (trialPlan?.id) {
          await supabase
            .from("tenants")
            .update({ plan_id: trialPlan.id })
            .eq("id", tenantId);
        }

        console.log(`❌ Suscripción cancelada → tenant ${tenantId}`);
        break;
      }

      // ── Pago exitoso ───────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Actualizar estado de suscripción
        const { data: subData } = await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
          .select("tenant_id")
          .single();

        // Registrar factura
        if (subData?.tenant_id && invoice.amount_paid > 0) {
          await supabase.from("invoices").upsert({
            tenant_id: subData.tenant_id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent: (invoice as unknown as { payment_intent?: string }).payment_intent ?? null,
            amount_paid: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: "paid",
            invoice_pdf_url: invoice.invoice_pdf ?? null,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          }, { onConflict: "stripe_invoice_id" });
        }

        console.log(`💳 Pago exitoso → customer ${customerId}`);
        break;
      }

      // ── Pago fallido ───────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`⚠️ Pago fallido → customer ${customerId}`);
        break;
      }

      // ── Checkout completado (primera suscripción) ─────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id;
        const planId = session.metadata?.plan_id;

        if (!tenantId || !planId) break;

        // La suscripción real se maneja en customer.subscription.created
        // Aquí solo confirmamos que el checkout fue exitoso
        console.log(`✅ Checkout completado → tenant ${tenantId}, plan ${planId}`);
        break;
      }

      default:
        console.log(`Evento Stripe no manejado: ${event.type}`);
    }
  } catch (err) {
    console.error("Error procesando webhook:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(stripeStatus: string): string {
  const map: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "cancelled",
  };
  return map[stripeStatus] ?? "active";
}
