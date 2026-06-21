# Pass Pilot — Production Deployment Checklist

Use this checklist before pointing a live domain at the Pass Pilot Next.js app (`passready/`). It covers environment configuration, third-party services, DNS, database migrations, and end-to-end smoke tests.

**Last audited:** June 2026  
**Build status:** `npm run build`, `npm run lint`, and `npx tsc --noEmit` all pass (lint has non-blocking `react-hooks/exhaustive-deps` warnings in admin/assessment components).

---

## Pre-deploy audit summary

| Area | Status | Notes |
|------|--------|-------|
| Hardcoded Stripe test keys | ✅ Clean | No `sk_test_`, `pk_test_`, or `whsec_` in app source |
| Hardcoded Supabase secrets | ✅ Clean | All Supabase config via env vars |
| Localhost fallbacks | ⚠️ Critical | `NEXT_PUBLIC_APP_URL` defaults to `http://localhost:3000` if unset — **must be set in Vercel** |
| Auth redirect URLs (signup / reset) | ✅ Good | Client uses `window.location.origin` → `/auth/callback` |
| Server-generated links (Stripe, invites, mock-test email) | ⚠️ Critical | Use `NEXT_PUBLIC_APP_URL` only — not browser origin |
| Stripe checkout + webhooks | ✅ Implemented | `/api/subscription/create-checkout`, `/api/stripe/webhook` |
| Report access | ✅ Server-enforced | Ownership + instructor pupil link + parent link checks in app code |
| Role redirects | ✅ Layout-based | No active Edge middleware; layouts gate `/dashboard`, `/instructor`, `/supervisor` |
| Graduate → cancel subscription | ✅ Implemented | `POST /api/learner/graduate` cancels Stripe + DB subscription |
| Console/debug in production | ⚠️ Review | Server `console.error`/`console.warn` used for ops logging; dev-only `console.info` for email links; webhook logs checkout events |
| OG / canonical domain | ⚠️ Verify | `metadataBase` is hardcoded to `https://passready.app` in `app/layout.tsx` |

### Do **not** set in production

| Variable | Reason |
|----------|--------|
| `SKIP_SUPABASE_REPORT_PERSIST=true` | Bypasses report DB writes |
| Test Stripe keys (`sk_test_…`, test `price_…`, test `whsec_…`) | Must match live mode end-to-end |

---

## 1. Required Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for **Production** (and Preview if you test PR deploys against staging Supabase/Stripe).

### Required (core app)

