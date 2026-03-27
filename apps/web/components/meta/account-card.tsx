"use client";

import { RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDisconnectMetaAccount, useSyncMetaAccount } from "@/hooks/use-meta-accounts";
import type { MetaAccount } from "@/types/meta";

interface AccountCardProps {
  account: MetaAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const disconnect = useDisconnectMetaAccount();
  const sync = useSyncMetaAccount();

  const isActive = account.status === "active";
  const lastSync = account.last_synced_at
    ? new Date(account.last_synced_at).toLocaleString("es", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Nunca";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
            {isActive ? (
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{account.meta_ad_account_id}</p>
          </div>
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Activa" : account.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Moneda</span>
          <span className="font-medium">{account.currency}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Último sync</span>
          <span className="font-medium">{lastSync}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={sync.isPending}
            onClick={() => sync.mutate(account.id)}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${sync.isPending ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={disconnect.isPending}
            onClick={() => {
              if (confirm("¿Desconectar esta cuenta? Se perderán los datos sincronizados.")) {
                disconnect.mutate(account.id);
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
