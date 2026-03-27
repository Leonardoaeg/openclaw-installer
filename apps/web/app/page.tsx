"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronRight,
  LineChart,
  Megaphone,
  Shield,
  Zap,
} from "lucide-react";

const HEADLINES = [
  { tag: "Meta Ads con IA", text: "Gestiona tus campañas desde un solo lugar" },
  { tag: "Automatización real", text: "Tu agente IA pausa y activa campañas solo" },
  { tag: "Métricas en tiempo real", text: "KPIs, gasto y conversiones al instante" },
  { tag: "Alertas inteligentes", text: "Recibe avisos antes de que el presupuesto se agote" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Dashboard de métricas",
    desc: "Visualiza gasto, CTR, CPC e impresiones en tiempo real con gráficas interactivas.",
  },
  {
    icon: Bot,
    title: "Agente IA integrado",
    desc: "Chatea con tu agente para pausar campañas, ajustar presupuestos y obtener análisis.",
  },
  {
    icon: Zap,
    title: "Alertas automáticas",
    desc: "Configura reglas como 'avísame si el CPA sube más de $10' y actúa en segundos.",
  },
  {
    icon: BrainCircuit,
    title: "Sync con Meta API",
    desc: "Sincronización directa con Facebook e Instagram Ads sin intermediarios.",
  },
  {
    icon: LineChart,
    title: "Reportes por campaña",
    desc: "Analiza el rendimiento día a día con series temporales y comparativas.",
  },
  {
    icon: Shield,
    title: "Multi-cuenta segura",
    desc: "Conecta varias cuentas de anuncios con tokens cifrados y RLS por tenant.",
  },
];

export default function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % HEADLINES.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const h = HEADLINES[current];

  return (
    <main className="min-h-screen bg-[#06101e] text-white overflow-x-hidden">
      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow top */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(99,102,241,.18) 0%, transparent 70%)",
        }}
      />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold tracking-tight">
            Agente<span className="text-indigo-400">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
          >
            Precios
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg font-medium"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-24">
        {/* Badge animado */}
        <div
          className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-8 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {h.tag}
        </div>

        {/* Headline rotante */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight max-w-3xl transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
        >
          {h.text}
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
          AgenteFlow conecta tus cuentas de Meta Ads con inteligencia artificial.
          Gestiona campañas, recibe alertas y toma decisiones basadas en datos — todo desde un dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-900/40"
          >
            Empezar gratis <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-7 py-3.5 rounded-xl transition-all"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-16 text-center">
          {[
            { value: "100%", label: "Integración Meta Ads" },
            { value: "IA", label: "Agente inteligente" },
            { value: "24/7", label: "Monitoreo activo" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-indigo-400">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">Todo lo que necesitas para crecer</h2>
          <p className="text-slate-400 mt-3 text-sm">
            Diseñado para agencias y anunciantes que quieren resultados reales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white/[.04] border border-white/[.07] rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-indigo-950/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:border-indigo-400/50 transition-colors">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold mb-3">Precios simples y transparentes</h2>
        <p className="text-slate-400 text-sm mb-10">14 días gratis. Sin tarjeta de crédito.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left mb-8">
          {[
            { name: "Trial", price: "Gratis", note: "14 días", color: "border-slate-700" },
            { name: "Starter", price: "$19/mes", note: "1 portafolio", color: "border-indigo-500/50" },
            { name: "Business", price: "$24/mes", note: "5 portafolios", color: "border-purple-500/50" },
            { name: "Business Pro", price: "$35/mes", note: "Ilimitado", color: "border-emerald-500/50" },
          ].map((p) => (
            <div key={p.name} className={`bg-white/[.03] border rounded-xl p-4 ${p.color}`}>
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-xl font-extrabold mt-1">{p.price}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.note}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          Ver todos los detalles de planes <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border border-indigo-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-extrabold mb-4">
            ¿Listo para automatizar tus Meta Ads?
          </h2>
          <p className="text-slate-400 mb-8 text-sm">
            Crea tu cuenta gratis y conecta tu primera campaña en menos de 5 minutos.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-900/50"
          >
            Crear cuenta gratis <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[.06] py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} AgenteFlow · Plataforma de gestión de Meta Ads con IA
      </footer>
    </main>
  );
}
