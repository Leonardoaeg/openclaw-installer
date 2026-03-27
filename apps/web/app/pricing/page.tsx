"use client";

import Link from "next/link";
import { Check, ChevronRight, Megaphone, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "trial",
    name: "Trial",
    subtitle: "14 días gratis",
    price: null,
    priceNote: "Sin tarjeta de crédito",
    color: "border-slate-700",
    badge: null,
    cta: "Empezar gratis",
    ctaHref: "/auth/sign-up",
    ctaStyle: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    features: [
      { text: "1 portafolio", included: true },
      { text: "Dashboard de campañas", included: true },
      { text: "Análisis de métricas", included: true },
      { text: "Prender / apagar campañas", included: true },
      { text: "Alertas automáticas", included: true },
      { text: "Agente IA básico", included: true },
      { text: "Múltiples portafolios", included: false },
      { text: "Gestión de cuentas publicitarias", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    subtitle: "Para negocios individuales",
    price: 19,
    priceNote: "por mes",
    color: "border-indigo-500/60",
    badge: "Más popular",
    cta: "Contratar ahora",
    ctaHref: "/auth/sign-up?plan=starter",
    ctaStyle: "bg-indigo-600 hover:bg-indigo-500 text-white",
    features: [
      { text: "1 portafolio comercial", included: true },
      { text: "Dashboard de campañas", included: true },
      { text: "Análisis de métricas", included: true },
      { text: "Prender / apagar campañas", included: true },
      { text: "Alertas automáticas", included: true },
      { text: "Agente IA avanzado", included: true },
      { text: "Múltiples portafolios", included: false },
      { text: "Gestión multi-cuenta", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    subtitle: "Para agencias y equipos",
    price: 24,
    priceNote: "por mes",
    color: "border-purple-500/60",
    badge: "Empresas",
    cta: "Contratar Business",
    ctaHref: "/auth/sign-up?plan=business",
    ctaStyle: "bg-purple-600 hover:bg-purple-500 text-white",
    features: [
      { text: "Hasta 5 portafolios comerciales", included: true },
      { text: "Dashboard por portafolio", included: true },
      { text: "Análisis de anuncios", included: true },
      { text: "Prender / apagar campañas", included: true },
      { text: "Alertas automáticas", included: true },
      { text: "Agente IA avanzado", included: true },
      { text: "Multi-cuenta publicitaria", included: true },
      { text: "Gestión ilimitada", included: false },
    ],
  },
  {
    id: "business_pro",
    name: "Business Pro",
    subtitle: "Gestión sin límites",
    price: 35,
    priceNote: "por mes",
    color: "border-emerald-500/60",
    badge: "Pro",
    cta: "Contratar Business Pro",
    ctaHref: "/auth/sign-up?plan=business_pro",
    ctaStyle: "bg-emerald-600 hover:bg-emerald-500 text-white",
    features: [
      { text: "Portafolios ilimitados", included: true },
      { text: "Dashboard independiente por portafolio", included: true },
      { text: "Análisis completo de anuncios", included: true },
      { text: "Prender / apagar campañas", included: true },
      { text: "Alertas automáticas inteligentes", included: true },
      { text: "Agente IA premium + parámetros custom", included: true },
      { text: "Gestión ilimitada de cuentas publicitarias", included: true },
      { text: "Soporte prioritario", included: true },
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#06101e] text-white">
      {/* Grid bg */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold tracking-tight">
            Agente<span className="text-indigo-400">Flow</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white px-4 py-2">
            Iniciar sesión
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="relative z-10 text-center px-6 pt-16 pb-12">
        <span className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Sin contratos · Cancela cuando quieras
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Planes simples y transparentes
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-base">
          Empieza gratis 14 días y escala según tus necesidades. Sin sorpresas.
        </p>

        {/* Toggle anual/mensual */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={cn("text-sm", !annual ? "text-white" : "text-slate-500")}>Mensual</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              annual ? "bg-indigo-600" : "bg-slate-700"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                annual ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "text-white" : "text-slate-500")}>
            Anual{" "}
            <span className="text-emerald-400 font-semibold">-20%</span>
          </span>
        </div>
      </section>

      {/* Plans grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white/[.03] p-6 hover:bg-white/[.06] transition-all",
                plan.color,
                plan.id === "starter" && "ring-1 ring-indigo-500/40"
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full",
                    plan.id === "starter" && "bg-indigo-600 text-white",
                    plan.id === "business" && "bg-purple-600 text-white",
                    plan.id === "business_pro" && "bg-emerald-600 text-white"
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{plan.subtitle}</p>
              </div>

              <div className="mb-6">
                {plan.price === null ? (
                  <div>
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-slate-400 text-sm ml-1">USD</span>
                    <p className="text-xs text-slate-400 mt-1">{plan.priceNote}</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-white">
                        ${annual ? Math.round(plan.price * 0.8) : plan.price}
                      </span>
                      <span className="text-slate-400 text-sm mb-1">USD/mes</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        Facturado anualmente
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    )}
                    <span className={f.included ? "text-slate-200" : "text-slate-600"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  plan.ctaStyle
                )}
              >
                {plan.cta}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ / note */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            ¿Tienes dudas?{" "}
            <Link href="/auth/sign-up" className="text-indigo-400 hover:text-indigo-300">
              Empieza gratis
            </Link>{" "}
            y explora la plataforma sin compromiso por 14 días.
          </p>
        </div>
      </section>
    </div>
  );
}
