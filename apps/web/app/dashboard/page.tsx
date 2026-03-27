"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { subDays, eachDayOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  BarChart3,
  MousePointerClick,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Bot,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Mock data ────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateDays(days: number) {
  const rand = seededRng(13);
  const end = new Date();
  const start = subDays(end, days - 1);
  return eachDayOfInterval({ start, end }).map((date, i) => {
    const wave = 0.5 + 0.5 * Math.sin(i / 4.5);
    const noise = 0.82 + rand() * 0.36;
    const impressions = Math.round((78_000 + 44_000 * wave) * noise);
    const clicks = Math.round(impressions * (0.025 + 0.012 * wave) * (0.82 + rand() * 0.36));
    const spend = Math.round(clicks * (0.21 + 0.19 * wave) * (0.82 + rand() * 0.36) * 100) / 100;
    return {
      label: format(date, "d MMM", { locale: es }),
      impressions,
      clicks,
      spend,
    };
  });
}

const MOCK_CAMPAIGNS = [
  { name: "Temporada Verano",    status: "ACTIVE", spend: 4_726, roas: 3.8, ctr: 2.9, color: "#6366f1" },
  { name: "Retargeting General", status: "ACTIVE", spend: 3_361, roas: 2.4, ctr: 3.4, color: "#06b6d4" },
  { name: "Captación Leads B2B", status: "ACTIVE", spend: 2_741, roas: 4.1, ctr: 1.8, color: "#34d399" },
  { name: "Awareness Marca",     status: "PAUSED", spend: 1_621, roas: 1.9, ctr: 1.2, color: "#f59e0b" },
];

