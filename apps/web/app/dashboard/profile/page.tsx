"use client";

import { Camera, CheckCircle2, Facebook, Key, Link2, Mail, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const CONNECTED_ACCOUNTS = [
  {
    id: "meta",
    name: "Meta Business",
    icon: Facebook,
    color: "text-blue-400",
    bg: "bg-blue-950/40 border-blue-500/30",
    connected: true,
    detail: "cuenta@empresa.com · ID: 123456789",
  },
  {
    id: "google",
    name: "Google",
    icon: Mail,
    color: "text-red-400",
    bg: "bg-red-950/40 border-red-500/30",
    connected: true,
    detail: "usuario@gmail.com",
  },
];

export default function ProfilePage() {
  const [name, setName] = useState("Carlos Martínez");
  const [email] = useState("carlos@empresa.com");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu información personal y cuentas conectadas.
        </p>
      </div>

      {/* Avatar + info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {name[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border flex items-center justify-center hover:bg-accent transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-950/20 text-xs mt-1">
                Trial · 11 días restantes
              </Badge>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="text-sm opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-sm">Empresa / Organización</Label>
              <Input id="company" placeholder="Mi empresa S.A." className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">Teléfono (opcional)</Label>
              <Input id="phone" type="tel" placeholder="+1 234 567 890" className="text-sm" />
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardado
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Connected accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Cuentas conectadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONNECTED_ACCOUNTS.map((acc) => (
            <div
              key={acc.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${acc.bg}`}
            >
              <div className="flex items-center gap-3">
                <acc.icon className={`w-5 h-5 ${acc.color}`} />
                <div>
                  <p className="text-sm font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">{acc.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Conectado</span>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive">
                  Desconectar
                </Button>
              </div>
            </div>
          ))}

          <div className="border border-dashed rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Conecta más cuentas publicitarias</p>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Link2 className="w-3.5 h-3.5" />
              Conectar cuenta Meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contraseña</p>
              <p className="text-xs text-muted-foreground">Última actualización hace 30 días</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Key className="w-3.5 h-3.5" />
              Cambiar contraseña
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm font-medium">Autenticación de dos factores</p>
              <p className="text-xs text-muted-foreground">Protege tu cuenta con 2FA</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              Activar 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
