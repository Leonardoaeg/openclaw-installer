import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth de Meta.
 * Meta redirige aquí con ?code=XXX tras la autorización.
 * Pasamos el code a FastAPI para que complete el intercambio de tokens.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard/meta?error=${error ?? "cancelled"}`, request.url)
    );
  }

  // Redirigir al frontend con el code para que el usuario elija la cuenta a conectar
  // (en una implementación real, aquí se haría el POST a FastAPI)
  return NextResponse.redirect(
    new URL(`/dashboard/meta/connect?code=${code}`, request.url)
  );
}
