# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenClaw Installer is a VPS deployment system for the OpenClaw AI agent platform. It consists of:

1. **`install.sh` / `update.sh`** — Bash installer scripts that provision Docker, Nginx, SSL, and services on Ubuntu/Debian VPS targets.
2. **`dashboard/`** — A standalone Node.js HTTP server (`server.js`) + single-page HTML UI (`index.html`) that runs as a systemd service on the target machine.
3. **`apps/web/`** — A Next.js 15 + Supabase web dashboard (admin interface), deployable to Vercel.

## Commands

All commands run from `apps/web/`:

```bash
cd apps/web
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is currently configured.

## Architecture

### `apps/web/` — Next.js Dashboard

- Uses the **Next.js App Router** with Supabase Auth (cookie-based SSR).
- `app/` contains pages; `app/protected/` requires authentication.
- Auth flow: login → Supabase → `app/auth/confirm/route.ts` → redirect to `/protected`.
- `lib/supabase/client.ts` for browser client, `lib/supabase/server.ts` for server components/actions.
- UI built with **shadcn/ui** (New York style) + Tailwind CSS. Color tokens use HSL CSS variables.
- Path alias `@/` maps to the `apps/web/` root.
- Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).

### `dashboard/` — Node.js Server

- `server.js` is a self-contained Node.js HTTP server (no framework) running on port 7000.
- Manages the OpenClaw agent on the host: reads/writes `/opt/openclaw/data/` (config, vault, memory files, skills).
- Key server-side modules: vault/credential management (`getVault`, `syncVaultToSystem`), cost alerts, memory files (MEMORY.md, SOUL.md, USER.md), sub-agent listing, audit logging.
- `syncVaultToSystem()` propagates API keys to `docker-compose.yml` and `auth-profiles.json`.

### `install.sh`

- Targets Ubuntu 22+ / Debian 12+. Installs Docker, Node.js, Git if missing.
- Prompts for agent config (name, API keys, bot tokens, domain).
- Deploys OpenClaw via Docker Compose to `/opt/openclaw/`.
- Installs dashboard server as a systemd service at `/opt/openclaw-dashboard/`.
- Optionally configures Nginx reverse proxy with Let's Encrypt SSL.

## Key File Locations (on target VPS after install)

```
/opt/openclaw/data/config/config.json       # Agent configuration
/opt/openclaw/data/workspace/MEMORY.md      # Agent memory
/opt/openclaw/data/workspace/SOUL.md        # Agent persona
/opt/openclaw/data/agents/main/auth-profiles.json  # Provider API keys
/opt/openclaw-dashboard/                    # Dashboard service files
```
