"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AlertCondition = "greater_than" | "less_than" | "equals";

interface MetricRule {
  id: string;
  metric: string;
  label: string;
  condition: AlertCondition;
  threshold: number;
  unit: string;
  severity: "info" | "warning" | "critical";
  enabled: boolean;
}

const DEFAULT_RULES: MetricRule[] = [
  { id: "1", metric: "cpa", label: "Costo por Adquisición (CPA)", condition: "greater_than", threshold: 15, unit: "$", severity: "warning", enabled: true },
  { id: "2", metric: "ctr", label: "Click-Through Rate (CTR)", condition: "less_than", threshold: 1.5, unit: "%", severity: "warning", enabled: true },
  { id: "3", metric: "roas", label: "Retorno en Gasto (ROAS)", condition: "less_than", threshold: 2, unit: "x", severity: "critical", enabled: true },
  { id: "4", metric: "cpc", label: "Costo por Clic (CPC)", condition: "greater_than", threshold: 2.5, unit: "$", severity: "info", enabled: false },
  { id: "5", metric: "frequency", label: "Frecuencia de anuncios", condition: "greater_than", threshold: 3, unit: "x", severity: "warning", enabled: true },
  { id: "6", metric: "budget_spent", label: "Presupuesto consumido", condition: "greater_than", threshold: 90, unit: "%", severity: "critical", enabled: true },
];

const SEVERITY_COLORS: Record<string, string> = {
  info: "text-blue-400 bg-blue-950/40 border-blue-500/30",
  warning: "text-amber-400 bg-amber-950/40 border-amber-500/30",
  critical: "text-red-400 bg-red-950/40 border-red-500/30",
};

const CONDITION_LABELS: Record<AlertCondition, string> = {
  greater_than: "Mayor que",
  less_than: "Menor que",
  equals: "Igual a",
};

export default function AdminMetricsPage() {
  const [rules, setRules] = useState<MetricRule[]>(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateThreshold = (id: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, threshold: num } : r));
    }
  };

  const updateSeverity = (id: string, severity: MetricRule["severity"]) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, severity } : r));
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de métricas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define los umbrales y alertas predeterminados para todos los clientes.
          </p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          {saved ? <><CheckCircle2 className="w-4 h-4" />Guardado</> : <><Save className="w-4 h-4" />Guardar config.</>}
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300">Métricas predeterminadas del asistente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estas reglas se aplican automáticamente a todos los clientes. Cada cliente puede personalizar sus propios umbrales en modo manual.
          </p>
        </div>
      </div>

      {/* Rules table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Reglas de alerta ({rules.filter((r) => r.enabled).length} activas)
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Nueva regla
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-xl border p-4 transition-all",
                rule.enabled ? "" : "opacity-50"
              )}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors shrink-0",
                      rule.enabled ? "bg-indigo-600" : "bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        rule.enabled ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>

                  <div>
                    <p className="text-sm font-medium">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {CONDITION_LABELS[rule.condition]} {rule.unit}{rule.threshold}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Threshold input */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{rule.unit}</span>
                    <Input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => updateThreshold(rule.id, e.target.value)}
                      className="w-20 h-7 text-xs"
                    />
                  </div>

                  {/* Severity selector */}
                  <div className="flex gap-1">
                    {(["info", "warning", "critical"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateSeverity(rule.id, s)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-medium border transition-all",
                          rule.severity === s
                            ? SEVERITY_COLORS[s]
                            : "text-muted-foreground border-transparent hover:border-border"
                        )}
                      >
                        {s === "info" ? "Info" : s === "warning" ? "Aviso" : "Crítico"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-1.5 rounded hover:bg-red-950/30 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* KPI defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">KPIs visibles por defecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["Gasto total", "Impresiones", "Clics", "CTR", "CPC", "CPA", "ROAS", "Conversiones", "Alcance", "Frecuencia", "CPM", "Presupuesto"].map((kpi) => (
              <label key={kpi} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-sm">{kpi}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
