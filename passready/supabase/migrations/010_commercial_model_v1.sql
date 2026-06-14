-- V1 commercial model: learner subscriptions, instructor referrals, graduate mode.
-- Run in Supabase SQL Editor after migration 009.

-- Learner monthly subscription (Stripe-managed).
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx
  ON public.user_subscriptions (status);

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_stripe_sub_idx
  ON public.user_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Graduate mode: learner passed practical test — retain account, stop billing, no new assessments.
CREATE TABLE IF NOT EXISTS public.learner_graduations (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  pass_date date NOT NULL,
  certificate_storage_path text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Instructor referral tracking (payout execution comes later).
CREATE TABLE IF NOT EXISTS public.instructor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  pupil_link_id uuid REFERENCES public.instructor_pupils (id) ON DELETE SET NULL,
  pupil_email text NOT NULL,
  referral_date timestamptz NOT NULL DEFAULT now(),
  referral_status text NOT NULL DEFAULT 'pending'
    CHECK (referral_status IN ('pending', 'linked', 'active', 'passed', 'expired')),
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS instructor_referrals_instructor_email_idx
  ON public.instructor_referrals (instructor_id, lower(trim(pupil_email)));

CREATE INDEX IF NOT EXISTS instructor_referrals_instructor_idx
  ON public.instructor_referrals (instructor_id, referral_status);

CREATE INDEX IF NOT EXISTS instructor_referrals_pupil_idx
  ON public.instructor_referrals (pupil_id)
  WHERE pupil_id IS NOT NULL;

-- Referral earnings ledger (status coming_soon until payouts ship).
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.instructor_referrals (id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  payout_type text NOT NULL CHECK (payout_type IN ('signup_bonus', 'monthly_commission')),
  amount_pence integer NOT NULL CHECK (amount_pence > 0),
  month_number integer CHECK (month_number IS NULL OR (month_number >= 1 AND month_number <= 12)),
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'coming_soon'
    CHECK (status IN ('pending', 'coming_soon', 'paid', 'void')),
  stripe_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_payouts_signup_once_idx
  ON public.referral_payouts (referral_id)
  WHERE payout_type = 'signup_bonus';

CREATE UNIQUE INDEX IF NOT EXISTS referral_payouts_monthly_idx
  ON public.referral_payouts (referral_id, month_number)
  WHERE payout_type = 'monthly_commission' AND month_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS referral_payouts_instructor_idx
  ON public.referral_payouts (instructor_id);

-- Tokenised invite links for signup auto-link (optional on existing pupil rows).
ALTER TABLE public.instructor_pupils
  ADD COLUMN IF NOT EXISTS invite_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS instructor_pupils_invite_token_idx
  ON public.instructor_pupils (invite_token);
