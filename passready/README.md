# PassReady

PassReady is a web application that helps learner drivers assess whether they are ready for their UK practical driving test. This repository now includes a production-minded backend flow: Stripe paywall, server-side scoring, and Supabase persistence for payments and reports.

Public conversion pages include a premium-focused landing experience, a sample report preview, trust/FAQ content, and consistent one-time pricing copy (`£4.99`).

## Getting started

Run commands from the **`passready/`** directory (where `package.json` lives):

```bash
cd passready
npm install
npm run dev
```

Open `http://localhost:3000`.

```bash
npm run build
npm start
```

## Project structure

```
passready/
├── app/                      # Next.js App Router routes & global styles
│   ├── layout.tsx            # Root layout, fonts, metadata, chrome
│   ├── page.tsx              # Landing page
│   ├── globals.css           # Tailwind entry + base layer
│   ├── assessment/page.tsx   # Assessment route shell
│   ├── results/page.tsx      # Results shell (client reads localStorage cache)
│   ├── checkout/success/page.tsx # Verifies payment and finalises report
│   ├── report-lookup/page.tsx # Customer report lookup by email
│   ├── reports/[id]/page.tsx  # Stored report detail by id
│   ├── admin/page.tsx         # Internal analytics dashboard
│   └── api/
│       ├── assessment/score/route.ts
│       ├── checkout/create-session/route.ts
│       ├── checkout/verify-session/route.ts
│       ├── reports/lookup/route.ts
│       ├── reports/[id]/route.ts
│       ├── reports/finalise/route.ts
│       ├── admin/analytics/overview/route.ts
│       ├── admin/analytics/recent-sales/route.ts
│       └── stripe/webhook/route.ts
├── components/               # Reusable UI
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Button.tsx
│   ├── Section.tsx
│   ├── FeatureCard.tsx
│   ├── AssessmentForm.tsx    # Client form (save pending + redirect to checkout)
│   ├── CheckoutSuccessFlow.tsx # Client payment verification and report finalisation
│   ├── ReportLookupForm.tsx   # Customer lookup UX
│   ├── AdminAnalyticsView.tsx # Internal KPI + sales view
│   └── ResultsView.tsx        # Client results (localStorage + API for legacy v1)
├── lib/
│   ├── api/score-assessment.ts   # Browser fetch helper for scoring API
│   ├── api/create-checkout-session.ts
│   ├── api/finalise-report.ts
│   ├── api/verify-checkout-session.ts
│   ├── services/assessment-service.ts  # Server scoring orchestration (swap for AI later)
│   ├── transformers/deterministic-to-report.ts # Fallback report shaping
│   ├── server/supabase.ts        # Service-role Supabase client (server-only)
│   ├── server/admin-gate.ts      # Temporary ADMIN_ACCESS_KEY gate helper
│   ├── server/repositories/reports-repository.ts
│   ├── server/repositories/payments-repository.ts
│   ├── server/stripe.ts          # Server-only Stripe helper functions
│   ├── server/openai.ts          # Server-only OpenAI client wrapper
│   ├── server/generate-readiness-report.ts # Server-only AI report generator
│   ├── constants.ts          # Copy, weak-area catalogue
│   ├── validation.ts         # Zod schemas + API/persisted envelope types
│   ├── scoring.ts            # Deterministic readiness engine (server-only usage path)
│   ├── storage.ts            # Versioned localStorage read/write
│   ├── formatting.ts         # Date/time display helpers
│   ├── errors.ts             # ApiRequestError for fetch boundary
│   └── types.ts              # Re-exports of shared value types
├── supabase/schema.sql       # SQL schema for reports/payments tables
├── styles/                   # Optional CSS tokens outside Tailwind
│   └── tokens.css
├── public/                   # Static assets (favicon, images)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── AGENTS.md                 # Agent/product guidance
└── cursor.rules              # Engineering conventions
```

## Environment

Local secrets live in `.env.local` (ignored by git). Copy `.env.example` to get started.

Required for scoring and payments:

- `NEXT_PUBLIC_APP_URL` - app base URL (used in Stripe success/cancel URLs)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase server key (server-only, never expose)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - reserved for future client usage
- `ADMIN_ACCESS_KEY` - temporary gate for `/admin` analytics APIs

Stripe:

- `STRIPE_SECRET_KEY` - server-side secret key
- `STRIPE_PRICE_ID` - one-time checkout price ID
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - reserved for client Stripe usage (future UI expansion)

OpenAI:

- `OPENAI_API_KEY` — server-side API key
- `OPENAI_MODEL` — optional model override (`gpt-4o-mini` default)

If OpenAI is missing or fails, the app automatically falls back to deterministic scoring and still returns a full report.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Set the Supabase environment variables in `.env.local`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Report lookup flow

1. Customer visits `/report-lookup`.
2. Enters checkout email.
3. `/api/reports/lookup` validates email and returns recent summaries only:
   - `created_at`, `readiness_score`, `readiness_label`, `report_source`.
4. Customer opens `/reports/[id]` for full stored report details.

This is intentionally lightweight and should be replaced by account-based auth later.

## Payment and finalise flow

1. User submits assessment form.
2. App stores pending assessment under `passready_pending_assessment`.
3. App calls `/api/checkout/create-session` and redirects to Stripe Checkout.
4. Stripe returns to `/checkout/success?session_id=...`.
5. Success flow calls `/api/checkout/verify-session` (server-side Stripe verification).
6. If paid, app calls `/api/reports/finalise` with `{ sessionId, assessment }`.
7. `/api/reports/finalise` re-verifies Stripe session server-side, scores assessment, upserts payment, and stores report in Supabase.
8. Client stores the returned final report in localStorage for immediate UX, clears pending key, and redirects to `/results`.
9. If unpaid/invalid, app shows a recovery state back to assessment.

Webhook endpoint `/api/stripe/webhook` is signature-verified and upserts payment rows on `checkout.session.completed`. This complements finalise (which is user-return-driven) and supports future async fulfilment.

## Admin analytics (temporary gate)

- `/admin` loads KPI cards and recent sales by calling:
  - `/api/admin/analytics/overview`
  - `/api/admin/analytics/recent-sales`
- Both endpoints require `ADMIN_ACCESS_KEY` via header `x-admin-access-key` (or `admin_key` query param).
- The admin page stores the key in `sessionStorage` for local/dev convenience.

This is a stopgap and must be replaced with real authentication/authorization later.

## AI scoring flow

1. `/api/assessment/score` validates the request body with Zod.
2. `assessment-service` computes deterministic scoring first.
3. Service attempts AI enrichment via `lib/server/generate-readiness-report.ts`.
4. AI response is strictly schema-validated.
5. If valid, API returns `result.metadata.source = "ai"`.
6. If invalid/misconfigured/timeouts/errors, API returns polished fallback with `source = "fallback"`.

This keeps API response shape stable while making model/provider swaps isolated to server modules.

## What ships next

- Checkout and entitlements (Stripe)
- Expand server-side AI generation with rate limits, caching, and auditing
- Authentication when the product needs accounts
