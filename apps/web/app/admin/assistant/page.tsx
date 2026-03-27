"use client";

import { useEffect, useState } from "react";
import { Bot, Brain, CheckCircle2, Loader2, MessageSquare, Save, Sliders, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PERSONAS = [
  { id: "analyst", label: "Analista experto", desc: "Tono técnico, datos precisos, recomendaciones basadas en métricas." },
  { id: "coach",   label: "Coach de negocios", desc: "Tono motivador, enfocado en crecimiento y oportunidades." },
  { id: "advisor", label: "Asesor estratégico", desc: "Tono profesional, balance entre datos y visión de negocio." },
];

interface AutoRule {
  id: string;
  label: string;
  action?: string;
  enabled: boolean;
}

const DEFAULT_RULES: AutoRule[] = [
  { id: "low_roas",       label: "ROAS bajo umbral",          action: "Alertar y sugerir pausar campaña",                   enabled: true  },
  { id: "high_cpa",       label: "CPA supera límite",         action: "Recomendar ajuste de audiencia o presupuesto",       enabled: true  },
  { id: "low_ctr",        label: "CTR menor al mínimo",       action: "Sugerir mejorar creativos del anuncio",              enabled: true  },
  { id: "budget_alert",   label: "Presupuesto >90% consumido",action: "Alertar inmediatamente al usuario",                  enabled: true  },
  { id: "high_frequency", label: "Frecuencia >3",             action: "Sugerir renovar creativos para evitar fatiga",       enabled: false },
];

export default function AdminAssistantPage() {
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [persona, setPersona]         = useState("analyst");
  const [model, setModel]             = useState("claude-sonnet-4-6");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens]     = useState("2000");
  const [rules, setRules]             = useState<AutoRule[]>(DEFAULT_RULES);

  useEffect(() => {
    fetch("/api/admin/assistant")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setPersona(data.persona ?? "analyst");
        setModel(data.model ?? "claude-sonnet-4-6");
        setSystemPrompt(data.system_prompt ?? "");
        setTemperature(String(data.temperature ?? "0.7"));
        setMaxTokens(String(data.max_tokens ?? "2000"));
        if (Array.isArray(data.auto_rules) && data.auto_rules.length > 0) {
          setRules(data.auto_rules);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/assistant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona,
        model,
        system_prompt: systemPrompt,
        temperature:   parseFloat(temperature),
        max_tokens:    parseInt(maxTokens),
        auto_rules:    rules,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Asistente IA</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define el comportamiento del agente para todos los clientes.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" />Guardado</>
          ) : (
            <><Save className="w-4 h-4" />Guardar config.</>
          )}
        </Button>
      </div>

      {/* Personalidad */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Personalidad del asistente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PERSONAS.map((p) => (
            <div
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                persona === p.id
                  ? "border-indigo-500/60 bg-indigo-950/20"
                  : "border-border hover:border-border/80 hover:bg-accent/30"
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                persona === p.id ? "border-indigo-500 bg-indigo-500" : "border-border"
              }`}>
                {persona === p.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System prompt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Prompt de sistema (instrucciones base)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="w-full text-sm rounded-xl border bg-background px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-foreground"
            placeholder="Escribe las instrucciones base del asistente..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Este prompt se usa como contexto inicial en cada conversación. Los clientes no lo ven.
          </p>
        </CardContent>
      </Card>

      {/* Parámetros del modelo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Parámetros del modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm">Modelo de IA</Label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rápido)</option>
                <option value="claude-opus-4-6">Claude Opus 4.6 (avanzado)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Temperatura (0–1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">0 = preciso · 1 = creativo</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Max tokens respuesta</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reglas automáticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Reglas automáticas del asistente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cuando se detecte la condición, el asistente enviará automáticamente un consejo o alerta al usuario.
          </p>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${rule.enabled ? "" : "opacity-50"}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${rule.enabled ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${rule.enabled ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium">{rule.label}</p>
                  {rule.action && <p className="text-xs text-muted-foreground">→ {rule.action}</p>}
                </div>
              </div>
              <Brain className="w-4 h-4 text-indigo-400/50 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
