"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays, eachDayOfInterval, subDays as sub } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CreditCard,
  BarChart2,
  Percent,
  Receipt,
  Timer,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMetricsDaily } from "@/hooks/use-metrics";
import type { DailyMetric } from "@/types/meta";

// ─── Datos mock ───────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateDays(days: number) {
  const rand = seededRng(7);
  const end = new Date();
  const start = subDays(end, days - 1);
  return eachDayOfInterval({ start, end }).map((date, i) => {
    const wave = 0.5 + 0.5 * Math.sin(i / 4.5);
    const noise = 0.82 + rand() * 0.36;
    const impressions      = Math.round((78_000 + 44_000 * wave) * noise);
    const clicks           = Math.round(impressions * (0.025 + 0.012 * wave) * (0.82 + rand() * 0.36));
    const initiateCheckout = Math.round(clicks * (0.18 + 0.08 * wave) * (0.78 + rand() * 0.44));
    const sales            = Math.round(initiateCheckout * (0.38 + 0.14 * wave) * (0.72 + rand() * 0.56));
    const conversions      = Math.round(clicks * (0.054 + 0.026 * wave) * (0.78 + rand() * 0.44));
    const spend            = Math.round(clicks * (0.21 + 0.19 * wave) * (0.82 + rand() * 0.36) * 100) / 100;
    // presupuesto diario máx ~$250; carga = % consumido
    const carga            = Math.min(100, Math.round(((spend / 250) * 100) * (0.9 + rand() * 0.2)));
    // tiempo de carga de página en segundos (entre 1.2s y 3.8s con variación diaria)
    const pageLoad         = Math.round((1.2 + rand() * 2.6 + 0.4 * Math.sin(i / 3)) * 100) / 100;
    const ctr              = clicks / impressions;
    const cpc              = spend / (clicks || 1);
    const cvr              = conversions / (clicks || 1);
    const initPayRate      = initiateCheckout / (clicks || 1);
    const cpa              = spend / (conversions || 1);
    const roas             = conversions > 0 ? (conversions * 38) / spend : 0;
    return {
      label: format(date, "d MMM", { locale: es }),
      impressions,
      clicks,
      conversions,
      initiateCheckout,
      sales,
      spend,
      carga,
      pageLoad,
      ctr,
      cpc,
      cvr,
      initPayRate,
      cpa,
      roas,
    };
  });
}

