"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignTable } from "@/components/meta/campaign-table";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useMetaAccounts } from "@/hooks/use-meta-accounts";

const STATUS_FILTERS = [
  { label: "Todas", value: "" },
  { label: "Activas", value: "ACTIVE" },
  { label: "Pausadas", value: "PAUSED" },
];

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const { data: accounts } = useMetaAccounts();
  const { data: campaigns, isLoading, isError } = useCampaigns({
    account_id: accountFilter || undefined,
    status_filter: statusFilter || undefined,
  });

  const activeCount = campaigns?.filter((c) => c.status === "ACTIVE").length ?? 0;
  const pausedCount = campaigns?.filter((c) => c.status === "PAUSED").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campañas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {campaigns
            ? `${campaigns.length} campañas · ${activeCount} activas · ${pausedCount} pausadas`
            : "Cargando..."}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Filtro por estado */}
        <div className="flex rounded-lg border overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro por cuenta */}
        {accounts && accounts.length > 1 && (
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error cargando campañas. Verifica que el API esté activo.
          </p>
        </div>
      )}

      {campaigns && <CampaignTable campaigns={campaigns} />}
    </div>
  );
}
