# EcoSphere — 3-minute presentation script

## Before you begin

Open the deployed application in two browser tabs. Sign in to one as **Alex Rivera** and keep the other ready for **Jordan Lee**. Use the shared demo password configured privately in Supabase Auth.

## Script (about 2 minutes 45 seconds)

### 0:00–0:25 — Problem and solution

“ESG work is usually fragmented: operations teams track emissions separately, compliance teams manage risk elsewhere, and employee sustainability activity is often invisible. EcoSphere brings those signals into one accountable management platform. It gives leaders a trusted ESG position, clear owners, and actions they can take immediately.”

### 0:25–0:55 — Command Center and AI insight

“This is the Command Center. The overall ESG score is calculated in Supabase from Environmental, Social, and Governance metrics—not in the browser. We can see the carbon footprint, active governance risks, and challenge participation in one place.”

“When I generate an AI insight, Gemini receives only trusted dashboard metrics. It returns a focused recommendation, saves its source metrics for traceability, and links us directly to the relevant workflow. This is grounded decision support, not a generic chatbot.”

### 0:55–1:25 — Environmental workflow

“In Environmental, a manager records an operational activity using a verified emission factor. The `calculate-carbon` Edge Function validates the input and calculates official CO₂e server-side. That creates an auditable operational record and carbon-ledger transaction, then refreshes the dashboard and the target position.”

### 1:25–1:50 — Governance workflow

“Governance turns risk into accountability. Here we track policy acknowledgement alongside compliance issues with a severity, owner, and due date. The platform makes overdue high-severity issues visible before they become reporting problems.”

### 1:50–2:25 — Employee challenge and evidence

“Now I switch to Jordan, an employee. Jordan can submit progress for an active sustainability challenge, add an evidence summary, and optionally attach a private PDF or image. The evidence is stored in a private Supabase bucket with organization-scoped access controls.”

“Back as Alex or Maya, the submission appears in Manager Review. Approving it runs a protected Edge Function, which awards EcoPoints exactly once and unlocks the Climate Champion badge when the threshold is met.”

### 2:25–2:45 — Close

“Finally, Reports converts the same trusted dashboard data into a print-ready executive summary. EcoSphere connects measurement, governance, employee action, and explainable insight—so sustainability teams can move from scattered data to accountable action.”

## Demo path

1. Alex: Command Center → generate AI insight.
2. Alex or Maya: Environmental → record an activity.
3. Alex or Maya: Governance → show the overdue issue.
4. Jordan: Challenges → submit evidence for an active challenge.
5. Alex or Maya: Challenges → approve the submission.
6. Alex: Reports → close on the executive summary.

## Recovery notes

- If Jordan already has an approved participation, create another active challenge for the evidence-upload demonstration.
- If the AI button reports configuration unavailable, confirm `GEMINI_API_KEY` is set in Supabase Edge Function secrets.
- For the best presentation flow, keep the Command Center and Reports pages open in separate tabs.
