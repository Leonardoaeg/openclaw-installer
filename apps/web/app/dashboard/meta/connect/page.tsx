"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Facebook, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { useConnectMetaAccount } from "@/hooks/use-meta-accounts";

interface AdAccount {
  id: string;       // act_XXXXXXX
  name: string;
  currency: string;
}

// ── Paso 1: Botón de inicio OAuth ─────────────────────────────────────────────
function StartOAuth() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { url } = await api.get<{ url: string }>("/v1/meta/auth-url");
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          Meta Business
        </CardTitle>
        <CardDescription>
          Serás redirigido a Meta para autorizar el acceso. AgenteFlow podrá:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm space-y-2 text-muted-foreground">
          <li>✓ Ver métricas de tus campañas en tiempo real</li>
          <li>✓ Activar y pausar campañas</li>
          <li>✓ Leer información de cuentas publicitarias</li>
        </ul>
        <Button onClick={handleConnect} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirigiendo...</>
          ) : (
            "Conectar con Meta →"
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Puedes desconectar tu cuenta en cualquier momento desde Configuración.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Paso 2: Selección de cuenta publicitaria ──────────────────────────────────
function SelectAdAccount({ code }: { code: string }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const connect = useConnectMetaAccount();

  // Exchange code for short-lived token and fetch available ad accounts.
  // The access_token is kept in state so we don't reuse the one-time code.
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const data = await api.post<{ accounts: AdAccount[]; access_token: string }>(
          "/v1/meta/available-accounts",
          { code }
        );
        setAccounts(data.accounts);
        setAccessToken(data.access_token);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error obteniendo cuentas.");
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, [code]);

  const handleConfirm = async () => {
    if (!selected || !accessToken) return;
    try {
      await connect.mutateAsync({ access_token: accessToken, ad_account_id: selected });
      router.push("/dashboard/meta");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error conectando la cuenta.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Cargando tus cuentas de Meta...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/meta/connect")}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona la cuenta a conectar</CardTitle>
        <CardDescription>
          Encontramos {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} en tu Meta Business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => setSelected(acc.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
              selected === acc.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            }`}
          >
            <div>
              <p className="text-sm font-medium">{acc.name}</p>
              <p className="text-xs text-muted-foreground">{acc.id} · {acc.currency}</p>
            </div>
            {selected === acc.id && (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            )}
          </button>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full mt-2"
          disabled={!selected || connect.isPending}
          onClick={handleConfirm}
        >
          {connect.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando...</>
          ) : (
            "Confirmar conexión →"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function ConnectMetaPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conectar cuenta de Meta</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Autoriza a AgenteFlow a gestionar tus campañas de Facebook e Instagram Ads.
        </p>
      </div>

      {oauthError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            La autorización fue cancelada o falló. Intenta de nuevo.
          </p>
        </div>
      )}

      {code ? <SelectAdAccount code={code} /> : <StartOAuth />}
    </div>
  );
}
