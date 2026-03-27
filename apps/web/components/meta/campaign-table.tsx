"use client";

import { useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToggleCampaignStatus } from "@/hooks/use-campaigns";
import type { Campaign } from "@/types/meta";

interface CampaignTableProps {
  campaigns: Campaign[];
}

function StatusToggle({ campaign }: { campaign: Campaign }) {
  const toggle = useToggleCampaignStatus();
  const isActive = campaign.status === "ACTIVE";
  const isPending = toggle.isPending && toggle.variables?.campaignId === campaign.id;

  return (
    <button
      onClick={() =>
        toggle.mutate({
          campaignId: campaign.id,
          status: isActive ? "PAUSED" : "ACTIVE",
        })
      }
      disabled={isPending || campaign.status === "DELETED"}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive ? "bg-green-500" : "bg-muted-foreground/30"
      }`}
      title={isActive ? "Pausar campaña" : "Activar campaña"}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin mx-auto text-white" />
      ) : (
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            isActive ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      )}
    </button>
  );
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE:  { label: "Activa",   variant: "default" },
  PAUSED:  { label: "Pausada",  variant: "secondary" },
  DELETED: { label: "Eliminada", variant: "outline" },
};

export function CampaignTable({ campaigns }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No hay campañas para mostrar.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Conecta una cuenta Meta para sincronizar campañas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campaña</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Objetivo</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Presupuesto/día</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">On/Off</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {campaigns.map((c) => {
            const badge = STATUS_BADGE[c.status] ?? { label: c.status, variant: "outline" as const };
            return (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.meta_campaign_id}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {c.objective ? c.objective.replace(/_/g, " ").toLowerCase() : "—"}
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  {c.daily_budget != null ? `$${c.daily_budget.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusToggle campaign={c} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
