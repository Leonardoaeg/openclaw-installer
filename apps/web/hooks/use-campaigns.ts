import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Campaign } from "@/types/meta";

interface CampaignsFilter {
  account_id?: string;
  status_filter?: string;
}

export function useCampaigns(filters: CampaignsFilter = {}) {
  const params = new URLSearchParams();
  if (filters.account_id) params.set("account_id", filters.account_id);
  if (filters.status_filter) params.set("status_filter", filters.status_filter);
  const qs = params.toString() ? `?${params}` : "";

  return useQuery({
    queryKey: ["campaigns", filters],
    queryFn: () => api.get<Campaign[]>(`/v1/campaigns${qs}`),
  });
}

export function useToggleCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      status,
    }: {
      campaignId: string;
      status: "ACTIVE" | "PAUSED";
    }) => api.patch<Campaign>(`/v1/campaigns/${campaignId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}
