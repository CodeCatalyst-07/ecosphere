# EcoSphere

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
- Local browser persistence for the hackathon demo
- Lucide icons
- Responsive CSS dashboard design
- Vercel deployment

The application is organized around reusable UI primitives, feature pages, a local demo repository, seeded business data, and role-aware UI behavior.

## Demo personas

| Persona | Role | Primary use |
| --- | --- | --- |
| Alex Rivera | ESG Director / Admin | Organization-wide Command Center and management workflow |
| Maya Chen | Operations Manager | Carbon and compliance ownership |
| Jordan Lee | Employee | Challenge participation and evidence submission |

## Important hackathon scope note

This version is a polished frontend demonstration, optimized for an eight-hour hackathon. It uses seeded data and browser `localStorage` rather than production services.

Production evolution would add:

- Secure authentication and server-enforced role-based access.
- PostgreSQL-backed multi-tenant data storage.
- REST APIs and backend domain services.
- File storage for participation evidence.
- Real notification delivery.
- Model-backed AI recommendations with server-side credentials.

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
