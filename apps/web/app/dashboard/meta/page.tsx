"use client";

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountCard } from "@/components/meta/account-card";
import { useMetaAccounts } from "@/hooks/use-meta-accounts";

export default function MetaAccountsPage() {
  const { data: accounts, isLoading, isError } = useMetaAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas de Meta Ads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conecta y gestiona tus cuentas de Facebook e Instagram Ads.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/meta/connect">
            <Plus className="w-4 h-4 mr-2" />
            Conectar cuenta
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error cargando cuentas. Verifica que el API esté activo.</p>
        </div>
      )}

      {accounts && accounts.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin cuentas conectadas</CardTitle>
            <CardDescription>
              Conecta tu primera cuenta de Meta Ads para ver métricas y gestionar campañas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/meta/connect">
                <Plus className="w-4 h-4 mr-2" />
                Conectar cuenta de Meta
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
