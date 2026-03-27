import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assistant_config")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    // RLS bloqueó → no es admin
    if (error.code === "PGRST116" || error.code === "42501") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { data: existing } = await supabase
    .from("assistant_config")
    .select("id")
    .limit(1)
    .single();

  if (!existing?.id) {
    return NextResponse.json({ error: "No autorizado o config no existe" }, { status: 403 });
  }

  const { error } = await supabase
    .from("assistant_config")
    .update({
      model:         body.model,
      persona:       body.persona,
      system_prompt: body.system_prompt,
      temperature:   body.temperature,
      max_tokens:    body.max_tokens,
      auto_rules:    body.auto_rules,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
