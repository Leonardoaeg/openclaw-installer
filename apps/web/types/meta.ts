export interface MetaAccount {
  id: string;
  meta_ad_account_id: string;
  name: string;
  currency: string;
  timezone: string;
  status: "active" | "expired" | "revoked";
  last_synced_at: string | null;
}

export interface Campaign {
  id: string;
  meta_account_id: string;
  meta_campaign_id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED";
  objective: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_time: string | null;
  stop_time: string | null;
}

export interface MetricsOverview {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  avg_ctr: number | null;
  avg_cpc: number | null;
  avg_roas: number | null;
  active_campaigns: number;
}

export interface DailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  conversions: number;
  initiate_checkout: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number | null;
}

export interface CampaignMetric {
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  roas: number | null;
}
