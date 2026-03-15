# DungDiBinhLuan — Game Mod Download Site

A Next.js 16 app for sharing FC 26 / FIFA mods, facepacks, and kits. Migrated from Vercel to Replit.

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Storage**: Cloudflare R2 (via AWS S3 SDK) for file hosting
- **Rate limiting / KV**: Upstash Redis
- **Analytics**: @vercel/analytics (client-side, works outside Vercel)
- **Language**: TypeScript

## Key directories

- `app/` — Next.js App Router pages and layouts
- `app/api/` — API routes: download, download-mods, gen-code, status, verify-code
- `app/components/` — Shared UI components
- `app/data/` — Static data / mod catalogue
- `app/mods/` — Mod listing pages
- `app/games/` — Game-specific pages
- `app/admin/` — Admin panel
- `public/` — Static assets

## Required environment variables

Set these as Replit Secrets before running in production:

| Variable | Description |
|---|---|
| `ACCESS_KEY_ID` | Cloudflare R2 / AWS access key ID |
| `SECRET_ACCESS_KEY` | Cloudflare R2 / AWS secret access key |
| `R2_ENDPOINT` | R2 bucket endpoint URL |
| `ADMIN_SECRET` | Secret token for admin routes |

## Running locally on Replit

The dev server runs on port 5000 (required by Replit):

```
npm run dev   # starts on 0.0.0.0:5000
```

## Workflow

- **Start application**: `npm run dev` — starts Next.js dev server on port 5000
