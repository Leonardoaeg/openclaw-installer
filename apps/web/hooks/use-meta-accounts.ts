import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { MetaAccount } from "@/types/meta";

export function useMetaAccounts() {
  return useQuery({
    queryKey: ["meta-accounts"],
    queryFn: () => api.get<MetaAccount[]>("/v1/meta/accounts"),
  });
}

export function useConnectMetaAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; ad_account_id: string }) =>
      api.post<MetaAccount>("/v1/meta/connect", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meta-accounts"] }),
  });
}

export function useDisconnectMetaAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.delete(`/v1/meta/accounts/${accountId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta-accounts"] });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSyncMetaAccount() {
  return useMutation({
    mutationFn: (accountId: string) =>
      api.post(`/v1/meta/accounts/${accountId}/sync`),
  });
}
