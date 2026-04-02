"use client";

import { useState } from "react";
import {
  Bell, Plus, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle, TrendingDown, DollarSign, MousePointerClick,
  Target, XCircle, Clock, CheckCircle2,
  Loader2, BrainCircuit, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAlerts, useCreateAlert, useToggleAlert, useDeleteAlert, useAnalyzeEvent,
} from "@/hooks/use-alerts";

// ─── Config visual ────────────────────────────────────────────────────────────

const METRIC_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; unit: string }> = {
  spend:       { label: "Gasto",       icon: DollarSign,        color: "#6366f1", unit: "$" },
  ctr:         { label: "CTR",         icon: Target,            color: "#8b5cf6", unit: "%" },
  cpc:         { label: "CPC",         icon: MousePointerClick, color: "#f97316", unit: "$" },
  roas:        { label: "ROAS",        icon: TrendingDown,      color: "#34d399", unit: "x" },
  impressions: { label: "Impresiones", icon: Bell,              color: "#f59e0b", unit: ""  },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  warning:  { label: "Advertencia", color: "text-amber-500",   bg: "bg-amber-500/10",   icon: AlertTriangle },
  critical: { label: "Crítico",     color: "text-red-500",     bg: "bg-red-500/10",     icon: XCircle       },
  ok:       { label: "Recuperado",  color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2  },
};

// ─── Demo data ────────────────────────────────────────────────────────────────

export const DEMO_RULES = [
  { id: "dr1", name: "Gasto diario alto",      metric: "spend",  operator: "gt",  threshold: 150,  status: "active"  as const, campaign_id: null,       trigger_count: 4,  last_triggered_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),  created_at: "2026-03-20T00:00:00Z" },
  { id: "dr2", name: "CTR bajo en campañas",   metric: "ctr",    operator: "lt",  threshold: 1.5,  status: "active"  as const, campaign_id: "23860001", trigger_count: 7,  last_triggered_at: new Date(Date.now() - 18 * 3_600_000).toISOString(), created_at: "2026-03-18T00:00:00Z" },
  { id: "dr3", name: "CPC elevado",            metric: "cpc",    operator: "gt",  threshold: 3.50, status: "active"  as const, campaign_id: null,       trigger_count: 2,  last_triggered_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),  created_at: "2026-03-22T00:00:00Z" },
  { id: "dr4", name: "ROAS mínimo requerido",  metric: "roas",   operator: "lt",  threshold: 2.0,  status: "paused"  as const, campaign_id: "23860002", trigger_count: 1,  last_triggered_at: new Date(Date.now() - 72 * 3_600_000).toISOString(), created_at: "2026-03-15T00:00:00Z" },
  { id: "dr5", name: "Impresiones bajas",      metric: "impressions", operator: "lt", threshold: 5000, status: "active" as const, campaign_id: "23860003", trigger_count: 0, last_triggered_at: null, created_at: "2026-03-28T00:00:00Z" },
];

