"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Users,
  Save,
  Check,
  LogOut,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Globe,
  Crown,
  Bot,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Section = "perfil" | "organizacion" | "agente" | "notificaciones" | "seguridad" | "equipo" | "plan";

// ─── Datos mock ───────────────────────────────────────────────────────────────

const MOCK_MEMBERS = [
  { id: "m1", name: "Carlos Rodríguez", email: "carlos@empresa.com", role: "owner",  avatar: "CR", joined: "Ene 2025" },
  { id: "m2", name: "Ana González",     email: "ana@empresa.com",    role: "admin",  avatar: "AG", joined: "Feb 2025" },
  { id: "m3", name: "Luis Martínez",    email: "luis@empresa.com",   role: "member", avatar: "LM", joined: "Mar 2025" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  owner:  { label: "Propietario", color: "text-amber-500",  bg: "bg-amber-500/10"  },
  admin:  { label: "Admin",       color: "text-blue-500",   bg: "bg-blue-500/10"   },
  member: { label: "Miembro",     color: "text-slate-500",  bg: "bg-slate-500/10"  },
  viewer: { label: "Lector",      color: "text-slate-400",  bg: "bg-slate-500/10"  },
};

// ─── Nav lateral ─────────────────────────────────────────────────────────────

const NAV: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "perfil",         label: "Perfil",            icon: User      },
  { key: "organizacion",   label: "Organización",      icon: Building2 },
  { key: "agente",         label: "Agente IA",         icon: Bot       },
  { key: "notificaciones", label: "Notificaciones",    icon: Bell      },
  { key: "seguridad",      label: "Seguridad",         icon: Shield    },
  { key: "equipo",         label: "Equipo",            icon: Users     },
  { key: "plan",           label: "Plan & Facturación",icon: CreditCard},
];

// ─── Helper components ────────────────────────────────────────────────────────

function Field({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-4 border-b last:border-0">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn(
        "block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0.5",
      )} />
    </button>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <Button onClick={onClick} className="mt-4 gap-2">
      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? "Guardado" : "Guardar cambios"}
    </Button>
  );
}

// ─── Secciones ────────────────────────────────────────────────────────────────

