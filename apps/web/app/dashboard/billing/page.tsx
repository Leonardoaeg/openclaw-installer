"use client";

import { Check, ChevronRight, CreditCard, Crown, Loader2, Settings2, Sparkles, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/contexts/subscription-context";
import { createWompiCheckout } from "@/app/actions/wompi";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PLANS = [
  {
    id: "starter",
    name: "Pro",
    monthlyPrice: 79000,
    annualPrice: 63000,
    color: "from-indigo-600/20 to-indigo-600/5",
    border: "border-indigo-500/30",
    ring: "ring-indigo-500",
    accent: "#6366f1",
    icon: Zap,
    features: [
      "1 portafolio",
      "Dashboard completo",
      "Métricas en tiempo real",
      "Gestión de campañas",
      "Alertas automáticas",
      "Agente IA incluido",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 109000,
    annualPrice: 87000,
    color: "from-purple-600/25 to-purple-600/5",
    border: "border-purple-500/40",
    ring: "ring-purple-500",
    accent: "#a855f7",
    icon: Crown,
    badge: "Recomendado",
    features: [
      "5 portafolios",
      "Dashboard por portafolio",
      "Análisis avanzado de anuncios",
      "Gestión de campañas",
      "Alertas automáticas",
      "Agente IA premium",
    ],
  },
  {
    id: "business_pro",
    name: "Business+",
    monthlyPrice: 149000,
    annualPrice: 119000,
    color: "from-emerald-600/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500",
    accent: "#10b981",
    icon: Sparkles,
    features: [
      "Portafolios ilimitados",
      "Dashboard independiente",
      "Gestión sin límites",
      "Campañas avanzadas",
      "Alertas premium",
      "IA con contexto extendido",
    ],
  },
];

function formatCOP(pesos: number): string {
  return "$" + pesos.toLocaleString("es-CO");
}

function BillingNotice() {
  const params = useSearchParams();
  if (params.get("success")) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3">
        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">¡Pago recibido! Tu plan se activará en segundos.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Procesando confirmación de Wompi. Si el plan no se refleja en 1 minuto, recarga la página.</p>
        </div>
      </div>
    );
  }
  if (params.get("cancelled")) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">
        Proceso de pago cancelado. Puedes intentarlo de nuevo cuando quieras.
      </div>
    );
  }
  return null;
}

