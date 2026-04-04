-- ============================================================
-- AgenteFlow — Fase 1: Formalizar schema real + raw_meta_insights
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. FORMALIZAR COLUMNAS DE campaigns ──────────────────────
--
-- El código ya escribe estas columnas desde _sync_account_full_background.
-- ADD COLUMN IF NOT EXISTS es idempotente: si ya existen en prod, no falla.

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS is_messaging     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_whatsapp      BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS channel_type     TEXT,
    ADD COLUMN IF NOT EXISTS destination_type TEXT;

-- ── 2. FORMALIZAR COLUMNAS DE campaign_metrics ───────────────
--
-- conversations_started y cost_per_conversation ya existen en prod
-- (confirmado antes de ejecutar esta migration).
-- raw_insight_id es UUID nullable SIN FK formal — ver nota abajo.

ALTER TABLE campaign_metrics
    ADD COLUMN IF NOT EXISTS conversations_started  INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_per_conversation  NUMERIC(12,4),
    ADD COLUMN IF NOT EXISTS raw_insight_id         UUID;
    -- Sin REFERENCES intencional: raw_meta_insights es particionada por date.
    -- La PK compuesta (id, date) impide FK simple por id en PostgreSQL.
    -- El vínculo es lógico: raw_insight_id = raw_meta_insights.id del mismo date.
    -- Integridad garantizada por la lógica del sync, no por constraint.

-- Índice para JOINs desde campaign_metrics hacia raw_meta_insights
CREATE INDEX IF NOT EXISTS idx_metrics_raw_insight_id
    ON campaign_metrics (raw_insight_id)
    WHERE raw_insight_id IS NOT NULL;

-- ── 3. TABLA raw_meta_insights (particionada por date) ───────
--
-- Una fila = una campaña + un día.
-- Guarda el JSON completo que devuelve Meta sin descartar nada.
-- Sin FK a campaigns.id: el raw es independiente de la normalización interna.
-- Re-sincronizar el mismo día actualiza en lugar de duplicar (upsert).

CREATE TABLE IF NOT EXISTS raw_meta_insights (
    id                UUID    NOT NULL DEFAULT gen_random_uuid(),
    tenant_id         UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    meta_account_id   UUID    REFERENCES meta_accounts(id) ON DELETE SET NULL,
    meta_campaign_id  TEXT    NOT NULL,
    date              DATE    NOT NULL,
    synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    api_version       TEXT    NOT NULL DEFAULT 'v21.0',
    request_params    JSONB,
    raw_actions       JSONB,
    raw_action_values JSONB,
    spend             NUMERIC(12,4),
    impressions       BIGINT,
    clicks            BIGINT,
    reach             BIGINT,
    ctr               NUMERIC(10,6),
    cpc               NUMERIC(10,4),
    cpm               NUMERIC(10,4),
    PRIMARY KEY (id, date)          -- compuesta: date es la clave de partición
) PARTITION BY RANGE (date);

-- Particiones activas: cubrir meses con datos y próximo mes
CREATE TABLE IF NOT EXISTS raw_meta_insights_2026_03
    PARTITION OF raw_meta_insights
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS raw_meta_insights_2026_04
    PARTITION OF raw_meta_insights
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS raw_meta_insights_2026_05
    PARTITION OF raw_meta_insights
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ── 4. UNIQUE CONSTRAINT PARA UPSERT ─────────────────────────
--
-- El backend usa on_conflict="tenant_id,meta_campaign_id,date".
-- En tabla particionada el UNIQUE debe incluir la clave de partición (date).

CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_meta_insights_tenant_campaign_date
    ON raw_meta_insights (tenant_id, meta_campaign_id, date);

-- ── 5. ÍNDICES ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_raw_insights_account_date
    ON raw_meta_insights (meta_account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_raw_insights_campaign_date
    ON raw_meta_insights (meta_campaign_id, date DESC);

-- GIN para consultas sobre action_types específicos (útil en Fase 2)
CREATE INDEX IF NOT EXISTS idx_raw_insights_actions_gin
    ON raw_meta_insights USING GIN (raw_actions);

-- ── 6. PARTICIÓN DE campaign_metrics PARA MAYO ───────────────
--
-- Sin esta partición el primer sync con datos de mayo lanza:
-- "no partition of relation found for row"

CREATE TABLE IF NOT EXISTS campaign_metrics_2026_05
    PARTITION OF campaign_metrics
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ── 7. RLS ────────────────────────────────────────────────────

ALTER TABLE raw_meta_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON raw_meta_insights
    FOR ALL USING (tenant_id = current_tenant_id());

-- ── 8. FUNCIONES HELPER PARA PARTICIONES FUTURAS ─────────────
--
-- Ejecutar manualmente al inicio de cada mes nuevo, por ejemplo:
--   SELECT create_raw_insights_partition(2026, 6);
--   SELECT create_campaign_metrics_partition(2026, 6);

CREATE OR REPLACE FUNCTION create_raw_insights_partition(year INT, month INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    pname     TEXT;
    from_date TEXT;
    to_date   TEXT;
    ny INT := CASE WHEN month = 12 THEN year + 1 ELSE year END;
    nm INT := CASE WHEN month = 12 THEN 1 ELSE month + 1 END;
BEGIN
    pname     := format('raw_meta_insights_%s_%s', year, lpad(month::text, 2, '0'));
    from_date := format('%s-%s-01', year, lpad(month::text, 2, '0'));
    to_date   := format('%s-%s-01', ny, lpad(nm::text, 2, '0'));
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF raw_meta_insights FOR VALUES FROM (%L) TO (%L)',
        pname, from_date, to_date
    );
END;
$$;

CREATE OR REPLACE FUNCTION create_campaign_metrics_partition(year INT, month INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    pname     TEXT;
    from_date TEXT;
    to_date   TEXT;
    ny INT := CASE WHEN month = 12 THEN year + 1 ELSE year END;
    nm INT := CASE WHEN month = 12 THEN 1 ELSE month + 1 END;
BEGIN
    pname     := format('campaign_metrics_%s_%s', year, lpad(month::text, 2, '0'));
    from_date := format('%s-%s-01', year, lpad(month::text, 2, '0'));
    to_date   := format('%s-%s-01', ny, lpad(nm::text, 2, '0'));
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF campaign_metrics FOR VALUES FROM (%L) TO (%L)',
        pname, from_date, to_date
    );
END;
$$;
