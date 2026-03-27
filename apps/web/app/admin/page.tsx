import { BarChart3, Bot, CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getAdminStats() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("admin_get_stats");
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getRecentUsers() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenant_members")
      .select(`
        user_id,
        role,
        created_at,
        tenants (
          name,
          subscriptions ( status, trial_ends_at, plans ( name ) )
        )
      `)
      .eq("role", "owner")
      .order("created_at", { ascending: false })
      .limit(5);
    return data ?? [];
  } catch {
    return [];
  }
}

const QUICK_ACTIONS = [
  { href: "/admin/users", label: "Gestionar usuarios", desc: "Ver, editar y administrar cuentas de clientes", icon: Users },
  { href: "/admin/metrics", label: "Configurar métricas", desc: "Define los KPIs y umbrales predeterminados del asistente", icon: BarChart3 },
  { href: "/admin/assistant", label: "Asistente IA", desc: "Configura parámetros, contexto y comportamiento del agente", icon: Bot },
  { href: "/admin/plans", label: "Gestionar planes", desc: "Edita precios, features y límites de cada plan", icon: CreditCard },
];

export default async function AdminPage() {
  const [stats, recentUsers] = await Promise.all([getAdminStats(), getRecentUsers()]);

  const STATS_CONFIG = [
    {
      label: "Usuarios totales",
      value: stats?.total_users?.toString() ?? "—",
      change: "",
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-950/40 border-indigo-500/30",
    },
    {
      label: "En trial activo",
      value: stats?.trial_users?.toString() ?? "—",
      change: "",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-500/30",
    },
    {
      label: "Suscripciones activas",
      value: stats?.active_paid?.toString() ?? "—",
      change: stats?.mrr ? `$${Number(stats.mrr).toFixed(0)} MRR` : "",
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-500/30",
    },
    {
      label: "Portafolios totales",
      value: stats?.total_portfolios?.toString() ?? "—",
      change: "",
      icon: BarChart3,
      color: "text-purple-400",
      bg: "bg-purple-950/40 border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground text-sm mt-1">Visión general de la plataforma AgenteFlow.</p>
        </div>
        {stats?.mrr && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">
              ${Number(stats.mrr).toFixed(0)}/mes MRR
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CONFIG.map((s) => (
          <Card key={s.label} className={`border ${s.bg}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-3xl font-extrabold">{s.value}</p>
              {s.change && <p className="text-xs text-muted-foreground mt-1">{s.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl border bg-card p-5 hover:border-indigo-500/40 hover:bg-indigo-950/10 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:border-indigo-400/40 transition-colors">
                <a.icon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Usuarios recientes</CardTitle>
            <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300">
              Ver todos →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay usuarios aún. Los datos reales aparecerán aquí tras conectar Supabase.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left pb-2 font-medium">Tenant</th>
                    <th className="text-left pb-2 font-medium">Plan</th>
                    <th className="text-left pb-2 font-medium">Estado</th>
                    <th className="text-left pb-2 font-medium">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u: any, i: number) => {
                    const tenant = u.tenants as any;
                    const sub = tenant?.subscriptions?.[0];
                    const planName = sub?.plans?.name ?? "Trial";
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{tenant?.name ?? u.user_id}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">{planName}</Badge>
                        </td>
                        <td className="py-3">
                          {sub?.status === "active" && (
                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">Activo</Badge>
                          )}
                          {sub?.status === "trialing" && (
                            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">Trial</Badge>
                          )}
                          {sub?.status === "past_due" && (
                            <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 text-xs">Pago pendiente</Badge>
                          )}
                          {sub?.status === "cancelled" && (
                            <Badge variant="outline" className="text-slate-400 border-slate-500/30 text-xs">Cancelado</Badge>
                          )}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("es-ES")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
