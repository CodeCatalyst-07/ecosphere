# EcoSphere

EcoSphere is a full-stack ESG management platform for turning environmental operations, governance accountability, and employee participation into measurable action.

**Live demo:** [ecosphere-amber.vercel.app](https://ecosphere-amber.vercel.app/)

## What it does

- Calculates auditable operational carbon emissions from verified emission factors.
- Surfaces a trusted, server-calculated ESG score: Environmental 40%, Social 30%, Governance 30%.
- Tracks policy acknowledgement, compliance ownership, due dates, and overdue risks.
- Lets employees submit challenge progress and optional private evidence files.
- Lets managers approve submissions atomically, award EcoPoints, and unlock badges.
- Generates Gemini recommendations grounded only in the persisted dashboard metrics.
- Produces a print-ready executive ESG summary.

## Demo accounts

These are the demo account identities for the Atlas Industries Supabase project. Passwords are intentionally not committed to the public repository; set and share the demo password through a private channel only.

| User | Role | Email | Password |
| --- | --- | --- | --- |
| Alex Rivera | ESG Director / Admin | `alex@atlas.example` | eco123@ |
| Maya Chen | Operations Manager | `maya@atlas.example` | eco123@ |
| Jordan Lee | Employee | `jordan@atlas.example` | eco123@ |

## Architecture

```text
React + Vite frontend (Vercel)
  └── Supabase JavaScript client
       ├── Supabase Auth and Row Level Security
       ├── Postgres data and dashboard RPC
       ├── Private Storage evidence bucket
       └── Edge Functions
            ├── calculate-carbon
            ├── approve-participation
            └── generate-insight → Gemini API
```

The browser uses only the Supabase URL and publishable key. Official carbon calculation, participation approval, Gemini access, and service-role access remain server-side.

## Stack

- React, TypeScript, Vite
- Supabase Auth, PostgreSQL, Row Level Security, Storage, and Edge Functions
- Gemini API for grounded ESG recommendations
- Vercel for frontend deployment

## Local development

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Never put a service-role key or Gemini key in `.env.local` for the browser.

## Supabase configuration

The migrations in [`supabase/migrations`](supabase/migrations) define the schema, RLS policies, dashboard read model, challenge workflow, evidence metadata, and AI-insight storage. The Edge Functions live in [`supabase/functions`](supabase/functions).

For the configured demo project, verify that the three Auth users above are email-confirmed and have matching `public.profiles` rows.

Deploy the Edge Functions:

```bash
supabase functions deploy calculate-carbon
supabase functions deploy approve-participation
supabase functions deploy generate-insight
```

Set these Supabase Edge Function secrets:

```bash
supabase secrets set SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

`GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`.

## Vercel deployment

1. Import this GitHub repository into Vercel.
2. Use build command `npm run build` and output directory `dist`.
3. Add these Vercel environment variables:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

4. In Supabase **Authentication → URL Configuration**, set the Vercel production URL as the Site URL and add it to Redirect URLs.
5. Deploy and sign in with one of the demo accounts.

## Quality check

```bash
npm run build
```

## Presentation guide

See [DEMO.md](DEMO.md) for the under-three-minute demo script.
