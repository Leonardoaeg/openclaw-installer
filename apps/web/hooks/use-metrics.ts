import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api-client";
import type { CampaignMetric, DailyMetric, MetricsOverview } from "@/types/meta";

interface DateRange {
  from: Date;
  to: Date;
}

export function useMetricsOverview(range?: DateRange) {
  const params = new URLSearchParams();
  if (range) {
    params.set("from_date", format(range.from, "yyyy-MM-dd"));
    params.set("to_date", format(range.to, "yyyy-MM-dd"));
  }
  const qs = params.toString() ? `?${params}` : "";

  return useQuery({
    queryKey: ["metrics-overview", range],
    queryFn: () => api.get<MetricsOverview>(`/v1/metrics/overview${qs}`),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMetricsDaily(range?: DateRange) {
  const params = new URLSearchParams();
  if (range) {
    params.set("from_date", format(range.from, "yyyy-MM-dd"));
    params.set("to_date", format(range.to, "yyyy-MM-dd"));
  }
  const qs = params.toString() ? `?${params}` : "";

  return useQuery({
    queryKey: ["metrics-daily", range],
    queryFn: () => api.get<DailyMetric[]>(`/v1/metrics/daily${qs}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMetricsTimeseries(campaignId: string, range?: DateRange) {
  const params = new URLSearchParams({ campaign_id: campaignId });
  if (range) {
    params.set("from_date", format(range.from, "yyyy-MM-dd"));
    params.set("to_date", format(range.to, "yyyy-MM-dd"));
  }

  return useQuery({
    queryKey: ["metrics-timeseries", campaignId, range],
    queryFn: () =>
      api.get<CampaignMetric[]>(`/v1/metrics/timeseries?${params}`),
    enabled: !!campaignId,
  });
}
