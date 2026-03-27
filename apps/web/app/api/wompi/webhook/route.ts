import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verificación de firma Wompi:
// SHA256( values_of_properties_in_order + timestamp + events_secret )
function verifySignature(body: Record<string, unknown>, receivedChecksum: string): boolean {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    console.error("WOMPI_EVENTS_SECRET no configurado");
    return false;
  }

  const timestamp = body.timestamp as number;
  const properties = (body.signature as { properties?: string[] })?.properties ?? [];
  const data = (body.data ?? {}) as Record<string, unknown>;

  // Extrae valores anidados con notación de punto ("transaction.id" → data.transaction.id)
  const propValues = properties.map((prop: string) => {
    const value = prop.split(".").reduce((obj: unknown, key: string) => {
      return (obj as Record<string, unknown>)?.[key];
    }, data);
    return value ?? "";
  });

  const chain = propValues.join("") + timestamp + eventsSecret;
  const checksum = crypto.createHash("sha256").update(chain).digest("hex");
  return checksum === receivedChecksum;
}

// Parsea reference: {uuid}-{planId}-{timestamp}
// UUID tiene 4 guiones (5 segmentos). planId y timestamp no tienen guiones entre sí.
function parseReference(reference: string): { tenantId: string; planId: string } | null {
  const parts = reference.split("-");
  // Mínimo: 5 partes UUID + 1 planId + 1 timestamp = 7 partes
  if (parts.length < 7) return null;

  const tenantId = parts.slice(0, 5).join("-");
  const planId = parts[5];                // starter | business | business_pro
  // parts[6] = timestamp (lo ignoramos)

  return { tenantId, planId };
}

function planNameForId(planId: string): string {
  const map: Record<string, string> = {
    starter:      "Pro",
    business:     "Business",
    business_pro: "Business+",
  };
  return map[planId] ?? planId;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checksum = (body.signature as { checksum?: string })?.checksum;
  if (!checksum || !verifySignature(body, checksum)) {
    console.warn("Wompi webhook: firma inválida");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.event !== "transaction.updated") {
    return NextResponse.json({ received: true });
  }

  const tx = (body.data as { transaction?: Record<string, unknown> })?.transaction;
  if (!tx) return NextResponse.json({ received: true });

  const reference = tx.reference as string;
  const status = tx.status as string;
  const parsed = parseReference(reference);

  if (!parsed) {
    console.warn("Wompi webhook: referencia con formato inesperado:", reference);
    return NextResponse.json({ received: true });
  }

  const { tenantId, planId } = parsed;
  const supabase = getServiceClient();

  if (status === "APPROVED") {
    // Buscar plan en Supabase por nombre
    const planName = planNameForId(planId);
    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("name", planName)
      .single();

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan_id: plan?.id ?? null,
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("tenant_id", tenantId);

    if (plan?.id) {
      await supabase
        .from("tenants")
        .update({ plan_id: plan.id })
        .eq("id", tenantId);
    }

    // Registrar factura
    const amountInCents = tx.amount_in_cents as number;
    await supabase.from("invoices").upsert({
      tenant_id: tenantId,
      wompi_transaction_id: tx.id as string,
      amount_paid: amountInCents / 100,
      currency: tx.currency as string,
      status: "paid",
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    }, { onConflict: "wompi_transaction_id" });

    console.log(`✅ Pago aprobado → tenant ${tenantId}, plan ${planId}`);

  } else if (status === "DECLINED" || status === "ERROR") {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId);

    console.log(`❌ Pago ${status} → tenant ${tenantId}`);
  }

  return NextResponse.json({ received: true });
}
