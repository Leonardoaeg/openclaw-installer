"use client";

import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Link2,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubscriptionInfo } from "@/lib/subscription";
import { createPortfolio, deletePortfolio } from "@/app/actions/portfolios";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Portfolio = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
  accountsCount: number;
  adAccountName: string | null;
  campaigns: number | null;
  spendCOP: string | null;
  roas: number | null;
  trend: "up" | "down" | null;
  lastSync: string | null;
};

function SyncButton({ portfolioId, getToken, onDone }: { portfolioId: string; getToken: () => Promise<string>; onDone: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/metrics/sync-portfolio/${portfolioId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch { throw new Error(text.slice(0, 120) || "Error del servidor"); }
      if (!res.ok) throw new Error((data.detail as string) ?? "Error");
      setMsg(`✓ ${data.synced_campaigns} campañas`);
      onDone();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSync} disabled={syncing}>
        <Loader2 className={`w-3 h-3 ${syncing ? "animate-spin" : "hidden"}`} />
        {syncing ? "Sync..." : "Sincronizar"}
      </Button>
      {msg && <span className="text-xs text-emerald-500">{msg}</span>}
    </div>
  );
}

const PALETTE = [
  "#6366f1", "#a855f7", "#10b981", "#f59e0b",
  "#ef4444", "#3b82f6", "#ec4899", "#14b8a6",
];

