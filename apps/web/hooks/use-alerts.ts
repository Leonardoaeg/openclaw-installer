import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  status: "active" | "paused";
  campaign_id: string | null;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

interface AlertEvent {
  id: string;
  rule_id: string;
  metric: string;
  value: number;
  threshold: number;
  operator: string;
  severity: "warning" | "critical" | "ok";
  campaign_name: string;
  fired_at: string;
  ai_analysis: string | null;
}

interface AlertsData {
  rules: AlertRule[];
  events: AlertEvent[];
}

async function fetchAlerts(): Promise<AlertsData> {
  const res = await fetch("/api/trafiker/alerts");
  if (!res.ok) throw new Error("Error cargando alertas");
  return res.json();
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AlertRule, "id" | "trigger_count" | "last_triggered_at" | "created_at" | "status">) =>
      fetch("/api/trafiker/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useToggleAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      fetch(`/api/trafiker/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["alerts"] });
      qc.setQueryData<AlertsData>(["alerts"], old => old ? {
        ...old,
        rules: old.rules.map(r => r.id === id ? { ...r, status } : r),
      } : old);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/trafiker/alerts/${id}`, { method: "DELETE" }).then(r => r.json()),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["alerts"] });
      qc.setQueryData<AlertsData>(["alerts"], old => old ? {
        ...old,
        rules: old.rules.filter(r => r.id !== id),
      } : old);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useAnalyzeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      fetch(`/api/trafiker/alerts/events/${eventId}/analyze`, { method: "POST" })
        .then(r => r.json()) as Promise<{ analysis: string }>,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
