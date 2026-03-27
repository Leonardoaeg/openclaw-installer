"use client";

import { useState } from "react";
import { CheckCircle2, Edit3, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  trialDays: number;
  maxPortfolios: number | null;
  features: string[];
  active: boolean;
  color: string;
  subscribers: number;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: 0,
    trialDays: 14,
    maxPortfolios: 1,
    features: ["1 portafolio", "Dashboard", "Métricas", "Campañas", "Alertas"],
    active: true,
    color: "border-amber-500/40",
    subscribers: 12,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    trialDays: 0,
    maxPortfolios: 1,
    features: ["1 portafolio", "Dashboard", "Métricas", "Campañas", "Alertas", "Agente IA"],
    active: true,
    color: "border-indigo-500/40",
    subscribers: 18,
  },
  {
    id: "business",
    name: "Business",
    price: 24,
    trialDays: 0,
    maxPortfolios: 5,
    features: ["5 portafolios", "Dashboard por portafolio", "Análisis anuncios", "Campañas", "Alertas", "Agente IA"],
    active: true,
    color: "border-purple-500/40",
    subscribers: 9,
  },
  {
    id: "business_pro",
    name: "Business Pro",
    price: 35,
    trialDays: 0,
    maxPortfolios: null,
    features: ["Portafolios ilimitados", "Dashboard independiente", "Gestión completa", "Campañas", "Alertas premium", "Agente IA premium"],
    active: true,
    color: "border-emerald-500/40",
    subscribers: 2,
  },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const updatePlan = (id: string, field: keyof Plan, value: unknown) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de planes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configura precios, límites y características de cada plan.
          </p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          {saved ? <><CheckCircle2 className="w-4 h-4" />Guardado</> : <><Save className="w-4 h-4" />Guardar cambios</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn("border", plan.color)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                    {plan.subscribers} clientes
                  </Badge>
                </div>
                <button
                  onClick={() => setEditing(editing === plan.id ? null : plan.id)}
                  className="p-1.5 rounded hover:bg-accent transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing === plan.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Precio mensual ($)</Label>
                      <Input
                        type="number"
                        value={plan.price}
                        onChange={(e) => updatePlan(plan.id, "price", parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Días de trial</Label>
                      <Input
                        type="number"
                        value={plan.trialDays}
                        onChange={(e) => updatePlan(plan.id, "trialDays", parseInt(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Máx. portafolios (0 = ilimitado)</Label>
                      <Input
                        type="number"
                        value={plan.maxPortfolios ?? 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          updatePlan(plan.id, "maxPortfolios", v === 0 ? null : v);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Estado</Label>
                      <select
                        value={plan.active ? "active" : "inactive"}
                        onChange={(e) => updatePlan(plan.id, "active", e.target.value === "active")}
                        className="w-full h-8 text-sm rounded-md border bg-background px-2 focus:outline-none"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleSave} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar cambios
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold">
                      {plan.price === 0 ? "Gratis" : `$${plan.price}/mes`}
                    </span>
                    <span className={cn("text-xs px-2 py-1 rounded-full border", plan.active ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20" : "text-slate-400 border-slate-500/30")}>
                      {plan.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• {plan.maxPortfolios === null ? "Portafolios ilimitados" : `${plan.maxPortfolios} portafolio${plan.maxPortfolios > 1 ? "s" : ""}`}</p>
                    <p>• {plan.trialDays > 0 ? `${plan.trialDays} días de trial` : "Sin período de prueba"}</p>
                    {plan.features.slice(0, 3).map((f) => <p key={f}>• {f}</p>)}
                    {plan.features.length > 3 && <p className="text-indigo-400">+{plan.features.length - 3} más...</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