export const DEMO_EVENTS = [
  { id: "de1", rule_id: "dr1", metric: "spend",        value: 187.40, threshold: 150,  operator: "gt", severity: "critical" as const, campaign_name: "Temporada Verano",    fired_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),  ai_analysis: "El gasto de $187 supera el límite diario de $150. La campaña 'Temporada Verano' está consumiendo presupuesto un 25% más rápido de lo previsto. Recomiendo reducir las pujas en los segmentos de audiencia de menor conversión o pausar temporalmente los grupos de anuncios con CPM elevado." },
  { id: "de2", rule_id: "dr2", metric: "ctr",          value: 0.92,   threshold: 1.5,  operator: "lt", severity: "critical" as const, campaign_name: "Captación Leads B2B",  fired_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),  ai_analysis: null },
  { id: "de3", rule_id: "dr3", metric: "cpc",          value: 4.10,   threshold: 3.50, operator: "gt", severity: "warning"  as const, campaign_name: "Retargeting General",  fired_at: new Date(Date.now() - 18 * 3_600_000).toISOString(), ai_analysis: null },
  { id: "de4", rule_id: "dr2", metric: "ctr",          value: 1.20,   threshold: 1.5,  operator: "lt", severity: "warning"  as const, campaign_name: "Awareness Marca",      fired_at: new Date(Date.now() - 26 * 3_600_000).toISOString(), ai_analysis: null },
  { id: "de5", rule_id: "dr4", metric: "roas",         value: 1.80,   threshold: 2.0,  operator: "lt", severity: "critical" as const, campaign_name: "Retargeting General",  fired_at: new Date(Date.now() - 72 * 3_600_000).toISOString(), ai_analysis: null },
  { id: "de6", rule_id: "dr1", metric: "spend",        value: 143.00, threshold: 150,  operator: "gt", severity: "ok"       as const, campaign_name: "Temporada Verano",    fired_at: new Date(Date.now() - 96 * 3_600_000).toISOString(), ai_analysis: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtValue(metric: string, value: number) {
  if (metric === "spend") return `$${value.toFixed(0)}`;
  if (metric === "ctr")   return `${value.toFixed(2)}%`;
  if (metric === "cpc")   return `$${value.toFixed(2)}`;
  if (metric === "roas")  return `${value.toFixed(2)}x`;
  return value.toLocaleString("es-MX");
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Hace menos de 1h";
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

// ─── RuleCard ─────────────────────────────────────────────────────────────────

type AlertStatus = "active" | "paused";

function RuleCard({ rule, onToggle, onDelete, isDemo }: {
  rule: { id: string; name: string; metric: string; operator: string; threshold: number; status: AlertStatus; campaign_id: string | null; trigger_count: number; last_triggered_at: string | null };
  onToggle: (id: string, next: AlertStatus) => void;
  onDelete: (id: string) => void;
  isDemo: boolean;
}) {
  const cfg = METRIC_CONFIG[rule.metric] ?? METRIC_CONFIG.spend;
  const Icon = cfg.icon;
  const isActive = rule.status === "active";

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", !isActive && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${cfg.color}18` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm leading-tight">{rule.name}</p>
              <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] h-4">
                {isActive ? "Activa" : "Pausada"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cfg.label}{" "}
              <span className="font-medium text-foreground">
                {rule.operator === "gt" || rule.operator === "gte" ? ">" : "<"}{" "}
                {fmtValue(rule.metric, rule.threshold)}
              </span>
              {rule.campaign_id && <> · <span className="text-primary">{rule.campaign_id}</span></>}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {rule.last_triggered_at ? (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />{fmtDate(rule.last_triggered_at)}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Nunca activada</span>
              )}
              {rule.trigger_count > 0 && (
                <span className="text-[11px] text-muted-foreground">{rule.trigger_count} activaciones</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => !isDemo && onToggle(rule.id, isActive ? "paused" : "active")}
              className={cn("p-1.5 rounded-lg hover:bg-muted transition-colors", isDemo && "cursor-default opacity-50")}
              title={isDemo ? "Demo" : isActive ? "Pausar" : "Activar"}>
              {isActive
                ? <ToggleRight className="w-5 h-5 text-primary" />
                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
            </button>
            <button onClick={() => !isDemo && onDelete(rule.id)}
              className={cn("p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground", isDemo && "cursor-default opacity-50")}
              title={isDemo ? "Demo" : "Eliminar"}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, onAnalyze, analyzing, isDemo }: {
  event: { id: string; metric: string; value: number; threshold: number; operator: string; severity: string; campaign_name: string; fired_at: string; ai_analysis: string | null };
  onAnalyze: (id: string) => void;
  analyzing: boolean;
  isDemo: boolean;
}) {
  const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.warning;
  const SevIcon = sev.icon;
  const cfg = METRIC_CONFIG[event.metric] ?? METRIC_CONFIG.spend;
  const [expanded, setExpanded] = useState(false);

  const [demoAnalysis, setDemoAnalysis] = useState<string | null>(event.ai_analysis);
  const [demoAnalyzing, setDemoAnalyzing] = useState(false);

  const handleDemoAnalyze = () => {
    if (demoAnalysis) { setExpanded(true); return; }
    setDemoAnalyzing(true);
    setTimeout(() => {
      setDemoAnalysis("Trafiker detectó una anomalía en esta campaña. El valor actual está fuera del umbral configurado, lo que puede indicar un cambio en el comportamiento de la audiencia o en la competencia de subasta. Se recomienda revisar los segmentos de mayor coste y ajustar las pujas de forma gradual para recuperar la eficiencia.");
      setDemoAnalyzing(false);
      setExpanded(true);
    }, 1800);
  };

  const effectiveAnalysis = isDemo ? demoAnalysis : event.ai_analysis;
  const effectiveAnalyzing = isDemo ? demoAnalyzing : analyzing;

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", sev.bg)}>
          <SevIcon className={cn("w-3.5 h-3.5", sev.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{event.campaign_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cfg.label}: <span className="font-semibold text-foreground">{fmtValue(event.metric, event.value)}</span>
            {" "}({event.operator === "gt" || event.operator === "gte" ? ">" : "<"} {fmtValue(event.metric, event.threshold)})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={cn("text-[10px] border-0", sev.bg, sev.color)}>
            {sev.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden sm:block">{fmtDate(event.fired_at)}</span>
          <button
            onClick={() => { isDemo ? handleDemoAnalyze() : (onAnalyze(event.id), setExpanded(true)); }}
            disabled={effectiveAnalyzing}
            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground disabled:opacity-50"
            title="Analizar con Trafiker">
            {effectiveAnalyzing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <BrainCircuit className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && effectiveAnalysis && (
        <div className="mt-2 ml-10 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <BrainCircuit className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{effectiveAnalysis}</p>
        </div>
      )}
    </div>
  );
}

// ─── Modal nueva alerta ───────────────────────────────────────────────────────

type MetricKey = "spend" | "ctr" | "cpc" | "roas" | "impressions";
type Operator = "gt" | "lt";

function NewAlertModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: { name: string; metric: string; operator: string; threshold: number }) => void;
}) {
  const [name, setName] = useState("");
  const [metric, setMetric] = useState<MetricKey>("spend");
  const [operator, setOperator] = useState<Operator>("gt");
  const [threshold, setThreshold] = useState("");

  const handleSave = () => {
    if (!name || !threshold) return;
    onSave({ name, metric, operator, threshold: parseFloat(threshold) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Nueva regla de alerta</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej. Gasto diario alto"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Métrica</label>
              <select value={metric} onChange={e => setMetric(e.target.value as MetricKey)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                {(["spend", "ctr", "cpc", "roas", "impressions"] as MetricKey[]).map(m => (
                  <option key={m} value={m}>{METRIC_CONFIG[m].label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Condición</label>
              <select value={operator} onChange={e => setOperator(e.target.value as Operator)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="gt">Mayor que</option>
                <option value="lt">Menor que</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Umbral ({METRIC_CONFIG[metric]?.unit || "unidades"})
            </label>
            <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name || !threshold}>Crear alerta</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AlertsClient({ isDemo }: { isDemo: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"rules" | "history">("rules");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAlerts();
  const createAlert = useCreateAlert();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();
  const analyzeEvent = useAnalyzeEvent();

  const rules  = isDemo ? DEMO_RULES  : (data?.rules  ?? []);
  const events = isDemo ? DEMO_EVENTS : (data?.events ?? []);
  const loading = isDemo ? false : isLoading;
  const error   = isDemo ? false : isError;

  const activeCount   = rules.filter(r => r.status === "active").length;
  const criticalCount = events.filter(e => e.severity === "critical").length;

  const handleAnalyze = (eventId: string) => {
    setAnalyzingId(eventId);
    analyzeEvent.mutate(eventId, { onSettled: () => setAnalyzingId(null) });
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Alertas</h1>
            {isDemo && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                Demo
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Reglas automáticas monitoreadas por Trafiker
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => setShowModal(true)} disabled={isDemo} title={isDemo ? "No disponible en demo" : undefined}>
            <Plus className="w-4 h-4 mr-2" />Nueva alerta
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reglas activas",   value: activeCount,   color: "#6366f1", bg: "#6366f118" },
          { label: "Alertas críticas", value: criticalCount, color: "#ef4444", bg: "#ef444418" },
          { label: "Total disparos",   value: rules.reduce((s, r) => s + (r.trigger_count ?? 0), 0), color: "#f59e0b", bg: "#f59e0b18" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.bg }}>
                <Bell className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
        {(["rules", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}>
            {t === "rules" ? `Reglas (${rules.length})` : `Historial (${events.length})`}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error conectando con Trafiker. Intenta de nuevo.</p>
        </div>
      )}

      {/* Reglas */}
      {!loading && tab === "rules" && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Sin reglas configuradas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primera alerta para que Trafiker monitoree tus campañas.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />Crear alerta
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map(rule => (
              <RuleCard key={rule.id} rule={rule} isDemo={isDemo}
                onToggle={(id, status) => toggleAlert.mutate({ id, status })}
                onDelete={id => deleteAlert.mutate(id)} />
            ))
          )}
        </div>
      )}

      {/* Historial */}
      {!loading && tab === "history" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Historial de disparos
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                Toca el ícono de IA para analizar
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin eventos registrados</p>
            ) : (
              events.map(event => (
                <EventRow key={event.id} event={event} isDemo={isDemo}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzingId === event.id} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {showModal && !isDemo && (
        <NewAlertModal
          onClose={() => setShowModal(false)}
          onSave={data => createAlert.mutate(data as Parameters<typeof createAlert.mutate>[0])}
        />
      )}
    </div>
  );
}
