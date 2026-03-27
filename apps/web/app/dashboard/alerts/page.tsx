"use client";

import { useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Target,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Tipos mock ───────────────────────────────────────────────────────────────

type MetricKey = "spend" | "ctr" | "cpc" | "roas" | "impressions";
type Condition = "gt" | "lt";
type AlertStatus = "active" | "paused";
type EventSeverity = "warning" | "critical" | "ok";

interface AlertRule {
  id: string;
  name: string;
  metric: MetricKey;
  condition: Condition;
  threshold: number;
  status: AlertStatus;
  campaign: string | null;
  lastTriggered: string | null;
  triggerCount: number;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: MetricKey;
  value: number;
  threshold: number;
  condition: Condition;
  severity: EventSeverity;
  campaign: string;
  firedAt: string;
}

// ─── Datos mock ───────────────────────────────────────────────────────────────

const MOCK_RULES: AlertRule[] = [
  {
    id: "r1",
    name: "Gasto diario alto",
    metric: "spend",
    condition: "gt",
    threshold: 800,
    status: "active",
    campaign: null,
    lastTriggered: "Hace 2 horas",
    triggerCount: 5,
  },
  {
    id: "r2",
    name: "CTR por debajo del mínimo",
    metric: "ctr",
    condition: "lt",
    threshold: 1.5,
    status: "active",
    campaign: "Temporada Verano",
    lastTriggered: "Hace 1 día",
    triggerCount: 2,
  },
  {
    id: "r3",
    name: "CPC demasiado alto",
    metric: "cpc",
    condition: "gt",
    threshold: 0.8,
    status: "paused",
    campaign: "Retargeting General",
    lastTriggered: "Hace 3 días",
    triggerCount: 8,
  },
  {
    id: "r4",
    name: "ROAS crítico",
    metric: "roas",
    condition: "lt",
    threshold: 1.5,
    status: "active",
    campaign: null,
    lastTriggered: null,
    triggerCount: 0,
  },
];

const MOCK_EVENTS: AlertEvent[] = [
  {
    id: "e1",
    ruleId: "r1",
    ruleName: "Gasto diario alto",
    metric: "spend",
    value: 863,
    threshold: 800,
    condition: "gt",
    severity: "warning",
    campaign: "Todas las campañas",
    firedAt: "Hace 2 horas",
  },
  {
    id: "e2",
    ruleId: "r1",
    ruleName: "Gasto diario alto",
    metric: "spend",
    value: 921,
    threshold: 800,
    condition: "gt",
    severity: "critical",
    campaign: "Todas las campañas",
    firedAt: "Hace 1 día",
  },
  {
    id: "e3",
    ruleId: "r2",
    ruleName: "CTR por debajo del mínimo",
    metric: "ctr",
    value: 1.12,
    threshold: 1.5,
    condition: "lt",
    severity: "warning",
    campaign: "Temporada Verano",
    firedAt: "Hace 1 día",
  },
  {
    id: "e4",
    ruleId: "r3",
    ruleName: "CPC demasiado alto",
    metric: "cpc",
    value: 0.92,
    threshold: 0.8,
    condition: "gt",
    severity: "warning",
    campaign: "Retargeting General",
    firedAt: "Hace 3 días",
  },
  {
    id: "e5",
    ruleId: "r4",
    ruleName: "ROAS crítico",
    metric: "roas",
    value: 2.8,
    threshold: 1.5,
    condition: "lt",
    severity: "ok",
    campaign: "Todas las campañas",
    firedAt: "Hace 5 días",
  },
];

// ─── Config de métricas ───────────────────────────────────────────────────────

const METRIC_CONFIG: Record<MetricKey, { label: string; icon: React.ElementType; color: string; unit: string }> = {
  spend:       { label: "Gasto",        icon: DollarSign,       color: "#6366f1", unit: "$"  },
  ctr:         { label: "CTR",          icon: Target,            color: "#8b5cf6", unit: "%" },
  cpc:         { label: "CPC",          icon: MousePointerClick, color: "#f97316", unit: "$"  },
  roas:        { label: "ROAS",         icon: TrendingDown,      color: "#34d399", unit: "x"  },
  impressions: { label: "Impresiones",  icon: Bell,              color: "#f59e0b", unit: ""   },
};

const SEVERITY_CONFIG: Record<EventSeverity, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  warning:  { label: "Advertencia", color: "text-amber-500",  bg: "bg-amber-500/10",  icon: AlertTriangle },
  critical: { label: "Crítico",     color: "text-red-500",    bg: "bg-red-500/10",    icon: XCircle       },
  ok:       { label: "Recuperado",  color: "text-emerald-500",bg: "bg-emerald-500/10",icon: CheckCircle2  },
};

