import crypto from "crypto";

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

// ── Planes con precios en COP ─────────────────────────────────────
export const PLAN_META: Record<string, {
  name: string;
  priceCOP: number;        // precio mensual en COP
  annualPriceCOP: number;  // precio mensual si paga anual (−20%)
  maxPortfolios: number | null;
}> = {
  trial:        { name: "Free",      priceCOP: 0,       annualPriceCOP: 0,       maxPortfolios: 1 },
  starter:      { name: "Pro",       priceCOP: 79000,   annualPriceCOP: 63000,   maxPortfolios: 1 },
  business:     { name: "Business",  priceCOP: 109000,  annualPriceCOP: 87000,   maxPortfolios: 5 },
  business_pro: { name: "Business+", priceCOP: 149000,  annualPriceCOP: 119000,  maxPortfolios: null },
};

// Wompi trabaja en centavos (1 COP = 100 centavos)
export function toCents(pesos: number): number {
  return pesos * 100;
}

// Formatea pesos COP: 79000 → "$79.000"
export function formatCOP(pesos: number): string {
  return "$" + pesos.toLocaleString("es-CO");
}

// ── Firma de integridad para el checkout ──────────────────────────
// SHA256(reference + amountInCents + currency + integritySecret)
export function generateIntegritySignature(params: {
  reference: string;
  amountInCents: number;
  currency: string;
}): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("WOMPI_INTEGRITY_SECRET no configurado en .env.local");

  const chain = `${params.reference}${params.amountInCents}${params.currency}${secret}`;
  return crypto.createHash("sha256").update(chain).digest("hex");
}

// ── Construye la URL del checkout hosted de Wompi ─────────────────
export function buildCheckoutUrl(params: {
  reference: string;
  amountInCents: number;
  redirectUrl: string;
  customerEmail?: string;
  customerFullName?: string;
}): string {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) throw new Error("NEXT_PUBLIC_WOMPI_PUBLIC_KEY no configurado en .env.local");

  const signature = generateIntegritySignature({
    reference: params.reference,
    amountInCents: params.amountInCents,
    currency: "COP",
  });

  const url = new URL(WOMPI_CHECKOUT_URL);
  url.searchParams.set("public-key", publicKey);
  url.searchParams.set("currency", "COP");
  url.searchParams.set("amount-in-cents", String(params.amountInCents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("signature:integrity", signature);
  url.searchParams.set("redirect-url", params.redirectUrl);
  if (params.customerEmail) url.searchParams.set("customer-data:email", params.customerEmail);
  if (params.customerFullName) url.searchParams.set("customer-data:full-name", params.customerFullName);

  return url.toString();
}
