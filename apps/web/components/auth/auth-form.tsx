"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  mode: "login" | "signup";
}

const BULLETS = [
  "Conecta tus cuentas de Meta Ads en segundos",
  "Monitorea campañas con métricas en tiempo real",
  "Agente IA que gestiona y optimiza por ti",
  "Alertas automáticas antes de que el presupuesto se agote",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthForm({ mode }: Props) {
  const isLogin = mode === "login";
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
        } else {
          setSuccess("Revisa tu correo para confirmar tu cuenta.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  };

  return (
    <div className="min-h-screen bg-[#06101e] flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-950 to-[#06101e] border-r border-white/[.06] p-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold text-white tracking-tight">
            Agente<span className="text-indigo-400">Flow</span>
          </span>
        </Link>

        {/* Copy central */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Tus Meta Ads,<br />
              <span className="text-indigo-400">gestionados con IA.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
              La plataforma que conecta tu cuenta publicitaria con inteligencia artificial para que tomes mejores decisiones más rápido.
            </p>
          </div>

          <ul className="space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} AgenteFlow
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo mobile */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <Megaphone className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-bold text-white">
            Agente<span className="text-indigo-400">Flow</span>
          </span>
        </Link>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {isLogin
                ? "Ingresa a tu dashboard de AgenteFlow"
                : "Empieza a gestionar tus campañas con IA"}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/[.07] hover:bg-white/[.12] border border-white/[.10] text-white text-sm font-medium py-3 rounded-xl transition-all disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[.08]" />
            <span className="text-xs text-slate-500">o con tu correo</span>
            <div className="flex-1 h-px bg-white/[.08]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[.05] border-white/[.10] text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300 text-sm">
                  Contraseña
                </Label>
                {isLogin && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isLogin ? 1 : 8}
                  placeholder={isLogin ? "••••••••" : "Mínimo 8 caracteres"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[.05] border-white/[.10] text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                "Iniciar sesión"
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <Link
              href={isLogin ? "/auth/sign-up" : "/auth/login"}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isLogin ? "Regístrate gratis" : "Iniciar sesión"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
