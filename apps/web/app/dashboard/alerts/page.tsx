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

function RuleCard({ rule, onToggle, onDelete }: {
  rule: { id: string; name: string; metric: string; operator: string; threshold: number; status: AlertStatus; campaign_id: string | null; trigger_count: number; last_triggered_at: string | null };
  onToggle: (id: string, next: AlertStatus) => void;
  onDelete: (id: string) => void;
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
            <button onClick={() => onToggle(rule.id, isActive ? "paused" : "active")}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={isActive ? "Pausar" : "Activar"}>
              {isActive
                ? <ToggleRight className="w-5 h-5 text-primary" />
                : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
            </button>
            <button onClick={() => onDelete(rule.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
              title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({ event, onAnalyze, analyzing }: {
  event: { id: string; metric: string; value: number; threshold: number; operator: string; severity: string; campaign_name: string; fired_at: string; ai_analysis: string | null };
  onAnalyze: (id: string) => void;
  analyzing: boolean;
}) {
  const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.warning;
  const SevIcon = sev.icon;
  const cfg = METRIC_CONFIG[event.metric] ?? METRIC_CONFIG.spend;
  const [expanded, setExpanded] = useState(false);

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
            onClick={() => { onAnalyze(event.id); setExpanded(true); }}
            disabled={analyzing}
            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground disabled:opacity-50"
            title="Analizar con Trafiker">
            {analyzing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <BrainCircuit className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && event.ai_analysis && (
        <div className="mt-2 ml-10 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <BrainCircuit className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{event.ai_analysis}</p>
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

export default function AlertsPage() {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"rules" | "history">("rules");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAlerts();
  const createAlert = useCreateAlert();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();
  const analyzeEvent = useAnalyzeEvent();

  const rules = data?.rules ?? [];
  const events = data?.events ?? [];
  const activeCount = rules.filter(r => r.status === "active").length;
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
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Reglas automáticas monitoreadas por Trafiker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowModal(true)}>
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
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error conectando con Trafiker. Intenta de nuevo.</p>
        </div>
      )}

      {/* Reglas */}
      {!isLoading && tab === "rules" && (
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
              <RuleCard key={rule.id} rule={rule}
                onToggle={(id, status) => toggleAlert.mutate({ id, status })}
                onDelete={id => deleteAlert.mutate(id)} />
            ))
          )}
        </div>
      )}

      {/* Historial */}
      {!isLoading && tab === "history" && (
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
                <EventRow key={event.id} event={event}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzingId === event.id} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {showModal && (
        <NewAlertModal
          onClose={() => setShowModal(false)}
          onSave={data => createAlert.mutate(data as Parameters<typeof createAlert.mutate>[0])}
        />
      )}
    </div>
  );
}