export function PortfoliosClient({
  portfolios,
  subscription,
  isDemo,
}: {
  portfolios: Portfolio[];
  subscription: SubscriptionInfo;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [availablePortfolios, setAvailablePortfolios] = useState<{id: string; name: string; accounts: string[]}[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [slotsAvailable, setSlotsAvailable] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getToken = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const handleOpenImport = async () => {
    setLoadingAvailable(true);
    setSyncMsg("");
    setShowImportModal(true);
    setSelectedIds(new Set());
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/meta/accounts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      // Convert meta accounts to portfolio format
      const portfolios = (data as {id: string; name: string; meta_ad_account_id: string}[]).map(acc => ({
        id: `acc_${acc.id}`,
        name: acc.name,
        accounts: [acc.id],
        meta_ad_account_id: acc.meta_ad_account_id,
      }));
      setAvailablePortfolios(portfolios);
      setImportErrors([]);
      // Calculate slots
      const maxPf = subscription.maxPortfolios;
      const existing = portfolios_count;
      setSlotsAvailable(maxPf === null ? null : Math.max(0, maxPf - existing));
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : "Error al cargar cuentas");
      setShowImportModal(false);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleConfirmImport = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/meta/sync-portfolios`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ selected_ids: Array.from(selectedIds) }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      let msg = `${data.created} creados, ${data.updated} actualizados`;
      if (data.limit_reached) msg += ` · Límite del plan alcanzado (${data.skipped} omitidos)`;
      setSyncMsg(msg);
      setShowImportModal(false);
      router.refresh();
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (slotsAvailable !== null && next.size >= slotsAvailable) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const maxPf = subscription.maxPortfolios ?? Infinity;
  const atLimit = !isDemo && portfolios.length >= maxPf;
  const portfolios_count = portfolios.length;

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      await deletePortfolio(id);
      setConfirmId(null);
      setDeletingId(null);
      router.refresh();
    });
  };

  const handleCreate = () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setError("");
    startTransition(async () => {
      const res = await createPortfolio(name.trim(), description.trim() || undefined);
      if (res && "error" in res) {
        setError(res.error ?? "Error al crear portafolio");
        return;
      }
      setShowModal(false);
      setName("");
      setDescription("");
      setColor(PALETTE[0]);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portafolios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isDemo ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Modo demo · datos de ejemplo
              </span>
            ) : (
              `${portfolios.length} de ${subscription.maxPortfolios === null ? "∞" : subscription.maxPortfolios} portafolios · Plan ${subscription.planName}`
            )}
          </p>
        </div>

        {!isDemo && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenImport}
              disabled={syncing || loadingAvailable}
              variant="outline"
              className="gap-2"
            >
              <Link2 className={`w-4 h-4 ${loadingAvailable ? "animate-spin" : ""}`} />
              {loadingAvailable ? "Cargando..." : "Elegir cuenta Meta"}
            </Button>
            {atLimit ? (
              <Button asChild className="gap-2 bg-amber-600 hover:bg-amber-500 text-white">
                <Link href="/dashboard/billing">
                  <Lock className="w-4 h-4" />
                  Ampliar plan
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => setShowModal(true)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30"
              >
                <Plus className="w-4 h-4" />
                Nuevo portafolio
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sync result */}
      {syncMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-sm text-emerald-300">
          {syncMsg}
        </div>
      )}

      {/* Limit notice */}
      {atLimit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-300">Límite de portafolios alcanzado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tu plan <strong>{subscription.planName}</strong> permite {subscription.maxPortfolios} portafolio(s).
              Actualiza al plan Business para gestionar hasta 5.
            </p>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shrink-0">
            <Link href="/dashboard/billing">Actualizar</Link>
          </Button>
        </div>
      )}

      {/* Empty state */}
      {portfolios.length === 0 && !isDemo && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-900/20">
              <Briefcase className="w-9 h-9 text-indigo-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">Crea tu primer portafolio</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
            Agrupa tus cuentas de Meta Ads en portafolios para monitorear
            campañas, métricas y presupuestos en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Button
              onClick={() => setShowModal(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-11 shadow-lg shadow-indigo-900/30"
            >
              <Plus className="w-4 h-4" />
              Crear portafolio
            </Button>
            <Button asChild variant="outline" className="gap-2 h-11">
              <Link href="/dashboard/meta">
                <Link2 className="w-4 h-4" />
                Conectar Meta Ads
              </Link>
            </Button>
          </div>

          {/* Feature hints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
            {[
              { icon: BarChart3, label: "Métricas en tiempo real", color: "text-indigo-400" },
              { icon: Sparkles, label: "Agente IA incluido", color: "text-purple-400" },
              { icon: CheckCircle2, label: "Alertas automáticas", color: "text-emerald-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Icon className={cn("w-4 h-4 shrink-0", color)} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio grid */}
      {portfolios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {portfolios.map((pf) => (
            <Card
              key={pf.id}
              className="hover:border-indigo-500/40 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-xl"
              style={{ borderColor: `${pf.color}25` }}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${pf.color}20`, border: `1px solid ${pf.color}40` }}
                    >
                      <Briefcase className="w-5 h-5" style={{ color: pf.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{pf.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {pf.adAccountName ?? pf.description ?? "Sin cuenta conectada"}
                      </p>
                    </div>
                  </div>
                  {!isDemo && (
                    confirmId === pf.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(pf.id)}
                          disabled={deletingId === pf.id}
                          className="text-xs text-destructive hover:text-destructive/80 font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                        >
                          {deletingId === pf.id ? "..." : "Eliminar"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="p-1 rounded hover:bg-accent"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(pf.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )
                  )}
                </div>

                {/* Stats — solo si hay métricas (demo o futuro real) */}
                {pf.roas !== null ? (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{pf.campaigns}</p>
                      <p className="text-xs text-muted-foreground">Campañas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{pf.spendCOP}</p>
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
                ) : (
                  <div className="mb-4 rounded-lg border border-dashed border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {pf.accountsCount > 0
                        ? `${pf.accountsCount} cuenta(s) conectada(s)`
                        : "Sin cuentas Meta conectadas"}
                    </p>
                  </div>
                )}

                <div
                  className="h-px mb-4"
                  style={{ background: `linear-gradient(90deg, transparent, ${pf.color}30, transparent)` }}
                />

                <div className="flex items-center justify-between">
                  {pf.lastSync ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Sync {pf.lastSync}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                      <span className="text-xs text-muted-foreground">Pendiente de sincronizar</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <SyncButton portfolioId={pf.id} getToken={getToken} onDone={() => router.refresh()} />
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Link href={`/dashboard/metrics`}>
                        <BarChart3 className="w-3.5 h-3.5" />
                        Ver métricas
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new card */}
          {!isDemo && !atLimit && (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl border-2 border-dashed border-border hover:border-indigo-500/50 p-5 flex flex-col items-center justify-center min-h-[200px] transition-all duration-200 hover:bg-indigo-950/10 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Nuevo portafolio
              </p>
            </button>
          )}

          {/* Upgrade card */}
          {!isDemo && atLimit && (
            <Link href="/dashboard/billing">
              <div className="rounded-2xl border border-dashed border-amber-500/30 p-5 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:bg-amber-950/10 transition-colors">
                <Lock className="w-8 h-8 text-amber-400/50 mb-2" />
                <p className="text-sm font-medium text-amber-300/70">Desbloquear más</p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Actualiza para agregar más portafolios
                </p>
                <Badge variant="outline" className="mt-3 text-amber-400 border-amber-500/30 text-xs">
                  Plan Business o superior
                </Badge>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Modal elegir cuenta Meta */}
      {showImportModal && (
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)"}} onClick={() => setShowImportModal(false)} />
          <div style={{position:"relative",width:"100%",maxWidth:"440px",background:"#ffffff",borderRadius:"16px",padding:"24px",boxShadow:"0 25px 50px rgba(0,0,0,0.4)"}}>
            <button onClick={() => setShowImportModal(false)} style={{position:"absolute",top:"12px",right:"12px",background:"none",border:"none",cursor:"pointer",fontSize:"18px",color:"#666"}}>✕</button>

            <h2 style={{fontSize:"16px",fontWeight:700,color:"#111",marginBottom:"4px"}}>Cuentas Meta conectadas</h2>
            <p style={{fontSize:"12px",color:"#666",marginBottom:"16px"}}>
              {slotsAvailable !== null ? `Puedes crear hasta ${slotsAvailable} portafolio(s) más` : "Selecciona las cuentas"}
            </p>

            {loadingAvailable ? (
              <div style={{textAlign:"center",padding:"32px",color:"#666",fontSize:"14px"}}>Cargando cuentas...</div>
            ) : availablePortfolios.length === 0 ? (
              <div style={{textAlign:"center",padding:"32px",color:"#666",fontSize:"14px"}}>No hay cuentas Meta conectadas.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"8px",maxHeight:"280px",overflowY:"auto",marginBottom:"16px"}}>
                {availablePortfolios.map((pf) => {
                  const isSelected = selectedIds.has(pf.id);
                  const atSlotLimit = slotsAvailable !== null && selectedIds.size >= slotsAvailable && !isSelected;
                  return (
                    <button
                      key={pf.id}
                      onClick={() => toggleSelect(pf.id)}
                      disabled={atSlotLimit}
                      style={{
                        display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"12px",borderRadius:"10px",border:`2px solid ${isSelected ? "#1877F2" : "#e5e7eb"}`,
                        background: isSelected ? "#eff6ff" : "#fff",
                        cursor: atSlotLimit ? "not-allowed" : "pointer",
                        opacity: atSlotLimit ? 0.4 : 1,
                        textAlign:"left",width:"100%",
                      }}
                    >
                      <div>
                        <p style={{fontSize:"14px",fontWeight:600,color:"#111",margin:0}}>{pf.name}</p>
                        <p style={{fontSize:"11px",color:"#888",margin:0,fontFamily:"monospace"}}>{(pf as {meta_ad_account_id?: string}).meta_ad_account_id ?? ""}</p>
                      </div>
                      {isSelected && <span style={{color:"#1877F2",fontSize:"18px"}}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={() => setShowImportModal(false)} style={{flex:1,padding:"10px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:"14px",color:"#333"}}>
                Cancelar
              </button>
              <button
                disabled={selectedIds.size === 0 || syncing}
                onClick={handleConfirmImport}
                style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",background: selectedIds.size === 0 ? "#93c5fd" : "#1877F2",color:"#fff",cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",fontSize:"14px",fontWeight:600}}
              >
                {syncing ? "Creando..." : `Crear portafolio${selectedIds.size > 1 ? "s" : ""} (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo portafolio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}
              >
                <Briefcase className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h2 className="font-bold text-base">Nuevo portafolio</h2>
                <p className="text-xs text-muted-foreground">Agrupa tus cuentas de Meta Ads</p>
              </div>
            </div>

            <div className="h-px bg-white/[.06]" />

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Nombre del portafolio *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: E-Commerce Principal"
                  className="bg-white/[.05] border-white/[.10] text-white placeholder:text-slate-600 focus:border-indigo-500"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Descripción <span className="text-slate-500">(opcional)</span></Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Campañas de ventas Q2"
                  className="bg-white/[.05] border-white/[.10] text-white placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-lg transition-all",
                        color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0d1117] scale-110" : "hover:scale-110"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 border-white/10 hover:bg-white/5"
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isPending || !name.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear portafolio
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
