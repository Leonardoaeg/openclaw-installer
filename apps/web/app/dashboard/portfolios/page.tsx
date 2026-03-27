"use client";

import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Lock,
  MoreHorizontal,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/subscription-context";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock portfolios — replace with real data
const PORTFOLIOS = [
  {
    id: "pf-1",
    name: "Portafolio Principal",
    accountId: "act_123456789",
    adAccount: "Mi Empresa Ads",
    campaigns: 8,
    spend: "$1,240",
    roas: 3.4,
    trend: "up",
    status: "active",
    lastSync: "hace 5 min",
  },
];

export default function PortfoliosPage() {
  const sub = useSubscription();
  const maxPf = sub.maxPortfolios ?? Infinity;
  const atLimit = PORTFOLIOS.length >= maxPf;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portafolios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {PORTFOLIOS.length} de {sub.maxPortfolios === null ? "∞" : sub.maxPortfolios} portafolios · Plan {sub.planName}
          </p>
        </div>
        {atLimit ? (
          <Button asChild className="gap-2 bg-amber-600 hover:bg-amber-500 text-white">
            <Link href="/dashboard/billing">
              <Lock className="w-4 h-4" />
              Ampliar plan
            </Link>
          </Button>
        ) : (
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="w-4 h-4" />
            Nuevo portafolio
          </Button>
        )}
      </div>

      {/* Plan limit notice */}
      {atLimit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-300">Límite de portafolios alcanzado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tu plan <strong>{sub.planName}</strong> permite {sub.maxPortfolios ?? "∞"} portafolio(s).
              Actualiza al plan Business para gestionar hasta 5.
            </p>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shrink-0">
            <Link href="/dashboard/billing">Actualizar</Link>
          </Button>
        </div>
      )}

      {/* Portfolio cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {PORTFOLIOS.map((pf) => (
          <Card key={pf.id} className="hover:border-indigo-500/40 transition-colors group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{pf.name}</p>
                    <p className="text-xs text-muted-foreground">{pf.adAccount}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{pf.campaigns}</p>
                  <p className="text-xs text-muted-foreground">Campañas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{pf.spend}</p>
                  <p className="text-xs text-muted-foreground">Gasto</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-lg font-bold">{pf.roas}x</p>
                    {pf.trend === "up" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">ROAS</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-muted-foreground">Sincronizado {pf.lastSync}</span>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Link href={`/dashboard/portfolios/${pf.id}`}>
                    <BarChart3 className="w-3.5 h-3.5" />
                    Ver detalle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add more - locked */}
        {atLimit && (
          <Link href="/dashboard/billing">
            <div className="rounded-xl border border-dashed border-amber-500/30 p-5 flex flex-col items-center justify-center h-full min-h-[200px] cursor-pointer hover:bg-amber-950/10 transition-colors">
              <Lock className="w-8 h-8 text-amber-400/50 mb-2" />
              <p className="text-sm font-medium text-amber-300/70">Desbloquear más portafolios</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Actualiza tu plan para agregar más
              </p>
              <Badge variant="outline" className="mt-3 text-amber-400 border-amber-500/30 text-xs">
                Requiere Business o superior
              </Badge>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
