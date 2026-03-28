import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRAFIKER = process.env.TRAFIKER_URL ?? "http://trafiker.railway.internal";

async function getTenantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user.id;
}

export async function GET() {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const res = await fetch(`${TRAFIKER}/alerts/${tenantId}`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${TRAFIKER}/alerts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, tenant_id: tenantId }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
