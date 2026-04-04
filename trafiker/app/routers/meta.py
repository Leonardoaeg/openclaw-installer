"""
Meta OAuth router — per-user account connection.

Flow:
  1. GET  /v1/meta/auth-url              → returns Meta OAuth dialog URL
  2. POST /v1/meta/available-accounts    → exchanges code for short-lived token, returns ad accounts
  3. POST /v1/meta/connect               → exchanges to long-lived token, saves to Supabase
  4. GET  /v1/meta/accounts              → lists user's connected accounts
  5. DELETE /v1/meta/accounts/{id}       → disconnects an account
  6. POST /v1/meta/accounts/{id}/sync    → refreshes last_synced_at
  7. POST /v1/meta/data-deletion         → Meta Data Deletion Callback (required by Meta policy)
"""
import base64
import hashlib
import hmac
import json
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta

import logging
from datetime import date as date_type

import httpx
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, Header, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from app.config import settings
from app.supabase.client import get_supabase

router = APIRouter()

GRAPH_BASE = "https://graph.facebook.com/v21.0"
OAUTH_SCOPES = "ads_read,ads_management,business_management,pages_read_engagement"


# ── Auth helpers ───────────────────────────────────────────────────────────────

def _extract_user_id(authorization: str | None) -> str:
    """Decode the Supabase JWT and return the user_id (sub claim)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.removeprefix("Bearer ")
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


def _get_tenant_id(user_id: str) -> str:
    """Look up the tenant_id for a given user_id via tenant_members."""
    db = get_supabase()
    result = (
        db.table("tenant_members")
        .select("tenant_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Usuario sin tenant asignado")
    return result.data[0]["tenant_id"]


# ── Schemas ────────────────────────────────────────────────────────────────────

class AvailableAccountsBody(BaseModel):
    code: str


class ConnectBody(BaseModel):
    access_token: str
    ad_account_id: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/auth-url")
def get_auth_url():
    """Return the Meta OAuth dialog URL for the frontend to redirect to."""
    params = {
        "client_id": settings.meta_app_id,
        "redirect_uri": settings.meta_redirect_uri,
        "scope": OAUTH_SCOPES,
        "response_type": "code",
    }
    url = f"https://www.facebook.com/v21.0/dialog/oauth?{urlencode(params)}"
    return {"url": url}


@router.post("/available-accounts")
def get_available_accounts(body: AvailableAccountsBody):
    """
    Exchange the OAuth code for a short-lived user token, then list
    the ad accounts accessible to that user.
    Returns the accounts list and the short-lived access_token so the
    frontend can pass it back to /connect without reusing the code.
    """
    # Exchange code → short-lived token
    token_params = {
        "client_id": settings.meta_app_id,
        "client_secret": settings.meta_app_secret,
        "redirect_uri": settings.meta_redirect_uri,
        "code": body.code,
    }
    token_resp = httpx.get(f"{GRAPH_BASE}/oauth/access_token", params=token_params)
    if token_resp.status_code != 200:
        detail = token_resp.json().get("error", {}).get("message", "Error al intercambiar el código de Meta")
        raise HTTPException(status_code=400, detail=detail)

    short_token: str = token_resp.json()["access_token"]

    # List accessible ad accounts
    accounts_resp = httpx.get(
        f"{GRAPH_BASE}/me/adaccounts",
        params={
            "access_token": short_token,
            "fields": "id,name,currency,timezone_name",
        },
    )
    if accounts_resp.status_code != 200:
        detail = accounts_resp.json().get("error", {}).get("message", "Error al obtener cuentas de Meta")
        raise HTTPException(status_code=400, detail=detail)

    raw_accounts = accounts_resp.json().get("data", [])
    accounts = [
        {
            "id": acc["id"],          # already in act_XXXXX format
            "name": acc.get("name", acc["id"]),
            "currency": acc.get("currency", ""),
            "timezone": acc.get("timezone_name", ""),
        }
        for acc in raw_accounts
    ]

    return {"accounts": accounts, "access_token": short_token}


@router.post("/connect")
def connect_meta_account(
    body: ConnectBody,
    authorization: str | None = Header(default=None),
):
    """
    Exchange short-lived token → long-lived token (60-day).
    Fetch the chosen ad account's details and store everything in Supabase.
    """
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)

    # Exchange short-lived → long-lived token
    ll_resp = httpx.get(
        f"{GRAPH_BASE}/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": settings.meta_app_id,
            "client_secret": settings.meta_app_secret,
            "fb_exchange_token": body.access_token,
        },
    )
    if ll_resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=ll_resp.json().get("error", {}).get("message", "Error al obtener token de larga duración"),
        )

    ll_data = ll_resp.json()
    long_token: str = ll_data["access_token"]
    # token_type=bearer, expires_in in seconds (usually 5184000 = 60 days)
    expires_in: int = ll_data.get("expires_in", 5184000)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Ensure ad_account_id has act_ prefix
    ad_account_id = body.ad_account_id
    if not ad_account_id.startswith("act_"):
        ad_account_id = f"act_{ad_account_id}"

    # Fetch Meta user ID + account name/currency with the long-lived token
    me_resp = httpx.get(
        f"{GRAPH_BASE}/me",
        params={"access_token": long_token, "fields": "id"},
    )
    meta_user_id: str = me_resp.json().get("id", "") if me_resp.status_code == 200 else ""

    acc_resp = httpx.get(
        f"{GRAPH_BASE}/{ad_account_id}",
        params={
            "access_token": long_token,
            "fields": "id,name,currency,timezone_name",
        },
    )
    acc_data = acc_resp.json() if acc_resp.status_code == 200 else {}

    account_name = acc_data.get("name", ad_account_id)
    currency = acc_data.get("currency", "")
    timezone_name = acc_data.get("timezone_name", "")

    # Upsert into Supabase (one row per user+ad_account)
    db = get_supabase()
    result = (
        db.table("meta_accounts")
        .upsert(
            {
                "tenant_id": tenant_id,
                "meta_user_id": meta_user_id,
                "meta_ad_account_id": ad_account_id,
                "name": account_name,
                "currency": currency,
                "timezone": timezone_name,
                "access_token_encrypted": long_token,
                "token_expires_at": expires_at.isoformat(),
                "status": "active",
            },
            on_conflict="tenant_id,meta_ad_account_id",
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Error guardando la cuenta en la base de datos")

    row = result.data[0]
    return {
        "id": row["id"],
        "meta_ad_account_id": row["meta_ad_account_id"],
        "name": row["name"],
        "currency": row["currency"],
        "timezone": row.get("timezone", ""),
        "status": row["status"],
        "last_synced_at": row.get("last_synced_at"),
    }


@router.get("/available-portfolios")
def get_available_portfolios(authorization: str | None = Header(default=None)):
    """
    Return Meta business portfolios available to import, without creating anything.
    """
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()

    accounts_result = (
        db.table("meta_accounts")
        .select("id,meta_ad_account_id,name,access_token_encrypted")
        .eq("tenant_id", tenant_id)
        .eq("status", "active")
        .execute()
    )
    accounts = accounts_result.data or []

    business_map: dict[str, dict] = {}
    errors: list[str] = []
    for account in accounts:
        token = account["access_token_encrypted"]
        resp = httpx.get(
            f"{GRAPH_BASE}/{account['meta_ad_account_id']}",
            params={"access_token": token, "fields": "id,name,business"},
            timeout=10,
        )
        if resp.status_code != 200:
            err = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
            errors.append(f"{account['name']}: {err}")
            continue
        data = resp.json()
        business = data.get("business")
        if business:
            biz_id = business["id"]
            if biz_id not in business_map:
                business_map[biz_id] = {
                    "id": biz_id,
                    "name": business.get("name", biz_id),
                    "accounts": [],
                }
            business_map[biz_id]["accounts"].append(account["id"])
        else:
            biz_id = f"acc_{account['id']}"
            business_map[biz_id] = {
                "id": biz_id,
                "name": account["name"],
                "accounts": [account["id"]],
            }

    # Get plan limit and current count
    plan_result = (
        db.table("subscriptions")
        .select("plans(max_portfolios)")
        .eq("tenant_id", tenant_id)
        .in_("status", ["active", "trialing"])
        .limit(1)
        .execute()
    )
    max_portfolios: int | None = None
    if plan_result.data:
        max_portfolios = (plan_result.data[0].get("plans") or {}).get("max_portfolios", 1)
    else:
        max_portfolios = 1

    existing_count_result = (
        db.table("portfolios")
        .select("id", count="exact")
        .eq("tenant_id", tenant_id)
        .execute()
    )
    existing_count = existing_count_result.count or 0
    slots_available = (max_portfolios - existing_count) if max_portfolios is not None else None

    return {
        "portfolios": list(business_map.values()),
        "errors": errors,
        "max_portfolios": max_portfolios,
        "existing_count": existing_count,
        "slots_available": slots_available,
    }


class SyncPortfoliosBody(BaseModel):
    selected_ids: list[str]  # biz_id values chosen by the user


@router.post("/sync-portfolios")
def sync_portfolios(body: SyncPortfoliosBody, authorization: str | None = Header(default=None)):
    """
    Create/update portfolios in Supabase for the user-selected Meta businesses.
    """
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()

    # Get all active meta accounts for this tenant
    accounts_result = (
        db.table("meta_accounts")
        .select("id,meta_ad_account_id,name,access_token_encrypted")
        .eq("tenant_id", tenant_id)
        .eq("status", "active")
        .execute()
    )
    accounts = accounts_result.data or []
    if not accounts:
        return {"created": 0, "updated": 0, "portfolios": []}

    # Get plan limit for this tenant
    plan_result = (
        db.table("subscriptions")
        .select("plans(max_portfolios)")
        .eq("tenant_id", tenant_id)
        .in_("status", ["active", "trialing"])
        .limit(1)
        .execute()
    )
    max_portfolios: int | None = None
    if plan_result.data:
        max_portfolios = (plan_result.data[0].get("plans") or {}).get("max_portfolios", 1)
    else:
        max_portfolios = 1  # fallback: free plan

    # Count existing portfolios
    existing_count_result = (
        db.table("portfolios")
        .select("id", count="exact")
        .eq("tenant_id", tenant_id)
        .execute()
    )
    existing_count = existing_count_result.count or 0

    # Group accounts by their Meta business (portfolio comercial)
    business_map: dict[str, dict] = {}  # business_id → {name, accounts: []}
    for account in accounts:
        token = account["access_token_encrypted"]
        resp = httpx.get(
            f"{GRAPH_BASE}/{account['meta_ad_account_id']}",
            params={"access_token": token, "fields": "id,name,business"},
            timeout=10,
        )
        if resp.status_code != 200:
            continue
        data = resp.json()
        business = data.get("business")
        if business:
            biz_id = business["id"]
            if biz_id not in business_map:
                business_map[biz_id] = {"name": business.get("name", biz_id), "accounts": []}
            business_map[biz_id]["accounts"].append(account["id"])
        else:
            # No business — use account name as portfolio name
            biz_id = f"acc_{account['id']}"
            business_map[biz_id] = {"name": account["name"], "accounts": [account["id"]]}

    created = 0
    updated = 0
    skipped = 0
    portfolio_names = []

    for biz_id, biz in business_map.items():
        if biz_id not in body.selected_ids:
            continue
        # Check if portfolio already exists for this tenant with this name
        existing = (
            db.table("portfolios")
            .select("id")
            .eq("tenant_id", tenant_id)
            .eq("name", biz["name"])
            .limit(1)
            .execute()
        )
        if existing.data:
            portfolio_id = existing.data[0]["id"]
            updated += 1
        else:
            # Enforce plan limit on new portfolios
            if max_portfolios is not None and (existing_count + created) >= max_portfolios:
                skipped += 1
                continue
            new_pf = (
                db.table("portfolios")
                .insert({"tenant_id": tenant_id, "name": biz["name"]})
                .execute()
            )
            if not new_pf.data:
                continue
            portfolio_id = new_pf.data[0]["id"]
            created += 1

        # Associate accounts to portfolio (upsert to avoid duplicates)
        for meta_account_id in biz["accounts"]:
            db.table("portfolio_accounts").upsert(
                {"portfolio_id": portfolio_id, "meta_account_id": meta_account_id},
                on_conflict="portfolio_id,meta_account_id",
            ).execute()

        portfolio_names.append(biz["name"])

    result = {"created": created, "updated": updated, "portfolios": portfolio_names}
    if skipped:
        result["skipped"] = skipped
        result["limit_reached"] = True
    return result


@router.get("/accounts")
def list_accounts(authorization: str | None = Header(default=None)):
    """List all Meta accounts connected by the current user."""
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()
    result = (
        db.table("meta_accounts")
        .select("id,meta_ad_account_id,name,currency,timezone,status,last_synced_at,created_at")
        .eq("tenant_id", tenant_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.delete("/accounts/{account_id}", status_code=204)
def disconnect_account(account_id: str, authorization: str | None = Header(default=None)):
    """Remove a connected Meta account (only the owner can do this)."""
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()
    db.table("meta_accounts").delete().eq("id", account_id).eq("tenant_id", tenant_id).execute()


CAMPAIGN_FIELDS = "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time"
INSIGHT_FIELDS = "spend,impressions,clicks,reach,ctr,cpc,cpm,actions,action_values"


def _sync_account_metrics_background(
    token: str,
    meta_ad_account_id: str,
    supabase_account_id: str,
    tenant_id: str,
    since: str,
    until: str,
) -> None:
    """Background: fetch daily insights per campaign and upsert to campaign_metrics."""
    db = get_supabase()
    try:
        camp_rows = (
            db.table("campaigns")
            .select("id,meta_campaign_id")
            .eq("meta_account_id", supabase_account_id)
            .eq("tenant_id", tenant_id)
            .execute()
        ).data or []
    except Exception as exc:
        logger.error("BG metrics: error fetching campaigns for account %s: %s", supabase_account_id, exc)
        return

    for camp in camp_rows:
        try:
            resp = httpx.get(
                f"{GRAPH_BASE}/{meta_ad_account_id}/insights",
                params={
                    "access_token": token,
                    "fields": INSIGHT_FIELDS,
                    "filtering": f'[{{"field":"campaign.id","operator":"IN","value":["{camp["meta_campaign_id"]}"]}}]',
                    "level": "campaign",
                    "time_increment": 1,
                    "time_range": f'{{"since":"{since}","until":"{until}"}}',
                    "limit": 90,
                },
                timeout=20,
            )
            if resp.status_code != 200:
                continue
            total_conversations = 0
            for row in resp.json().get("data", []):
                actions = row.get("actions") or []
                action_values = row.get("action_values") or []

                def _av(types):
                    return sum(float(a.get("value", 0)) for a in action_values if a.get("action_type") in types)

                def _ac(types):
                    return sum(int(a.get("value", 0)) for a in actions if a.get("action_type") in types)

                spend = float(row.get("spend") or 0)
                impressions = int(row.get("impressions") or 0)
                clicks = int(row.get("clicks") or 0)
                revenue = _av(["purchase", "offsite_conversion.fb_pixel_purchase"])
                conversions = _ac(["purchase", "offsite_conversion.fb_pixel_purchase"])
                # WhatsApp / messaging conversations
                # onsite_conversion.messaging_conversation_started_7d uses a 7-day attribution window;
                # it is NOT a strict daily count but it is the canonical Meta signal for messaging.
                conversations_started = _ac(["onsite_conversion.messaging_conversation_started_7d"])
                total_conversations += conversations_started
                cost_per_conversation = (
                    round(spend / conversations_started, 4) if conversations_started > 0 else None
                )
                d = row.get("date_start")
                if not d:
                    continue
                db.table("campaign_metrics").upsert(
                    {
                        "tenant_id": tenant_id,
                        "campaign_id": camp["id"],
                        "date": d,
                        "impressions": impressions,
                        "clicks": clicks,
                        "spend": spend,
                        "reach": int(row.get("reach") or 0),
                        "conversions": conversions,
                        "ctr": float(row.get("ctr") or 0),
                        "cpc": float(row.get("cpc") or 0),
                        "cpm": float(row.get("cpm") or 0),
                        "roas": round(revenue / spend, 4) if spend > 0 and revenue > 0 else None,
                        "conversations_started": conversations_started,
                        "cost_per_conversation": cost_per_conversation,
                    },
                    on_conflict="tenant_id,campaign_id,date",
                ).execute()
            # Si cualquier día del período tuvo conversaciones, clasificar la campaña
            # como messaging independientemente del objective declarado.
            if total_conversations > 0:
                db.table("campaigns").update(
                    {"is_messaging": True, "channel_type": "messaging"}
                ).eq("id", camp["id"]).execute()
        except Exception as exc:
            logger.error("BG metrics: error for campaign %s: %s", camp["id"], exc)


def _sync_account_full_background(
    token: str,
    meta_ad_account_id: str,
    account_id: str,
    tenant_id: str,
) -> None:
    """Background: sync campaigns list then metrics for an account."""
    db = get_supabase()

    # 1. Fetch and upsert campaigns
    try:
        camp_resp = httpx.get(
            f"{GRAPH_BASE}/{meta_ad_account_id}/campaigns",
            params={
                "access_token": token,
                "fields": CAMPAIGN_FIELDS,
                "effective_status": '["ACTIVE","PAUSED","ARCHIVED"]',
                "limit": 200,
            },
            timeout=30,
        )
        if camp_resp.status_code == 200:
            campaigns = camp_resp.json().get("data", [])
            if campaigns:
                records = [
                    {
                        "tenant_id": tenant_id,
                        "meta_account_id": account_id,
                        "meta_campaign_id": c["id"],
                        "name": c.get("name", ""),
                        "status": c.get("status", "PAUSED"),
                        "objective": c.get("objective"),
                        "daily_budget": int(c["daily_budget"]) / 100 if c.get("daily_budget") else None,
                        "lifetime_budget": int(c["lifetime_budget"]) / 100 if c.get("lifetime_budget") else None,
                        "start_time": c.get("start_time"),
                        "stop_time": c.get("stop_time"),
                        "last_synced_at": date_type.today().isoformat(),
                        # Channel classification — phase 1
                        # is_messaging: objective signals a messaging campaign (WhatsApp or Messenger)
                        # is_whatsapp:  stays False until adset destination_type confirms WHATSAPP (phase 2)
                        # destination_type: populated in phase 2 via adset fetch
                        "is_messaging": c.get("objective") == "MESSAGES",
                        "is_whatsapp": False,
                        "channel_type": "messaging" if c.get("objective") == "MESSAGES" else None,
                        "destination_type": None,
                    }
                    for c in campaigns
                ]
                db.table("campaigns").upsert(records, on_conflict="tenant_id,meta_campaign_id").execute()
                logger.info("BG sync: upserted %d campaigns for account %s", len(records), account_id)
        else:
            logger.warning("BG sync: Meta campaigns API %s for %s", camp_resp.status_code, meta_ad_account_id)
    except Exception as exc:
        logger.error("BG sync: campaigns error for account %s: %s", account_id, exc)

    # 2. Update last_synced_at
    try:
        db.table("meta_accounts").update(
            {"last_synced_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", account_id).execute()
    except Exception as exc:
        logger.error("BG sync: update last_synced_at error: %s", exc)

    # 3. Sync metrics (last 30 days)
    today = date_type.today()
    since = (today - timedelta(days=30)).isoformat()
    until = today.isoformat()
    _sync_account_metrics_background(token, meta_ad_account_id, account_id, tenant_id, since, until)


@router.post("/accounts/{account_id}/sync")
def sync_account(
    account_id: str,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
):
    """Queue full campaign + metrics sync in background. Returns immediately."""
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()

    acc_result = (
        db.table("meta_accounts")
        .select("id,meta_ad_account_id,access_token_encrypted")
        .eq("id", account_id)
        .eq("tenant_id", tenant_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not acc_result.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada o inactiva")

    acc = acc_result.data[0]
    background_tasks.add_task(
        _sync_account_full_background,
        acc["access_token_encrypted"],
        acc["meta_ad_account_id"],
        account_id,
        tenant_id,
    )

    return {
        "status": "queued",
        "message": "Sincronización iniciada en segundo plano",
        "metrics_syncing": True,
    }


@router.get("/accounts/{account_id}/debug-action-types")
def debug_action_types(
    account_id: str,
    days: int = 30,
    authorization: str | None = Header(default=None),
):
    """DEBUG ONLY — dumps all raw action_type values from Meta insights."""
    user_id = _extract_user_id(authorization)
    tenant_id = _get_tenant_id(user_id)
    db = get_supabase()

    acc_result = (
        db.table("meta_accounts")
        .select("id,meta_ad_account_id,access_token_encrypted")
        .eq("id", account_id)
        .eq("tenant_id", tenant_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not acc_result.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada o inactiva")

    acc = acc_result.data[0]
    token = acc["access_token_encrypted"]
    meta_ad_account_id = acc["meta_ad_account_id"]

    today = date_type.today()
    since = (today - timedelta(days=days)).isoformat()
    until = today.isoformat()

    resp = httpx.get(
        f"{GRAPH_BASE}/{meta_ad_account_id}/insights",
        params={
            "access_token": token,
            "fields": "campaign_id,campaign_name,actions,action_values",
            "time_range": f'{{"since":"{since}","until":"{until}"}}',
            "level": "campaign",
            "limit": 50,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=resp.json().get("error", {}).get("message", "Meta API error"),
        )

    summary: dict[str, dict] = {}
    rows_debug = []

    for row in resp.json().get("data", []):
        cname = row.get("campaign_name", row.get("campaign_id", "?"))
        row_actions = row.get("actions") or []
        row_av = row.get("action_values") or []

        for a in row_actions:
            at = a.get("action_type", "unknown")
            val = float(a.get("value", 0))
            entry = summary.setdefault(at, {"total_value": 0.0, "campaigns": []})
            entry["total_value"] += val
            if cname not in entry["campaigns"]:
                entry["campaigns"].append(cname)

        rows_debug.append({
            "campaign": cname,
            "action_types": [a.get("action_type") for a in row_actions],
            "action_value_types": [a.get("action_type") for a in row_av],
        })

    logger.info(
        "DEBUG action_types for account %s: %s",
        account_id,
        list(summary.keys()),
    )

    return {
        "period": {"since": since, "until": until},
        "action_types_summary": summary,
        "rows": rows_debug,
    }


# ── Meta Data Deletion Callback ────────────────────────────────────────────────

def _parse_signed_request(signed_request: str, app_secret: str) -> dict:
    """
    Verify and decode Meta's signed_request parameter.
    Format: base64url(signature).base64url(payload)
    Signature = HMAC-SHA256(payload_b64, app_secret)
    Raises HTTPException if the signature is invalid.
    """
    try:
        encoded_sig, payload_b64 = signed_request.split(".", 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="signed_request malformado")

    # Decode signature
    padding = "=" * (4 - len(encoded_sig) % 4)
    sig = base64.urlsafe_b64decode(encoded_sig + padding)

    # Verify HMAC-SHA256
    expected = hmac.new(
        app_secret.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=400, detail="Firma inválida en signed_request")

    # Decode payload
    padding = "=" * (4 - len(payload_b64) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding))
    return payload


@router.post("/data-deletion")
async def data_deletion_callback(request: Request, signed_request: str = Form(...)):
    """
    Meta Data Deletion Callback — required by Meta Platform Policy.

    Meta POSTs here (application/x-www-form-urlencoded) with a signed_request
    when a user removes AgenteFlow from their Facebook account settings.

    We delete all rows in meta_accounts that have a matching Meta user ID,
    then return the required confirmation JSON.

    Configure this URL in Meta App Dashboard →
    Settings → Basic → Data Deletion Instructions URL:
      https://agenteflow.online/v1/meta/data-deletion
    (or proxy through Next.js — see below)
    """
    payload = _parse_signed_request(signed_request, settings.meta_app_secret)
    meta_user_id: str = payload.get("user_id", "")

    if meta_user_id:
        db = get_supabase()
        # meta_user_id is Meta's internal user ID, stored in the token payload.
        # We store it in meta_accounts.meta_user_id for this lookup.
        db.table("meta_accounts").delete().eq("meta_user_id", meta_user_id).execute()

    # Meta requires this exact response shape
    confirmation_code = f"deletion_{meta_user_id}_{int(datetime.now(timezone.utc).timestamp())}"
    return {
        "url": f"https://agenteflow.online/deletion-status?id={confirmation_code}",
        "confirmation_code": confirmation_code,
    }
