# EcoSphere

## Supabase setup (S0–S6)

1. Copy `.env.example` to `.env.local`, then set the project's URL and **publishable** key.
2. Apply the migrations in `supabase/migrations` in timestamp order.
3. Create the Alex, Maya, and Jordan email/password Auth accounts (with email confirmation disabled for the demo), then insert their `profiles` rows using the matching `auth.users.id` values. The initial migration seeds the Atlas organization and shared reference data.
4. Deploy `supabase/functions/calculate-carbon`, `supabase/functions/approve-participation`, and `supabase/functions/generate-insight`. They require the standard `SUPABASE_URL` and `SUPABASE_ANON_KEY` Edge Function secrets plus a custom `SERVICE_ROLE_KEY` secret; never expose the service-role key to Vite or Vercel.
5. For AI insights, set `GEMINI_API_KEY` in Supabase Edge Function secrets (and optionally `GEMINI_MODEL`, which defaults to `gemini-2.5-flash`). The key is never sent to the browser.

Environmental, governance, and challenge data now load from Supabase. Challenge submissions use RLS-protected direct writes; approvals use the `approve-participation` Edge Function to atomically award points and the 400-point Climate Champion badge. S6 adds optional 10 MB private evidence files (PDF/JPEG/PNG/WebP) and a Gemini insight function grounded in the server dashboard read model. The browser client accepts only the publishable key; the service-role and Gemini keys are confined to Edge Functions.

EcoSphere is an ESG Management Platform that turns environmental operations, employee participation, and governance compliance into one actionable management experience.

**Live demo:** [ecosphere-amber.vercel.app](https://ecosphere-amber.vercel.app/)

## Why EcoSphere

ESG information is often fragmented across operational records, compliance trackers, and employee initiatives. EcoSphere connects those signals so organizations can:

- Measure operational carbon emissions using transparent emission factors.
- Monitor Environmental, Social, and Governance performance in one Command Center.
- Assign ownership to compliance risks and track overdue issues.
- Encourage sustainable employee action through challenges, EcoPoints, badges, and leaderboards.
- Convert raw ESG signals into grounded, explainable recommendations.

## Core capabilities

### Command Center

- Weighted overall ESG score: Environmental 40%, Social 30%, Governance 30%.
- Pillar scores, carbon footprint, active governance risks, and challenge participation.
- Department carbon ranking, goal progress, and ESG action recommendations.

### Environmental management

- Record operational activity.
- Select a verified emission factor.
- Calculate auditable carbon emissions automatically.
- Review the carbon ledger and Operations target variance.

### Governance and compliance

- Track policy acknowledgements.
- Create, assign, and update compliance issues.
- Highlight high-severity and overdue governance risks.

### Employee engagement

- Submit evidence for a sustainability challenge.
- Approve verified participation.
- Award EcoPoints and unlock badges.
- View progress and a compact leaderboard.

### Executive reporting

- Generate an ESG Summary Report from current platform data.
- Review Environmental, Social, and Governance highlights.
- Print a clean executive report.

## Insight Engine

EcoSphere’s Insight Engine is decision support grounded in live EcoSphere metrics. It identifies priorities such as carbon-target variance, high-severity compliance exposure, and unverified employee participation, then links directly to the relevant workflow.

It deliberately does not claim to be a general-purpose chatbot or alter official ESG calculations. Scores and carbon calculations remain transparent and deterministic.

## Demo flow

1. Sign in as **Alex Rivera — ESG Director**.
2. Open the **Command Center** to review ESG health and recommendations.
3. Add an operational activity in **Environmental** and inspect the carbon calculation trail.
4. Open **Governance** to review the overdue fleet-evidence issue and policy acknowledgement status.
5. Sign in as **Jordan Lee** to submit challenge evidence.
6. Switch to Alex or Maya, approve the submission, and show EcoPoints and badge recognition.
7. Close with the **ESG Summary Report**.

Use **Reset demo data** on the persona screen before a fresh rehearsal.

## Local development

### Prerequisites

- Node.js 20 or later
- npm

### Run locally

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

## Technical overview

- React + TypeScript
- Vite
- Supabase Auth, PostgreSQL, Row Level Security, and Edge Functions
- Lucide icons
- Responsive CSS dashboard design
- Vercel deployment

The application is organized around reusable UI primitives, feature pages, Supabase-backed workflows, seeded business data, and role-aware UI behavior. The Command Center and executive report share the `get_dashboard()` server-side read model, so ESG scores and decision metrics are calculated from persisted records rather than in the browser.

## Demo personas

| Persona | Role | Primary use |
| --- | --- | --- |
| Alex Rivera | ESG Director / Admin | Organization-wide Command Center and management workflow |
| Maya Chen | Operations Manager | Carbon and compliance ownership |
| Jordan Lee | Employee | Challenge participation and evidence submission |

## Important hackathon scope note

The local repository remains only as a migration fallback. Configured deployments use Supabase for authentication and persistent, organization-scoped data.

Production evolution would add real notification delivery, malware scanning/retention rules for evidence, and AI evaluation/feedback controls.

## Deployment

EcoSphere is deployed on Vercel. Vercel detects the Vite project and builds it with:

```text
Build command: npm run build
Output directory: dist
```

## Repository quality checks

```bash
npm run build
```

The build runs TypeScript compilation followed by a Vite production build.

## Team

Built for an ESG Management Platform hackathon.
