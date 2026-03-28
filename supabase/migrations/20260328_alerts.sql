-- Reglas de alertas por tenant
create table if not exists alert_rules (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null,
  meta_account_id  text,
  campaign_id      text,
  name             text not null,
  metric           text not null,       -- spend | ctr | cpc | roas | impressions
  operator         text not null,       -- gt | gte | lt | lte
  threshold        numeric not null,
  window_hours     int not null default 24,
  status           text not null default 'active',  -- active | paused
  notify_email     boolean not null default true,
  notify_in_app    boolean not null default true,
  trigger_count    int not null default 0,
  last_triggered_at timestamptz,
  created_at       timestamptz not null default now()
);

-- Eventos disparados por las reglas
create table if not exists alert_events (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  rule_id       uuid references alert_rules(id) on delete cascade,
  metric        text not null,
  value         numeric not null,
  threshold     numeric not null,
  operator      text not null,
  severity      text not null,          -- warning | critical | ok
  campaign_name text,
  ai_analysis   text,
  fired_at      timestamptz not null default now()
);

-- Índices
create index if not exists alert_rules_tenant_idx  on alert_rules(tenant_id);
create index if not exists alert_events_tenant_idx on alert_events(tenant_id);
create index if not exists alert_events_rule_idx   on alert_events(rule_id);

-- RLS
alter table alert_rules  enable row level security;
alter table alert_events enable row level security;

create policy "tenant_rules"  on alert_rules  for all using (tenant_id = auth.uid());
create policy "tenant_events" on alert_events for all using (tenant_id = auth.uid());
