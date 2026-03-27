"use client";

import { createContext, useContext } from "react";
import type { SubscriptionInfo } from "@/lib/subscription";

const SubscriptionContext = createContext<SubscriptionInfo | null>(null);

export function SubscriptionProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SubscriptionInfo;
}) {
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionInfo {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}
