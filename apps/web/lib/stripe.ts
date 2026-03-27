import Stripe from "stripe";

// Lazy-initialized — solo se instancia al llamar getStripe(), nunca en import
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY no configurado. Agrégalo en .env.local");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

// ── Plan → Stripe price ID mapping ────────────────────────────
export function getPlanPrices(): Record<string, string | undefined> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER,
    business: process.env.STRIPE_PRICE_BUSINESS,
    business_pro: process.env.STRIPE_PRICE_BUSINESS_PRO,
  };
}

// ── Plan metadata (sin Stripe) ─────────────────────────────────
export const PLAN_META: Record<string, { name: string; price: number; maxPortfolios: number | null }> = {
  trial: { name: "Free", price: 0, maxPortfolios: 1 },
  starter: { name: "Pro", price: 19, maxPortfolios: 1 },
  business: { name: "Business", price: 24, maxPortfolios: 5 },
  business_pro: { name: "Business+", price: 35, maxPortfolios: null },
};

export async function getOrCreateCustomer(params: {
  tenantId: string;
  email: string;
  name?: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  if (params.existingCustomerId) return params.existingCustomerId;

  const customer = await getStripe().customers.create({
    email: params.email,
    name: params.name,
    metadata: { tenant_id: params.tenantId },
  });

  return customer.id;
}
