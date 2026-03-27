import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
  meta_accounts_count?: number;
}

export function usePortfolios() {
  const [data, setData] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        // Get tenant_id first
        const { data: membership } = await supabase
          .from("tenant_members")
          .select("tenant_id")
          .limit(1)
          .single();

        if (!membership) {
          setData([]);
          return;
        }

        const { data: portfolios, error: pfError } = await supabase
          .from("portfolios")
          .select("id, name, description, color, is_default, created_at")
          .eq("tenant_id", membership.tenant_id)
          .order("created_at", { ascending: true });

        if (pfError) throw pfError;
        setData(portfolios ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading portfolios");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { data, isLoading, error };
}