| Variable | Example / format | Used for |
|----------|------------------|----------|
| `NEXT_PUBLIC_APP_URL` | `https://passready.app` | Stripe success/cancel URLs, admin premium invite links, mock-test email deep links |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Auth + database (must end in `.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` (anon key) | Browser + SSR Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` (service role) | Server-side DB writes (reports, subscriptions, admin) |
| `STRIPE_SECRET_KEY` | `sk_live_…` | Checkout sessions, subscription cancel, admin promo creation |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (live endpoint) | `/api/stripe/webhook` signature verification |
| `STRIPE_PRICE_ID_SUBSCRIPTION` | `price_…` (live recurring price) | Learner £6.99/month subscription checkout |
| `ENTITLEMENT_TOKEN_SECRET` | Random string, min 16 chars | Signed lifetime/grandfathered finalise tokens |
| `OPENAI_API_KEY` | `sk-…` | AI report generation (falls back to deterministic copy if missing) |

### Required for specific features

| Variable | When required |
|----------|---------------|
| `ADMIN_ACCESS_KEY` | Admin dashboard (`/admin`) and `/api/admin/*` — use a long random secret; prefer header auth over query param |
| `RESEND_API_KEY` | Instructor mock-test report emails |
| `REPORT_ACCESS_FROM_EMAIL` | Verified sender in Resend (e.g. `Pass Pilot <noreply@yourdomain.com>`) |

### Optional / legacy

| Variable | Notes |
|----------|-------|
| `STRIPE_PRICE_ID_SINGLE` | Legacy one-off report tier |
| `STRIPE_PRICE_ID_LIFETIME` | Legacy lifetime tier |
| `STRIPE_PRICE_ID` | Deprecated fallback |
| `OPENAI_MODEL` | Defaults to `gpt-5.4-mini` |
| `REPORT_ACCESS_TOKEN_SECRET` | Only needed if legacy magic-link report access is re-enabled (currently unused) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Documented but **not read by app code** (checkout is server-redirect only) |

### Vercel project settings

- **Framework:** Next.js (see `vercel.json`)
- **Root directory:** `passready/` if the repo root is the monorepo wrapper
- **Node:** 20.x recommended (matches `@types/node`)
- **Build command:** `npm run build`
- **Install command:** `npm install`

---

## 2. Required Supabase settings

### Dashboard → Authentication → URL configuration

| Setting | Production value |
|---------|------------------|
| **Site URL** | `https://passready.app` (or your live origin) |
| **Redirect URLs** | `https://passready.app/auth/callback` |
| | `https://passready.app/auth/callback/**` (if your project requires wildcard query paths) |

Auth flows that land on `/auth/callback`:

- Email confirmation after signup → `?next=/verify-email?continue=…`
- Resend verification email
- Password reset → `?next=/reset-password`

### Dashboard → Authentication → Providers

- [ ] **Email** provider enabled
- [ ] **Confirm email** enabled for production (recommended)
- [ ] Customize email templates (optional): mention Pass Pilot / Prep2Pass branding

### Database migrations

Run all migrations in order in **Supabase → SQL Editor** (or via CLI):

| # | File | Purpose |
|---|------|---------|
| 003 | `003_auth_user_reports.sql` | Reports + RLS |
| 004 | `004_instructor_mock_tool.sql` | Instructor workspace |
| 005 | `005_learner_syllabus_topics.sql` | Syllabus topics |
| 006 | `006_parent_supervisor_module.sql` | Parent/supervisor module |
| 007 | `007_instructor_pupil_invitations.sql` | Pupil invites + notifications |
| 008 | `008_learner_mock_test_deliveries.sql` | Mock test deliveries |
| 009 | `009_weak_area_details.sql` | Weak area details |
| 010 | `010_commercial_model_v1.sql` | Subscriptions, referrals, graduate mode |
| 013 | `013_teaching_diagrams.sql` | Teaching diagrams |
| 014 | `014_admin_promo_invites.sql` | Admin promo codes + premium invites |

Skip dev-only seed migrations (`011_*`, `012_*`) unless promoting specific test accounts.

### Row Level Security (RLS)

- Reports: learners can SELECT own rows (`auth.uid() = user_id`)
- App server uses **service role** for most writes — application-layer checks are the primary control
- **Review before launch:** `user_app_profiles` allows broad authenticated access in migration 004; app assigns roles server-side, but tighten RLS if clients ever talk to Supabase directly

### Promote roles manually (if needed)

```sql
-- Instructor
INSERT INTO public.user_app_profiles (user_id, role)
VALUES ('<auth-user-uuid>', 'instructor')
ON CONFLICT (user_id) DO UPDATE SET role = 'instructor', updated_at = now();

-- Parent / supervisor
INSERT INTO public.user_app_profiles (user_id, role)
VALUES ('<auth-user-uuid>', 'parent')
ON CONFLICT (user_id) DO UPDATE SET role = 'parent', updated_at = now();
```

Learner and parent roles are normally set automatically from signup metadata on first email confirmation (`/auth/callback`).

---

## 3. Required Stripe live settings

### API keys & products

- [ ] Switch Dashboard to **Live mode**
- [ ] Create live **Product** + recurring **Price** for £6.99/month subscription
- [ ] Copy live `price_…` → `STRIPE_PRICE_ID_SUBSCRIPTION`
- [ ] Copy live **Secret key** → `STRIPE_SECRET_KEY` (`sk_live_…`)

### Webhook endpoint

Create a **live** webhook pointing to:

```
https://passready.app/api/stripe/webhook
```

**Events to subscribe:**

| Event | Handler purpose |
|-------|-----------------|
| `checkout.session.completed` | Subscription start, legacy one-off payments, lifetime entitlement |
| `invoice.paid` | Renewal sync + referral payouts |
| `customer.subscription.updated` | Status changes (active, past_due, etc.) |
| `customer.subscription.deleted` | Cancellation sync |

Copy the endpoint **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

> **Important:** Admin promo codes and premium invites create Stripe coupons/promotion codes at invite-creation time. Create admin invites **after** switching to live keys, or promos will only exist in test mode.

### Checkout redirect URLs (automatic)

The app builds URLs from `NEXT_PUBLIC_APP_URL`:

| Flow | Success URL pattern |
|------|---------------------|
| Subscription | `{APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&mode=subscription` |
| Assessment checkout | `{APP_URL}/checkout/success?session_id=…` |
| Cancel | `{APP_URL}/assessment`, `/subscribe`, or `/results` depending on flow |

### Customer portal (optional)

Not required for launch — subscription cancel on pass is handled by `POST /api/learner/graduate`.

---

## 4. Required Resend / domain email settings

Pass Pilot uses **Supabase Auth** for signup verification and password reset emails.

**Resend** is used only for **instructor mock-test report emails** (`/api/instructor/mock-tests/[id]/send`).

### Resend setup

- [ ] Add and verify your sending domain in Resend
- [ ] Set `REPORT_ACCESS_FROM_EMAIL` to a verified address (e.g. `Pass Pilot <noreply@passready.app>`)
- [ ] Set `RESEND_API_KEY` (`re_…`)

### Email content

Mock-test emails link to:

```
{NEXT_PUBLIC_APP_URL}/mock-tests/{deliveryId}
```

If Resend vars are missing in development, the link is logged to the server console instead of sending.

---

## 5. Required DNS / domain settings

Assuming production domain **`passready.app`** (matches `metadataBase` in `app/layout.tsx`). Adjust if using a different domain and update `metadataBase` accordingly.

### Vercel

- [ ] Add custom domain in Vercel project
- [ ] Point DNS A/CNAME records per Vercel instructions
- [ ] Enable automatic HTTPS
- [ ] Set `NEXT_PUBLIC_APP_URL=https://passready.app` (no trailing slash)

### Resend (if sending from `@passready.app`)

- [ ] Add DNS records (SPF, DKIM, optional DMARC) Resend provides for the domain

### Supabase custom SMTP (optional)

Default Supabase transactional email is fine for MVP. For branded auth emails, configure **Authentication → SMTP** with your domain.

### Open Graph / social previews

- [ ] Confirm `metadataBase` (`app/layout.tsx`) matches live domain
- [ ] Verify `/social-banner/og.png` renders correctly when sharing homepage

---

## 6. Full test checklist

Run these on the **production URL** after deploy, using fresh test accounts where possible.

### Global / auth

- [ ] Homepage loads over HTTPS
- [ ] `/welcome` role selection works (Learner / Instructor / Parent)
- [ ] Signup sends verification email; link opens `/auth/callback` then `/verify-email`
- [ ] Unverified users cannot access protected learner APIs
- [ ] Login with wrong password shows friendly error (not raw “Failed to fetch”)
- [ ] Forgot password email arrives; link → `/auth/callback` → `/reset-password` → new password works
- [ ] `/auth/resume` routes verified users to correct role home
- [ ] Role mismatch (e.g. login as instructor with learner intent) signs out with `role_mismatch` error
- [ ] `/api/auth/me` returns session + access flags when signed in

### Learner journey

- [ ] Complete assessment at `/assessment` (unauthenticated or pre-subscribe flow as designed)
- [ ] Subscribe at `/subscribe` → Stripe Checkout (live) → return to `/subscribe/success`
- [ ] Webhook fires: `user_subscriptions` row created/updated in Supabase
- [ ] Report finalises after checkout (`/api/reports/finalise` or results flow)
- [ ] View report at `/reports/[id]` — only owner can access
- [ ] `/dashboard` shows latest score; non-learners redirected away
- [ ] `/progress` and `/my-reports` load for subscribed learner
- [ ] `/api/assessment/score` blocked after recording pass (graduate mode)
- [ ] **Graduate mode:** `/graduate` → record pass date → subscription cancelled in Stripe + DB
- [ ] After graduate: reports still readable; new assessments blocked
- [ ] `/account` subscription status reflects canceled / graduate state

### Instructor journey

- [ ] Signup as instructor → lands on `/instructor`
- [ ] Non-instructors cannot access `/instructor/*` (redirected)
- [ ] Add pupil via `/instructor/pupils` — existing learner gets in-app notification
- [ ] Learner accepts invite via notification → instructor sees linked pupil
- [ ] **New learner invite:** signup with `?invite=<token>` auto-links after email confirm
- [ ] Create mock test at `/instructor/mock-test/new`
- [ ] Send mock test to pupil — in-app delivery + email (if Resend configured)
- [ ] Email link opens `/mock-tests/[id]` for the learner
- [ ] Instructor can view pupil report at `/instructor/pupils/[pupilId]/reports/[reportId]`
- [ ] Diagram library loads at `/instructor/diagrams`

### Parent / supervisor journey

- [ ] Signup as parent → lands on `/supervisor`
- [ ] Link learner at `/supervisor/link-learner` (learner must have account + reports)
- [ ] View linked learner reports at `/supervisor/reports` and `/supervisor/reports/[id]`
- [ ] Cannot access `/dashboard` as primary home (redirected to supervisor)
- [ ] Practice log at `/supervisor/practice-log` saves entries
- [ ] Parent cannot start assessments (`hasPremiumAccess: false` for parent role)

### Admin / premium invites (if used)

- [ ] `/admin` prompts for access key; invalid key rejected
- [ ] Create promo code — appears in Stripe (live) and admin list
- [ ] Create premium invite — link format `{APP_URL}/invite/premium/{token}`
- [ ] New user opens invite → signup with locked email → subscribe with discount
- [ ] Webhook marks invite redeemed after successful checkout
- [ ] Prefer `x-admin-access-key` header over `?admin_key=` query param (avoids log/referrer leakage)

### Stripe / webhook sanity

- [ ] Stripe Dashboard → Webhooks shows successful deliveries for test checkout
- [ ] `checkout.session.completed` updates subscription row
- [ ] Cancel subscription in Stripe Dashboard → app reflects `canceled` status
- [ ] Graduate flow cancels subscription even if webhook delayed

### Security spot checks

- [ ] Cannot read another user's report by guessing UUID (`/reports/[id]`)
- [ ] Instructor cannot view unlinked pupil reports
- [ ] Parent cannot view unlinked learner reports
- [ ] Deprecated routes return 410/403: `/api/reports/access`, `/api/reports/lookup`
- [ ] No secrets in client bundle (check built JS for `sk_`, service role key)

---

## Build & CI verification (local / pre-push)

```bash
cd passready
npm run lint          # warnings only (hook deps)
npx tsc --noEmit      # typecheck
npm run build         # production build
```

Expected: exit code 0 for all three.

---

## Known non-blocking items (document, do not block launch)

These are product/security improvements, not deployment misconfigurations:

1. **No Edge middleware** — auth enforced per layout/API instead of global middleware (`middleware.disabled.ts` exists but is not active).
2. **Parent auto-link** — linking by learner email grants report access without learner consent (unlike instructor invites).
3. **Graduated users** — `canStartAssessment` is enforced on scoring API but checkout/finalise paths may still allow edge cases for grandfathered premium users.
4. **`pending_premium_invite_token`** — stored in signup metadata but premium invite flow relies on URL param through subscribe (keep invite URL intact).
5. **Instructor invite signup URL** — helper exists in code but is not surfaced in instructor UI (notifications + manual signup link only).
6. **Admin UI at `/admin`** — page is public; APIs are key-gated. Replace with real admin auth before wider exposure.
7. **Server logging** — `console.error`/`console.warn` in API routes is intentional for Vercel logs; not debug noise. Webhook logs checkout session IDs on success.

---

## Quick go-live order

1. Run Supabase migrations `003`–`010`, `013`, `014`
2. Configure Supabase Auth URLs + email confirmation
3. Create Stripe live product/price + webhook
4. Verify Resend domain (if using mock-test emails)
5. Set all Vercel env vars (**especially `NEXT_PUBLIC_APP_URL`**)
6. Deploy to Vercel; attach custom domain + HTTPS
7. Run section 6 test checklist on production
8. Monitor Vercel logs + Stripe webhook deliveries for first real signups

---

## Reference: env template

See `.env.example` in this directory for a local development template. Never commit `.env.local` or live secrets to git.