const MOCK_ACTIVITY = [
  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", text: 'Campaña "Temporada Verano" sincronizada',   time: "Hace 5 min"  },
  { icon: AlertTriangle,color: "text-amber-500",   bg: "bg-amber-500/10",   text: "Alerta: gasto diario superó $800",          time: "Hace 2 h"    },
  { icon: Megaphone,    color: "text-indigo-400",  bg: "bg-indigo-500/10",  text: 'Cuenta Meta "Mi Empresa Ads" conectada',   time: "Hace 1 día"  },
  { icon: RefreshCw,    color: "text-blue-400",    bg: "bg-blue-500/10",    text: "Métricas actualizadas — 4 campañas",        time: "Hace 1 día"  },
  { icon: Bot,          color: "text-purple-400",  bg: "bg-purple-500/10",  text: 'Agente IA: "CTR en Retargeting mejoró 12%"',"time": "Hace 2 días" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSD(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeltaPill({ delta, inverse = false }: { delta: number; inverse?: boolean }) {
  const good = inverse ? delta < 0 : delta > 0;
  const Icon = good ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
      good ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400",
    )}>
      <Icon className="w-3 h-3" />
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  delta: number;
  inverse?: boolean;
  sub: string;
  icon: React.ElementType;
  accent: string;
  href: string;
}

function KpiCard({ title, value, delta, inverse, sub, icon: Icon, accent, href }: KpiCardProps) {
  return (
    <Link href={href}>
      <Card className="group relative overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 0%, ${accent}10 0%, transparent 65%)` }}
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}18` }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <DeltaPill delta={delta} inverse={inverse} />
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2 text-sm">
      <p className="text-muted-foreground text-[11px] mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[11px] text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-semibold text-[12px]">
            {p.name === "Gasto" ? fmtUSD(p.value) : fmtCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const data = useMemo(() => generateDays(30), []);

  const totalSpend       = data.reduce((s, d) => s + d.spend,       0);
  const totalImpressions = data.reduce((s, d) => s + d.impressions, 0);
  const totalClicks      = data.reduce((s, d) => s + d.clicks,      0);
  const avgCtr           = totalClicks / (totalImpressions || 1);

  // Deltas vs período anterior (ratio fijo)
  const deltaSpend       = ((totalSpend       / (totalSpend       * 0.872)) - 1) * 100;
  const deltaImpressions = ((totalImpressions / (totalImpressions * 0.891)) - 1) * 100;
  const deltaClicks      = ((totalClicks      / (totalClicks      * 0.879)) - 1) * 100;
  const deltaCampaigns   = 33.3; // de 3 a 4 campañas activas

  const chartData = data.map(d => ({
    label: d.label,
    Gasto: d.spend,
    Clics: d.clicks,
  }));

  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greeting()} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Resumen de los últimos 30 días · Meta Ads
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto gap-2">
          <Link href="/dashboard/meta/connect">
            <Megaphone className="w-4 h-4" />
            Conectar cuenta
          </Link>
        </Button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Gasto total"
          value={fmtUSD(totalSpend)}
          delta={deltaSpend}
          sub={`CPC: $${(totalSpend / totalClicks).toFixed(2)}`}
          icon={TrendingUp}
          accent="#6366f1"
          href="/dashboard/metrics"
        />
        <KpiCard
          title="Impresiones"
          value={fmtCompact(totalImpressions)}
          delta={deltaImpressions}
          sub="Alcance total del período"
          icon={BarChart3}
          accent="#f59e0b"
          href="/dashboard/metrics"
        />
        <KpiCard
          title="Clics"
          value={fmtCompact(totalClicks)}
          delta={deltaClicks}
          sub={`CTR: ${(avgCtr * 100).toFixed(2)}%`}
          icon={MousePointerClick}
          accent="#06b6d4"
          href="/dashboard/metrics"
        />
        <KpiCard
          title="Campañas activas"
          value="4"
          delta={deltaCampaigns}
          sub="3 activas · 1 pausada"
          icon={Zap}
          accent="#34d399"
          href="/dashboard/campaigns"
        />
      </div>

      {/* ── Gráfico principal ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Gasto y clics — últimos 30 días</CardTitle>
            <Link href="/dashboard/metrics"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Ver métricas completas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(30 / 9)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey="Gasto"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradGasto)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="Clics"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gradClics)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-2 pt-2 border-t">
            {[
              { color: "#6366f1", label: "Gasto", value: fmtUSD(totalSpend) },
              { color: "#06b6d4", label: "Clics", value: fmtCompact(totalClicks) },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Campañas */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Top campañas</CardTitle>
                <Link href="/dashboard/campaigns"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Ver todas <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-0 pb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 pb-2">Campaña</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 pb-2 hidden sm:table-cell">Gasto</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 pb-2">ROAS</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 pb-2 hidden md:table-cell">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CAMPAIGNS.map((c) => (
                    <tr key={c.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="font-medium text-sm truncate max-w-[140px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell tabular-nums text-sm">
                        {fmtUSD(c.spend)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          c.roas >= 3 ? "text-emerald-500" : c.roas >= 2 ? "text-amber-500" : "text-red-400"
                        )}>
                          {c.roas}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm tabular-nums">{c.ctr}%</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-4 border-0 px-1.5",
                              c.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {c.status === "ACTIVE" ? "Activa" : "Pausada"}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Actividad + Tip IA */}
        <div className="flex flex-col gap-4">

          {/* Tip del Agente IA */}
          <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-indigo-400">Insight del Agente IA</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                La campaña <span className="font-semibold text-foreground">"Retargeting General"</span> tiene
                frecuencia de <span className="font-semibold text-foreground">4.2</span> — considera renovar
                los creativos para evitar fatiga publicitaria.
              </p>
              <Link href="/dashboard/ai-agent">
                <Button variant="ghost" size="sm" className="mt-3 h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  Hablar con el agente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Actividad reciente</CardTitle>
                <Link href="/dashboard/alerts"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Alertas
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1 pb-3">
              {MOCK_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5 py-1.5 group">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", item.bg)}>
                      <Icon className={cn("w-3 h-3", item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
