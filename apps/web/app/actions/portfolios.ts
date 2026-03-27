"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/subscription";
import { revalidatePath } from "next/cache";

export async function getPortfolios() {
  const supabase = await createClient();
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from("portfolios")
    .select(`
      id, name, description, color, is_default, created_at,
      portfolio_accounts (
        meta_account_id,
        meta_accounts ( name, meta_ad_account_id, status, last_synced_at )
      )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function createPortfolio(name: string, description?: string) {
  const supabase = await createClient();
  const tenantId = await getTenantId();
  if (!tenantId) return { error: "Sin tenant" };

  const { error } = await supabase.from("portfolios").insert({
    tenant_id: tenantId,
    name,
    description: description ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/portfolios");
  return { success: true };
}

export async function deletePortfolio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("portfolios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/portfolios");
  return { success: true };
}