export default function BillingPage() {
  const [selected, setSelected] = useState("starter");
  const [annual, setAnnual] = useState(true);
  const [isPending, startTransition] = useTransition();
  const sub = useSubscription();

  const trialPct = sub.isTrial ? Math.max(5, (sub.daysRemaining / 14) * 100) : 100;
  const expiryDate = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleCheckout = () => {
    startTransition(() => createWompiCheckout(selected, annual));
  };

  const currentPlanId = sub.planName.toLowerCase().replace(" ", "_");
  const isCurrentPlan = (planId: string) => planId === currentPlanId ||
    (planId === "business_pro" && currentPlanId === "business_pro");

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Plan y Facturación</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu suscripción y método de pago.</p>
      </div>

      <Suspense>
        <BillingNotice />
      </Suspense>

      {/* Plan actual */}
      <Card className={sub.isTrial ? "border-amber-500/30 bg-amber-950/10" : "border-emerald-500/30 bg-emerald-950/10"}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sub.isTrial ? "bg-amber-500/20 border border-amber-500/30" : "bg-emerald-500/20 border border-emerald-500/30"
              }`}>
                <Zap className={`w-5 h-5 ${sub.isTrial ? "text-amber-400" : "text-emerald-400"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {sub.planName} {sub.isTrial ? "· Free activo" : "· Activo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sub.isTrial
                    ? `${sub.daysRemaining} días restantes${expiryDate ? ` · Expira el ${expiryDate}` : ""}`
                    : `${formatCOP(sub.planPrice)}/mes · ${sub.maxPortfolios === null ? "Portafolios ilimitados" : `${sub.maxPortfolios} portafolio(s)`}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {sub.isTrial && (
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${trialPct}%` }} />
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">{sub.daysRemaining}/14d</span>
                </div>
              )}
              {!sub.isTrial && (
                <a
                  href="https://wa.me/573023779792?text=Quiero%20gestionar%20mi%20suscripción%20de%20Agenteflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs border border-border rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Gestionar suscripción
                </a>
              )}
            </div>
          </div>
          {sub.isTrial && (
            <p className="text-xs text-muted-foreground mt-3">
              Al finalizar el trial, elige un plan para continuar. Sin plan activo tu acceso quedará en modo lectura.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Selector de planes */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {sub.isTrial ? "Elige tu plan" : "Cambiar de plan"}
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            Sin contratos. Cancela cuando quieras. Precios en COP.
          </p>

          <div className="inline-flex items-center gap-3 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isActive = isCurrentPlan(plan.id);
            const isSelected = selected === plan.id && !isActive;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                onClick={() => !isActive && setSelected(plan.id)}
                className={cn(
                  "relative rounded-2xl border p-6 transition-all duration-200 flex flex-col",
                  isActive
                    ? "opacity-60 cursor-default"
                    : "cursor-pointer hover:-translate-y-1 hover:shadow-xl",
                  isSelected
                    ? cn("ring-2 shadow-lg", plan.ring, plan.border)
                    : "border-border",
                  plan.id === "business" && !isActive ? "scale-[1.02]" : ""
                )}
                style={isSelected || plan.id === "business"
                  ? { background: `linear-gradient(135deg, ${plan.accent}18 0%, ${plan.accent}05 100%)` }
                  : {}
                }
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-lg"
                      style={{ background: `linear-gradient(90deg, ${plan.accent}, ${plan.accent}cc)` }}>
                      ⭐ {plan.badge}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-lg">
                      Plan actual
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${plan.accent}20`, border: `1px solid ${plan.accent}40` }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: plan.accent }} />
                    </div>
                    <span className="font-bold text-base">{plan.name}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: plan.accent }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold tracking-tight">{formatCOP(price)}</span>
                    <span className="text-sm text-muted-foreground mb-1.5">/mes</span>
                  </div>
                  {annual && (
                    <p className="text-xs mt-1" style={{ color: plan.accent }}>
                      {formatCOP(price * 12)}/año · ahorras {formatCOP((plan.monthlyPrice - plan.annualPrice) * 12)}
                    </p>
                  )}
                  {!annual && (
                    <p className="text-xs text-muted-foreground mt-1">Facturado mensualmente</p>
                  )}
                </div>

                <div className="h-px bg-border mb-4"
                  style={{ background: `linear-gradient(90deg, transparent, ${plan.accent}30, transparent)` }} />

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${plan.accent}20` }}>
                        <Check className="w-2.5 h-2.5" style={{ color: plan.accent }} />
                      </div>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            onClick={handleCheckout}
            disabled={isPending || isCurrentPlan(selected)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-10 h-12 text-base font-semibold rounded-xl shadow-lg shadow-indigo-900/30"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Redirigiendo a Wompi...</>
            ) : (
              <><CreditCard className="w-4 h-4" />Continuar al pago<ChevronRight className="w-4 h-4" /></>
            )}
          </Button>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            🔒 Pago seguro con Wompi · Tarjeta · PSE · Nequi · Sin permanencia
          </p>
        </div>
      </div>

      {/* Método de pago */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Método de pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sub.isTrial ? (
            <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay método de pago registrado</p>
              <p className="text-xs mt-1">Se agregará al contratar un plan</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tarjeta · PSE · Nequi</p>
                  <p className="text-xs text-muted-foreground">Procesado de forma segura por Wompi (Bancolombia)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de facturación */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Historial de facturación
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {sub.isTrial ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              El historial estará disponible después de contratar un plan.
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Activo</Badge>
              Para soporte con facturas escríbenos por WhatsApp o al correo de soporte.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