function fmtValue(metric: MetricKey, value: number) {
  if (metric === "spend") return `$${value.toFixed(0)}`;
  if (metric === "ctr")   return `${value.toFixed(2)}%`;
  if (metric === "cpc")   return `$${value.toFixed(2)}`;
  if (metric === "roas")  return `${value.toFixed(2)}x`;
  return value.toLocaleString("es-MX");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AlertRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = METRIC_CONFIG[rule.metric];
  const Icon = cfg.icon;
  const isActive = rule.status === "active";

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      !isActive && "opacity-60",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícono de métrica */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${cfg.color}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>

          {/* Contenido */}
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
                {rule.condition === "gt" ? ">" : "<"} {fmtValue(rule.metric, rule.threshold)}
              </span>
              {rule.campaign && (
                <> · <span className="text-primary">{rule.campaign}</span></>
              )}
            </p>

            <div className="flex items-center gap-3 mt-2">
              {rule.lastTriggered ? (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {rule.lastTriggered}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Nunca activada</span>
              )}
              {rule.triggerCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {rule.triggerCount} activaciones
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggle(rule.id)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={isActive ? "Pausar" : "Activar"}
            >
              {isActive
                ? <ToggleRight className="w-5 h-5 text-primary" />
                : <ToggleLeft  className="w-5 h-5 text-muted-foreground" />}
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: AlertEvent }) {
  const sev  = SEVERITY_CONFIG[event.severity];
  const SevIcon = sev.icon;
  const cfg  = METRIC_CONFIG[event.metric];

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", sev.bg)}>
        <SevIcon className={cn("w-3.5 h-3.5", sev.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{event.ruleName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {cfg.label}: <span className="font-semibold text-foreground">{fmtValue(event.metric, event.value)}</span>
          {" "}({event.condition === "gt" ? ">" : "<"} {fmtValue(event.metric, event.threshold)})
          {" · "}{event.campaign}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={cn("text-[10px] border-0", sev.bg, sev.color)}>
          {sev.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground hidden sm:block">{event.firedAt}</span>
      </div>
    </div>
  );
}

// ─── Modal nueva alerta (simplificado) ───────────────────────────────────────

const METRICS_LIST: MetricKey[] = ["spend", "ctr", "cpc", "roas", "impressions"];
const CAMPAIGNS_LIST = ["Todas las campañas", "Temporada Verano", "Retargeting General", "Captación Leads B2B", "Awareness Marca"];

function NewAlertModal({ onClose, onSave }: { onClose: () => void; onSave: (rule: AlertRule) => void }) {
  const [name,      setName]      = useState("");
  const [metric,    setMetric]    = useState<MetricKey>("spend");
  const [condition, setCondition] = useState<Condition>("gt");
  const [threshold, setThreshold] = useState("");
  const [campaign,  setCampaign]  = useState("Todas las campañas");

  const handleSave = () => {
    if (!name || !threshold) return;
    onSave({
      id: `r${Date.now()}`,
      name,
      metric,
      condition,
      threshold: parseFloat(threshold),
      status: "active",
      campaign: campaign === "Todas las campañas" ? null : campaign,
      lastTriggered: null,
      triggerCount: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Nueva regla de alerta</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Gasto diario alto"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Métrica</label>
              <select
                value={metric}
                onChange={e => setMetric(e.target.value as MetricKey)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {METRICS_LIST.map(m => (
                  <option key={m} value={m}>{METRIC_CONFIG[m].label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Condición</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as Condition)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="gt">Mayor que</option>
                <option value="lt">Menor que</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Valor umbral ({METRIC_CONFIG[metric].unit || "unidades"})
            </label>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Campaña</label>
            <select
              value={campaign}
              onChange={e => setCampaign(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CAMPAIGNS_LIST.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name || !threshold}>
            Crear alerta
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>(MOCK_RULES);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"rules" | "history">("rules");

  const activeCount  = rules.filter(r => r.status === "active").length;
  const criticalCount = MOCK_EVENTS.filter(e => e.severity === "critical").length;

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r
    ));
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = (rule: AlertRule) => {
    setRules(prev => [rule, ...prev]);
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Reglas automáticas para monitorear tus campañas
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva alerta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reglas activas",    value: activeCount,              color: "#6366f1", bg: "#6366f118" },
          { label: "Alertas críticas",  value: criticalCount,            color: "#ef4444", bg: "#ef444418" },
          { label: "Total disparos",    value: rules.reduce((s, r) => s + r.triggerCount, 0), color: "#f59e0b", bg: "#f59e0b18" },
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
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "rules" ? `Reglas (${rules.length})` : "Historial"}
          </button>
        ))}
      </div>

      {/* Reglas */}
      {tab === "rules" && (
        <div className="space-y-3">
          {rules.length === 0 && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Sin reglas configuradas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primera alerta para recibir notificaciones automáticas.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Crear alerta
                </Button>
              </CardContent>
            </Card>
          )}
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Historial */}
      {tab === "history" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Historial de disparos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {MOCK_EVENTS.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
            <button className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-muted">
              Ver más <ChevronRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <NewAlertModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
