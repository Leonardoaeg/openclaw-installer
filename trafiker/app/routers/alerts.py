from fastapi import APIRouter, HTTPException
from app.models.schemas import AlertRuleCreate
from app.supabase.client import get_supabase
from app.config import settings
import anthropic

router = APIRouter()

_anthropic = anthropic.Anthropic(api_key=settings.anthropic_api_key)


# ─── CRUD de reglas ──────────────────────────────────────────────────────────

@router.get("/{tenant_id}")
def list_alerts(tenant_id: str):
    db = get_supabase()
    rules = (
        db.table("alert_rules")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", desc=True)
        .execute()
    )
    events = (
        db.table("alert_events")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("fired_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"rules": rules.data, "events": events.data}


@router.post("/")
def create_alert(data: AlertRuleCreate):
    db = get_supabase()
    result = (
        db.table("alert_rules")
        .insert({
            "tenant_id": data.tenant_id,
            "meta_account_id": data.meta_account_id,
            "campaign_id": data.campaign_id,
            "name": data.name,
            "metric": data.metric,
            "operator": data.operator,
            "threshold": data.threshold,
            "window_hours": data.window_hours,
            "notify_email": data.notify_email,
            "notify_in_app": data.notify_in_app,
            "status": "active",
            "trigger_count": 0,
        })
        .execute()
    )
    return result.data[0]


@router.patch("/{rule_id}")
def update_alert(rule_id: str, body: dict):
    db = get_supabase()
    allowed = {"name", "threshold", "operator", "status", "notify_email", "notify_in_app"}
    update_data = {k: v for k, v in body.items() if k in allowed}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nada que actualizar")
    result = db.table("alert_rules").update(update_data).eq("id", rule_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    return result.data[0]


@router.delete("/{rule_id}")
def delete_alert(rule_id: str):
    db = get_supabase()
    db.table("alert_rules").delete().eq("id", rule_id).execute()
    return {"ok": True}


# ─── Análisis de IA ──────────────────────────────────────────────────────────

@router.post("/events/{event_id}/analyze")
def analyze_event(event_id: str):
    """Pide a Trafiker que analice un evento de alerta y dé una recomendación."""
    db = get_supabase()

    event_res = db.table("alert_events").select("*").eq("id", event_id).single().execute()
    if not event_res.data:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    event = event_res.data

    rule_res = db.table("alert_rules").select("*").eq("id", event["rule_id"]).single().execute()
    rule = rule_res.data if rule_res.data else {}

    overshoot = abs(event["value"] - event["threshold"]) / event["threshold"] * 100 if event["threshold"] else 0

    prompt = f"""Eres Trafiker, un agente experto en campañas de Meta Ads.
Analiza esta alerta y da una recomendación concreta y accionable.

Alerta: {rule.get('name', 'Sin nombre')}
Métrica: {event['metric'].upper()}
Valor actual: {event['value']}
Umbral: {event['threshold']} ({event['operator']}) — desviación del {overshoot:.1f}%
Campaña: {event.get('campaign_name', 'Todas las campañas')}
Severidad: {event['severity']}

Responde en máximo 3 oraciones. Sé directo y específico."""

    response = _anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )

    analysis = response.content[0].text
    db.table("alert_events").update({"ai_analysis": analysis}).eq("id", event_id).execute()

    return {"analysis": analysis}


# ─── Evaluación de reglas contra métricas ────────────────────────────────────

@router.post("/evaluate/{tenant_id}")
def evaluate_alerts(tenant_id: str, metrics: dict):
    """
    Evalúa las reglas activas contra las métricas recibidas.
    metrics: { "spend": 920, "ctr": 1.1, "cpc": 0.95, "roas": 1.2, ... }
    """
    db = get_supabase()

    rules_res = (
        db.table("alert_rules")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("status", "active")
        .execute()
    )

    fired = []
    for rule in rules_res.data:
        metric = rule["metric"]
        value = metrics.get(metric)
        if value is None:
            continue

        threshold = rule["threshold"]
        op = rule["operator"]
        triggered = (
            (op == "gt"  and value >  threshold) or
            (op == "gte" and value >= threshold) or
            (op == "lt"  and value <  threshold) or
            (op == "lte" and value <= threshold)
        )

        if not triggered:
            continue

        overshoot = abs(value - threshold) / threshold if threshold else 0
        severity = "critical" if overshoot > 0.2 else "warning"

        event_res = db.table("alert_events").insert({
            "tenant_id": tenant_id,
            "rule_id": rule["id"],
            "metric": metric,
            "value": value,
            "threshold": threshold,
            "operator": op,
            "severity": severity,
            "campaign_name": rule.get("campaign_id") or "General",
        }).execute()

        db.table("alert_rules").update({
            "last_triggered_at": "now()",
            "trigger_count": rule["trigger_count"] + 1,
        }).eq("id", rule["id"]).execute()

        fired.append(event_res.data[0])

    return {"fired": fired, "count": len(fired)}
