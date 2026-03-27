"use client";

import { useState } from "react";
import { MoreHorizontal, Search, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const USERS = [
  { id: "1", name: "María García", email: "maria@empresa.com", plan: "Trial", daysLeft: 8, portfolios: 1, joined: "2025-03-19", status: "trial" },
  { id: "2", name: "Luis Pérez", email: "luis@agencia.com", plan: "Business", daysLeft: null, portfolios: 3, joined: "2025-02-05", status: "active" },
  { id: "3", name: "Ana Torres", email: "ana@marca.com", plan: "Starter", daysLeft: null, portfolios: 1, joined: "2025-01-15", status: "active" },
  { id: "4", name: "Roberto Lima", email: "roberto@startup.io", plan: "Trial", daysLeft: 2, portfolios: 1, joined: "2025-03-25", status: "expiring" },
  { id: "5", name: "Carmen Vidal", email: "carmen@digital.com", plan: "Business Pro", daysLeft: null, portfolios: 7, joined: "2024-12-01", status: "active" },
  { id: "6", name: "Diego Ruiz", email: "diego@ads.com", plan: "Trial", daysLeft: 0, portfolios: 0, joined: "2025-03-10", status: "expired" },
];

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Activos", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Por vencer", value: "expiring" },
  { label: "Expirados", value: "expired" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">{USERS.length} usuarios registrados en la plataforma.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left pb-3 font-medium">Usuario</th>
                  <th className="text-left pb-3 font-medium">Plan</th>
                  <th className="text-left pb-3 font-medium">Estado</th>
                  <th className="text-left pb-3 font-medium">Portafolios</th>
                  <th className="text-left pb-3 font-medium">Registro</th>
                  <th className="text-right pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">{u.plan}</Badge>
                    </td>
                    <td className="py-3">
                      {u.status === "active" && (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">Activo</Badge>
                      )}
                      {u.status === "trial" && (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">Trial · {u.daysLeft}d</Badge>
                      )}
                      {u.status === "expiring" && (
                        <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 text-xs animate-pulse">Expira en {u.daysLeft}d</Badge>
                      )}
                      {u.status === "expired" && (
                        <Badge variant="outline" className="text-slate-400 border-slate-500/30 bg-slate-500/10 text-xs">Expirado</Badge>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono text-xs">{u.portfolios}</td>
                    <td className="py-3 text-xs text-muted-foreground">{u.joined}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-500" title="Activar">
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" title="Suspender">
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
