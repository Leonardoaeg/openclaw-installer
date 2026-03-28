import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRAFIKER = process.env.TRAFIKER_URL ?? "http://trafiker.railway.internal";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { eventId } = await params;
  const res = await fetch(`${TRAFIKER}/alerts/events/${eventId}/analyze`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