const PERIODS = [
  { label: "7d",  days: 7  },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const CHART_METRICS = [
  { key: "spend",            label: "Gasto",              color: "#6366f1" },
  { key: "clicks",           label: "Clics",              color: "#06b6d4" },
  { key: "impressions",      label: "Impresiones",        color: "#f59e0b" },
  { key: "conversions",      label: "Conversiones",       color: "#34d399" },
  { key: "sales",            label: "Ventas",             color: "#f43f5e" },
  { key: "initiateCheckout", label: "Inicio de pagos",    color: "#a78bfa" },
] as const;

const CAMPAIGNS = [
  { name: "Temporada Verano",    color: "#6366f1", share: 0.38 },
  { name: "Retargeting",         color: "#06b6d4", share: 0.27 },
  { name: "Captación Leads B2B", color: "#34d399", share: 0.22 },
  { name: "Awareness Marca",     color: "#f59e0b", share: 0.13 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DayRow = ReturnType<typeof generateDays>[number];

function total(data: DayRow[], key: keyof DayRow) {
  return data.reduce((s, d) => s + (d[key] as number), 0);
}

function avg(data: DayRow[], key: keyof DayRow) {
  return total(data, key) / (data.length || 1);
}

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

function pct(curr: number, prev: number) {
  return ((curr - prev) / (prev || 1)) * 100;
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

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 72; const H = 24;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  inverse?: boolean;
  sub?: string;
  sparkData: number[];
  accent: string;
  icon: React.ElementType;
}

function KpiCard({ label, value, delta, inverse, sub, sparkData, accent, icon: Icon }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden group transition-shadow hover:shadow-md">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${accent}12 0%, transparent 65%)` }}
      />
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accent}18` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <DeltaPill delta={delta} inverse={inverse} />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
        <Sparkline data={sparkData} color={accent} />
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-3 py-2 text-sm min-w-[140px]">
      <p className="text-muted-foreground text-[11px] mb-1.5">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground text-[11px]">{p.name}</span>
          </div>
          <span className="font-semibold text-[12px]">
            {["Gasto", "CPC", "CPA"].includes(p.name)
              ? `$${p.value.toFixed(2)}`
              : ["CTR", "CVR", "Inicio pagos %"].includes(p.name)
              ? `${(p.value * 100).toFixed(2)}%`
              : fmtCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConversionFunnel({
  impressions, clicks, initiateCheckout, sales,
}: { impressions: number; clicks: number; initiateCheckout: number; sales: number }) {
  const stages = [
    { label: "Impresiones",       value: impressions,      color: "#6366f1", w: 100 },
    { label: "Clics",             value: clicks,           color: "#06b6d4", w: Math.max(14, (clicks / impressions) * 100 * 7) },
    { label: "Inicio de pagos",   value: initiateCheckout, color: "#a78bfa", w: Math.max(10, (initiateCheckout / impressions) * 100 * 18) },
    { label: "Ventas",            value: sales,            color: "#f43f5e", w: Math.max(6,  (sales / impressions) * 100 * 50) },
  ];

  const connectorRates = [
    `${((clicks / impressions) * 100).toFixed(2)}% CTR`,
    `${((initiateCheckout / (clicks || 1)) * 100).toFixed(1)}% inicio`,
    `${((sales / (initiateCheckout || 1)) * 100).toFixed(1)}% cierre`,
  ];

  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="text-xs font-bold tabular-nums">{fmtCompact(s.value)}</span>
          </div>
          <div className="h-8 flex items-center">
            <div
              className="h-full rounded-lg transition-all duration-700"
              style={{
                width: `${Math.min(s.w, 100)}%`,
                backgroundColor: `${s.color}22`,
                border: `1px solid ${s.color}44`,
              }}
            />
          </div>
          {i < stages.length - 1 && (
            <p className="text-center text-[11px] text-muted-foreground/60 my-0.5">
              ↓ {connectorRates[i]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [periodIdx, setPeriodIdx] = useState(2);
  const [activeMetric, setActiveMetric] = useState<typeof CHART_METRICS[number]["key"]>("spend");

  const days = PERIODS[periodIdx].days;

  // ── Rango de fechas para el período seleccionado ──
  const dateRange = useMemo(() => {
    const to = new Date();
    const from = subDays(to, days - 1);
    return { from, to };
  }, [days]);

  // ── Datos reales de Meta ──
  const { data: realDaily, isLoading } = useMetricsDaily(dateRange);

  // ── Datos mock (fallback mientras no hay cuenta conectada) ──
  const mockData = useMemo(() => generateDays(days), [days]);

  // Normalizar datos reales al shape que usan los charts
  const realDataMapped = useMemo(() => {
    if (!realDaily || realDaily.length === 0) return null;
    return realDaily.map((d: DailyMetric) => ({
      label: format(new Date(d.date + "T12:00:00"), "d MMM", { locale: es }),
      spend: d.spend,
      impressions: d.impressions,
      clicks: d.clicks,
      conversions: d.conversions,
      initiateCheckout: d.initiate_checkout,
      sales: d.conversions, // Meta no distingue sales de conversions sin configuración adicional
      reach: d.reach,
      ctr: d.ctr,
      cpc: d.cpc,
      cpm: d.cpm,
      roas: d.roas ?? 0,
      cvr: d.clicks > 0 ? d.conversions / d.clicks : 0,
      initPayRate: d.clicks > 0 ? d.initiate_checkout / d.clicks : 0,
      cpa: d.conversions > 0 ? d.spend / d.conversions : 0,
      // campos no disponibles en Meta Ads directamente
      carga: 0,
      pageLoad: 0,
    }));
  }, [realDaily]);

  const data = realDataMapped ?? mockData;
  const isRealData = !!realDataMapped;

  // ── Totales y promedios ──
  const totalSpend            = total(data, "spend");
  const totalImpressions      = total(data, "impressions");
  const totalClicks           = total(data, "clicks");
  const totalConversions      = total(data, "conversions");
  const totalSales            = total(data, "sales");
  const totalInitiateCheckout = total(data, "initiateCheckout");

  const avgCtr          = totalClicks / (totalImpressions || 1);
  const avgCpc          = totalSpend  / (totalClicks      || 1);
  const avgRoas         = isRealData
    ? (realDaily!.reduce((s, d) => s + (d.roas ?? 0), 0) / (realDaily!.filter(d => d.roas).length || 1))
    : (totalConversions * 38) / (totalSpend || 1);
  const avgCvr          = totalConversions      / (totalClicks           || 1);
  const avgInitPayRate  = totalInitiateCheckout / (totalClicks           || 1);
  const avgCpa          = totalSpend            / (totalConversions      || 1);
  const avgCarga        = avg(data, "carga");
  const avgPageLoad     = avg(data, "pageLoad");

  // ── Período anterior (ratio fijo para deltas) ──
  const prevSpend            = totalSpend            * 0.868;
  const prevImpressions      = totalImpressions      * 0.891;
  const prevClicks           = totalClicks           * 0.879;
  const prevConversions      = totalConversions      * 0.852;
  const prevSales            = totalSales            * 0.841;
  const prevInitiateCheckout = totalInitiateCheckout * 0.863;
  const prevCarga            = avgCarga              * 0.927;
  const prevPageLoad         = avgPageLoad           * 1.08;

  const prevCtr         = prevClicks           / (prevImpressions      || 1);
  const prevCpc         = prevSpend            / (prevClicks           || 1);
  const prevRoas        = (prevConversions * 38) / (prevSpend          || 1);
  const prevCvr         = prevConversions      / (prevClicks           || 1);
  const prevInitPayRate = prevInitiateCheckout / (prevClicks           || 1);
  const prevCpa         = prevSpend            / (prevConversions      || 1);

  const metric = CHART_METRICS.find(m => m.key === activeMetric)!;

  const campaignData = CAMPAIGNS.map(c => ({
    name:  c.name,
    color: c.color,
    spend: Math.round(totalSpend * c.share),
    roas:  Number((avgRoas * (c.share * 2.6 + 0.1)).toFixed(2)),
  }));

  const tickInterval = days <= 7 ? 0 : days <= 14 ? 1 : Math.floor(days / 9);

  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Métricas</h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
            {isLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Cargando datos de Meta...</>
            ) : isRealData ? (
              <>Datos reales · últimos {days} días</>
            ) : (
              <>Vista previa · <span className="text-amber-500 font-medium">conecta tu cuenta Meta para ver datos reales</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriodIdx(i)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                periodIdx === i
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards — fila 1: métricas base ── */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Rendimiento general</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Gasto total"
            value={fmtUSD(totalSpend)}
            delta={pct(totalSpend, prevSpend)}
            sub={`CPC: $${avgCpc.toFixed(2)}`}
            sparkData={data.map(d => d.spend)}
            accent="#6366f1"
            icon={DollarSign}
          />
          <KpiCard
            label="Impresiones"
            value={fmtCompact(totalImpressions)}
            delta={pct(totalImpressions, prevImpressions)}
            sparkData={data.map(d => d.impressions)}
            accent="#f59e0b"
            icon={Eye}
          />
          <KpiCard
            label="Clics"
            value={fmtCompact(totalClicks)}
            delta={pct(totalClicks, prevClicks)}
            sparkData={data.map(d => d.clicks)}
            accent="#06b6d4"
            icon={MousePointerClick}
          />
          <KpiCard
            label="CTR promedio"
            value={`${(avgCtr * 100).toFixed(2)}%`}
            delta={pct(avgCtr, prevCtr)}
            sparkData={data.map(d => d.ctr)}
            accent="#8b5cf6"
            icon={Target}
          />
          <KpiCard
            label="CPC promedio"
            value={`$${avgCpc.toFixed(2)}`}
            delta={pct(avgCpc, prevCpc)}
            inverse
            sparkData={data.map(d => d.cpc)}
            accent="#f97316"
            icon={Zap}
          />
          <KpiCard
            label="ROAS"
            value={`${avgRoas.toFixed(2)}x`}
            delta={pct(avgRoas, prevRoas)}
            sub={`${fmtCompact(totalConversions)} conv.`}
            sparkData={data.map(d => d.roas)}
            accent="#34d399"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* ── KPI Cards — fila 2: conversión y ventas ── */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Conversión y ventas</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Carga de página"
            value={`${avgPageLoad.toFixed(2)}s`}
            delta={pct(avgPageLoad, prevPageLoad)}
            inverse
            sub="tiempo de carga promedio"
            sparkData={data.map(d => d.pageLoad)}
            accent="#e879f9"
            icon={Timer}
          />
          <KpiCard
            label="Carga publicitaria"
            value={`${avgCarga.toFixed(0)}%`}
            delta={pct(avgCarga, prevCarga)}
            sub="% presupuesto consumido"
            sparkData={data.map(d => d.carga)}
            accent="#0ea5e9"
            icon={BarChart2}
          />
          <KpiCard
            label="Tasa de conversión"
            value={`${(avgCvr * 100).toFixed(2)}%`}
            delta={pct(avgCvr, prevCvr)}
            sub={`${fmtCompact(totalConversions)} conversiones`}
            sparkData={data.map(d => d.cvr)}
            accent="#10b981"
            icon={Percent}
          />
          <KpiCard
            label="Inicio de pagos"
            value={`${(avgInitPayRate * 100).toFixed(1)}%`}
            delta={pct(avgInitPayRate, prevInitPayRate)}
            sub={`${fmtCompact(totalInitiateCheckout)} inicios`}
            sparkData={data.map(d => d.initPayRate)}
            accent="#a78bfa"
            icon={CreditCard}
          />
          <KpiCard
            label="Ventas"
            value={fmtCompact(totalSales)}
            delta={pct(totalSales, prevSales)}
            sub={`${fmtUSD(totalSales * 38)} ingresos est.`}
            sparkData={data.map(d => d.sales)}
            accent="#f43f5e"
            icon={ShoppingCart}
          />
          <KpiCard
            label="CPA general"
            value={`$${avgCpa.toFixed(2)}`}
            delta={pct(avgCpa, prevCpa)}
            inverse
            sub="costo por adquisición"
            sparkData={data.map(d => d.cpa)}
            accent="#fb923c"
            icon={Receipt}
          />
        </div>
      </div>

      {/* ── Gráfico principal ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Tendencia del período</CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CHART_METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setActiveMetric(m.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200",
                    activeMetric === m.key
                      ? "text-white border-transparent"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  style={activeMetric === m.key
                    ? { backgroundColor: m.color, borderColor: m.color }
                    : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={metric.color} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={v =>
                    activeMetric === "spend" ? `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}`
                    : fmtCompact(v)
                  }
                />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  name={metric.label}
                  stroke={metric.color}
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: metric.color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Fila split: CTR/CPC + Embudo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* CTR & CPC dual-axis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">CTR · CVR · CPC diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    yAxisId="rate"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    tickFormatter={v => `${(v * 100).toFixed(1)}%`}
                  />
                  <YAxis
                    yAxisId="cpc"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={38}
                    tickFormatter={v => `$${v.toFixed(2)}`}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Line yAxisId="rate" type="monotone" dataKey="ctr" name="CTR"
                    stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  <Line yAxisId="rate" type="monotone" dataKey="cvr" name="CVR"
                    stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} strokeDasharray="4 2" />
                  <Line yAxisId="cpc" type="monotone" dataKey="cpc" name="CPC"
                    stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-5 mt-2 pt-2 border-t flex-wrap">
              {[
                { color: "#8b5cf6", label: "CTR", value: `${(avgCtr * 100).toFixed(2)}%` },
                { color: "#10b981", label: "CVR", value: `${(avgCvr * 100).toFixed(2)}%`, dashed: true },
                { color: "#f97316", label: "CPC", value: `$${avgCpc.toFixed(2)}` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-8 h-0.5 rounded" style={{
                    backgroundColor: item.color,
                    backgroundImage: item.dashed ? `repeating-linear-gradient(90deg,${item.color} 0,${item.color} 4px,transparent 4px,transparent 6px)` : undefined,
                  }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Embudo de conversión — 4 etapas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Embudo de conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversionFunnel
              impressions={totalImpressions}
              clicks={totalClicks}
              initiateCheckout={totalInitiateCheckout}
              sales={totalSales}
            />
            <div className="mt-4 pt-4 border-t grid grid-cols-4 divide-x text-center">
              {[
                { label: "Alcance",   value: fmtCompact(totalImpressions),      color: "#6366f1" },
                { label: "Clics",     value: fmtCompact(totalClicks),           color: "#06b6d4" },
                { label: "Checkout",  value: fmtCompact(totalInitiateCheckout), color: "#a78bfa" },
                { label: "Ventas",    value: fmtCompact(totalSales),            color: "#f43f5e" },
              ].map(s => (
                <div key={s.label} className="px-1">
                  <p className="text-base font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CPA y Carga diaria ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">CPA general y carga diaria</CardTitle>
            <span className="text-xs text-muted-foreground">Período de {days} días</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  yAxisId="cpa"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={v => `$${v.toFixed(0)}`}
                />
                <YAxis
                  yAxisId="carga"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<ChartTip />} />
                <Line yAxisId="cpa" type="monotone" dataKey="cpa" name="CPA"
                  stroke="#fb923c" strokeWidth={2.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                <Line yAxisId="carga" type="monotone" dataKey="carga" name="Carga %"
                  stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded bg-[#fb923c]" />
              <span className="text-xs text-muted-foreground">CPA promedio</span>
              <span className="text-xs font-semibold">${avgCpa.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded bg-[#0ea5e9]" />
              <span className="text-xs text-muted-foreground">Carga media</span>
              <span className="text-xs font-semibold">{avgCarga.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Rendimiento por campaña ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Rendimiento por campaña</CardTitle>
            <span className="text-xs text-muted-foreground">Gasto del período</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={campaignData}
                layout="vertical"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />
                <Tooltip
                  formatter={(v: unknown) => [fmtUSD(Number(v)), "Gasto"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="spend" radius={[0, 6, 6, 0]}>
                  {campaignData.map((c, i) => (
                    <Cell key={i} fill={c.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">ROAS por campaña</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {campaignData.map(c => (
                <div
                  key={c.name}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60"
                  style={{ background: `${c.color}08` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{c.name}</p>
                    <p className="text-sm font-bold" style={{ color: c.color }}>{c.roas}x</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