function PerfilSection() {
  const [name,  setName]  = useState("Carlos Rodríguez");
  const [email, setEmail] = useState("carlos@empresa.com");
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Perfil personal</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Información de tu cuenta de usuario.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-2xl border border-border/60">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          CR
        </div>
        <div>
          <p className="font-medium">{name || "Tu nombre"}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <button className="text-xs text-primary hover:underline mt-1">Cambiar foto</button>
        </div>
      </div>

      <Field label="Nombre completo">
        <TextInput value={name} onChange={setName} placeholder="Tu nombre" />
      </Field>
      <Field label="Correo electrónico" description="Usado para iniciar sesión y notificaciones.">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full text-sm border border-border rounded-xl pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Field>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

function OrganizacionSection() {
  const [orgName, setOrgName] = useState("Mi Empresa S.A.");
  const [website, setWebsite] = useState("https://miempresa.com");
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Organización</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Datos de tu empresa o agencia.</p>
      </div>

      <Field label="Nombre de la organización">
        <TextInput value={orgName} onChange={setOrgName} placeholder="Mi Empresa" />
      </Field>
      <Field label="Sitio web">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            className="w-full text-sm border border-border rounded-xl pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Field>
      <Field label="País" description="País de operación de tu organización.">
        <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="MX">🇲🇽 México</option>
          <option value="CO">🇨🇴 Colombia</option>
          <option value="AR">🇦🇷 Argentina</option>
          <option value="CL">🇨🇱 Chile</option>
          <option value="PE">🇵🇪 Perú</option>
          <option value="ES">🇪🇸 España</option>
          <option value="US">🇺🇸 Estados Unidos</option>
          <option value="BR">🇧🇷 Brasil</option>
          <option value="VE">🇻🇪 Venezuela</option>
          <option value="EC">🇪🇨 Ecuador</option>
          <option value="UY">🇺🇾 Uruguay</option>
          <option value="PY">🇵🇾 Paraguay</option>
          <option value="BO">🇧🇴 Bolivia</option>
          <option value="CR">🇨🇷 Costa Rica</option>
          <option value="PA">🇵🇦 Panamá</option>
          <option value="GT">🇬🇹 Guatemala</option>
          <option value="DO">🇩🇴 República Dominicana</option>
        </select>
      </Field>
      <Field label="Idioma" description="Idioma de la interfaz.">
        <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="es">🌐 Español</option>
          <option value="en">🌐 English</option>
          <option value="pt">🌐 Português</option>
        </select>
      </Field>
      <Field label="Zona horaria" description="Usada para reportes y alertas.">
        <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option>América/México_Ciudad (GMT-6)</option>
          <option>América/Bogota (GMT-5)</option>
          <option>América/Santiago (GMT-4)</option>
          <option>América/Buenos_Aires (GMT-3)</option>
          <option>América/Lima (GMT-5)</option>
          <option>América/Caracas (GMT-4)</option>
          <option>Europa/Madrid (GMT+1)</option>
          <option>América/New_York (GMT-5)</option>
        </select>
      </Field>
      <Field label="Moneda" description="Moneda para reportes de gasto en dashboards.">
        <select className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="USD">💵 USD — Dólar estadounidense</option>
          <option value="MXN">🇲🇽 MXN — Peso mexicano</option>
          <option value="COP">🇨🇴 COP — Peso colombiano</option>
          <option value="ARS">🇦🇷 ARS — Peso argentino</option>
          <option value="CLP">🇨🇱 CLP — Peso chileno</option>
          <option value="PEN">🇵🇪 PEN — Sol peruano</option>
          <option value="EUR">🇪🇺 EUR — Euro</option>
          <option value="BRL">🇧🇷 BRL — Real brasileño</option>
          <option value="CRC">🇨🇷 CRC — Colón costarricense</option>
          <option value="VES">🇻🇪 VES — Bolívar venezolano</option>
        </select>
      </Field>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

function NotificacionesSection() {
  const [prefs, setPrefs] = useState({
    alertEmail:    true,
    alertPush:     false,
    reportWeekly:  true,
    reportMonthly: true,
    aiSuggestions: true,
    billing:       true,
  });

  const [saved, setSaved] = useState(false);
  const toggle = (key: keyof typeof prefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const rows = [
    { key: "alertEmail"    as const, label: "Alertas por email",           desc: "Recibe alertas de tus reglas por correo."         },
    { key: "alertPush"     as const, label: "Notificaciones push",          desc: "Alertas en tiempo real en el navegador."          },
    { key: "reportWeekly"  as const, label: "Reporte semanal",              desc: "Resumen de rendimiento cada lunes."               },
    { key: "reportMonthly" as const, label: "Reporte mensual",              desc: "Análisis completo a fin de mes."                  },
    { key: "aiSuggestions" as const, label: "Sugerencias del agente IA",    desc: "El agente te avisa cuando detecta oportunidades." },
    { key: "billing"       as const, label: "Avisos de facturación",        desc: "Confirmaciones de pago y renovaciones."           },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Notificaciones</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Controla qué comunicaciones recibes.</p>
      </div>

      {rows.map(row => (
        <Field key={row.key} label={row.label} description={row.desc}>
          <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} />
        </Field>
      ))}

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

function SeguridadSection() {
  const [showKey, setShowKey] = useState(false);
  const apiKey = "af_sk_live_••••••••••••••••••••••••32f9";
  const apiKeyReal = "af_sk_live_8f2a9c1e4b7d0e3f6a5b2c8d1e4f7a0b32f9";
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKeyReal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Seguridad</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Contraseña, sesiones y API keys.</p>
      </div>

      <Field label="Contraseña" description="Última actualización hace 30 días.">
        <Button variant="outline" size="sm">Cambiar contraseña</Button>
      </Field>

      <Field label="API Key" description="Usa esta clave para integrar AgenteFlow con otras herramientas.">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
            <code className="text-xs flex-1 font-mono">
              {showKey ? apiKeyReal : apiKey}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Nunca compartas tu API key. Genera una nueva si sospechas que fue comprometida.
        </p>
      </Field>

      <Field label="Sesión activa">
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </Field>

      <div className="mt-6 p-4 rounded-2xl border border-destructive/20 bg-destructive/5">
        <p className="text-sm font-semibold text-destructive">Zona de peligro</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Estas acciones son irreversibles. Procede con cuidado.
        </p>
        <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="w-4 h-4" />
          Eliminar cuenta
        </Button>
      </div>
    </div>
  );
}

function EquipoSection() {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sent, setSent] = useState(false);

  const handleInvite = () => {
    if (!inviteEmail) return;
    setSent(true);
    setTimeout(() => { setSent(false); setInviteEmail(""); }, 2000);
  };

  const handleRemove = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Equipo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Invita colaboradores y gestiona sus permisos.</p>
      </div>

      {/* Miembros */}
      <Card className="mb-4">
        <CardContent className="p-0 divide-y">
          {members.map(m => {
            const roleCfg = ROLE_CONFIG[m.role];
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", roleCfg.bg, roleCfg.color)}>
                    {roleCfg.label}
                  </span>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invitar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Invitar miembro</CardTitle>
          <CardDescription className="text-xs">Recibirán un email para unirse al equipo.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="w-full text-sm border border-border rounded-xl pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="admin">Admin</option>
              <option value="member">Miembro</option>
              <option value="viewer">Lector</option>
            </select>
          </div>
          <Button onClick={handleInvite} disabled={!inviteEmail} className="mt-3 gap-2" size="sm">
            {sent ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {sent ? "Invitación enviada" : "Enviar invitación"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Plan & Facturación</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu suscripción y métodos de pago.</p>
      </div>

      {/* Plan actual */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <p className="font-bold text-lg">Plan Pro</p>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">$99 USD / mes · Próximo cobro: 1 Abr 2026</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Activo</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Cuentas Meta",   value: "5 de 10" },
            { label: "Miembros",       value: "3 de 5"  },
            { label: "Alertas",        value: "4 de 20" },
          ].map(s => (
            <div key={s.label} className="bg-background/50 rounded-xl p-3">
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Field label="Método de pago" description="Visa •••• 4242 · Vence 12/27">
        <Button variant="outline" size="sm">Actualizar tarjeta</Button>
      </Field>

      <Field label="Historial de pagos">
        <div className="space-y-2">
          {[
            { date: "1 Mar 2026", amount: "$99.00", status: "Pagado" },
            { date: "1 Feb 2026", amount: "$99.00", status: "Pagado" },
            { date: "1 Ene 2026", amount: "$99.00", status: "Pagado" },
          ].map(inv => (
            <div key={inv.date} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{inv.date}</p>
                <p className="text-xs text-muted-foreground">{inv.amount}</p>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                {inv.status}
              </Badge>
            </div>
          ))}
        </div>
      </Field>

      <div className="mt-6 pt-4 border-t">
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2" size="sm">
          <Trash2 className="w-4 h-4" />
          Cancelar suscripción
        </Button>
      </div>
    </div>
  );
}

// ─── Sección Agente IA ────────────────────────────────────────────────────────

const INDUSTRIES = [
  { value: "ecommerce",      label: "E-commerce / Tienda online"      },
  { value: "lead_gen",       label: "Generación de leads"             },
  { value: "saas",           label: "SaaS / Software"                 },
  { value: "local_business", label: "Negocio local / Servicios"       },
  { value: "real_estate",    label: "Bienes raíces"                   },
  { value: "education",      label: "Educación / Cursos"              },
  { value: "general",        label: "General / Otro"                  },
];

const TONES = [
  { value: "direct",       label: "Directo — recomendaciones cortas y concretas" },
  { value: "professional", label: "Profesional — análisis detallados con contexto" },
  { value: "casual",       label: "Casual — explicaciones simples y amigables"   },
];

function AgenteSection() {
  const [industry,   setIndustry]   = useState("ecommerce");
  const [targetRoas, setTargetRoas] = useState("3.0");
  const [maxCpc,     setMaxCpc]     = useState("0.80");
  const [budgetPct,  setBudgetPct]  = useState("85");
  const [tone,       setTone]       = useState("direct");
  const [proactive,  setProactive]  = useState(true);
  const [saved,      setSaved]      = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Configurar Agente IA</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Define el perfil de tu negocio para que el agente calibre sus diagnósticos y recomendaciones.
        </p>
      </div>

      {/* Perfil del negocio */}
      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-6">
        <p className="text-xs font-semibold text-indigo-400 mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          Perfil del negocio
        </p>
        <Field label="Industria" description="Ajusta los benchmarks de CTR, CPC y ROAS a tu sector.">
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {INDUSTRIES.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Objetivos de KPIs */}
      <div className="space-y-0 mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Objetivos de KPIs</p>
        <Field label="ROAS objetivo" description="El agente alertará cuando el ROAS baje de este valor.">
          <div className="relative w-40">
            <input
              type="number"
              step="0.1"
              min="0"
              value={targetRoas}
              onChange={e => setTargetRoas(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 pr-7 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">x</span>
          </div>
        </Field>
        <Field label="CPC máximo aceptable" description="Se genera alerta cuando el CPC supera este límite.">
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maxCpc}
              onChange={e => setMaxCpc(e.target.value)}
              className="w-full text-sm border border-border rounded-xl pl-6 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </Field>
        <Field label="Alerta de presupuesto" description="Notificar cuando se haya gastado este % del presupuesto diario.">
          <div className="relative w-40">
            <input
              type="number"
              step="5"
              min="50"
              max="100"
              value={budgetPct}
              onChange={e => setBudgetPct(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 pr-7 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
        </Field>
      </div>

      {/* Personalidad del agente */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Personalidad del agente</p>
        <Field label="Tono de comunicación">
          <div className="space-y-2">
            {TONES.map(t => (
              <label key={t.value} className={cn(
                "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                tone === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}>
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={() => setTone(t.value)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Análisis proactivo" description="El agente detecta problemas y los reporta sin que preguntes.">
          <Toggle checked={proactive} onChange={setProactive} />
        </Field>
      </div>

      <SaveButton onClick={save} saved={saved} />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const SECTIONS: Record<Section, React.ComponentType> = {
  perfil:         PerfilSection,
  organizacion:   OrganizacionSection,
  agente:         AgenteSection,
  notificaciones: NotificacionesSection,
  seguridad:      SeguridadSection,
  equipo:         EquipoSection,
  plan:           PlanSection,
};

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("perfil");
  const ActiveSection = SECTIONS[section];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Gestiona tu cuenta, equipo y preferencias.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Nav lateral */}
        <nav className="md:w-48 flex-shrink-0">
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap w-full text-left",
                  section === key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenido */}
        <Card className="flex-1 min-w-0">
          <CardContent className="p-6">
            <ActiveSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
