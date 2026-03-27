import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("metrics_config")
    .select("*")
    .order("metric");

  if (error) {
    if (error.code === "42501") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const body: Array<{
    metric: string;
    label: string;
    condition: string;
    threshold: number;
    unit: string;
    severity: string;
    enabled: boolean;
  }> = await req.json();

  // Upsert todas las reglas
  const { error } = await supabase
    .from("metrics_config")
    .upsert(
      body.map((r) => ({
        metric:    r.metric,
        label:     r.label,
        condition: r.condition,
        threshold: r.threshold,
        unit:      r.unit,
        severity:  r.severity,
        enabled:   r.enabled,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "metric" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
