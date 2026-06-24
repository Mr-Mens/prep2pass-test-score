-- Phase 1 instructor referral commission system (15% recurring, manual payouts).

-- Extend instructor_referrals for invite tokens and lifecycle timestamps.
ALTER TABLE public.instructor_referrals
  ADD COLUMN IF NOT EXISTS invite_token uuid,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

UPDATE public.instructor_referrals r
SET invite_token = p.invite_token
FROM public.instructor_pupils p
WHERE r.pupil_link_id = p.id
  AND r.invite_token IS NULL;

-- Drop old status check before renaming values (010 allowed linked/passed, not accepted/graduated).
ALTER TABLE public.instructor_referrals
  DROP CONSTRAINT IF EXISTS instructor_referrals_referral_status_check;

UPDATE public.instructor_referrals
SET referral_status = 'accepted'
WHERE referral_status = 'linked';

UPDATE public.instructor_referrals
SET referral_status = 'graduated'
WHERE referral_status = 'passed';

UPDATE public.instructor_referrals
SET accepted_at = updated_at
WHERE referral_status IN ('accepted', 'active', 'graduated', 'cancelled')
  AND accepted_at IS NULL;

UPDATE public.instructor_referrals
SET activated_at = converted_at
WHERE referral_status IN ('active', 'graduated')
  AND activated_at IS NULL
  AND converted_at IS NOT NULL;

ALTER TABLE public.instructor_referrals
  ADD CONSTRAINT instructor_referrals_referral_status_check
  CHECK (referral_status IN ('pending', 'accepted', 'active', 'cancelled', 'graduated', 'expired'));

CREATE UNIQUE INDEX IF NOT EXISTS instructor_referrals_invite_token_idx
  ON public.instructor_referrals (invite_token)
  WHERE invite_token IS NOT NULL;

-- Manual payout requests from instructors.
CREATE TABLE IF NOT EXISTS public.instructor_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'paid', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_payout_requests_instructor_idx
  ON public.instructor_payout_requests (instructor_id, status, requested_at DESC);

-- 15% recurring commission ledger (created from Stripe invoice.payment_succeeded).
CREATE TABLE IF NOT EXISTS public.instructor_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.instructor_referrals (id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL,
  stripe_subscription_id text,
  gross_amount integer NOT NULL CHECK (gross_amount >= 0),
  currency text NOT NULL DEFAULT 'gbp',
  commission_rate numeric(5, 4) NOT NULL DEFAULT 0.15,
  commission_amount integer NOT NULL CHECK (commission_amount >= 0),
  status text NOT NULL DEFAULT 'eligible'
    CHECK (status IN ('pending', 'eligible', 'paid', 'void')),
  payout_request_id uuid REFERENCES public.instructor_payout_requests (id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS instructor_commissions_stripe_invoice_idx
  ON public.instructor_commissions (stripe_invoice_id);

CREATE INDEX IF NOT EXISTS instructor_commissions_instructor_idx
  ON public.instructor_commissions (instructor_id, status, earned_at DESC);

CREATE INDEX IF NOT EXISTS instructor_commissions_referral_idx
  ON public.instructor_commissions (referral_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS instructor_commissions_payout_request_idx
  ON public.instructor_commissions (payout_request_id)
  WHERE payout_request_id IS NOT NULL;

-- RLS: instructors can read their own commercial rows; writes stay service-role only.
ALTER TABLE public.instructor_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instructor_referrals_select_own ON public.instructor_referrals;
CREATE POLICY instructor_referrals_select_own
  ON public.instructor_referrals
  FOR SELECT
  USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS instructor_commissions_select_own ON public.instructor_commissions;
CREATE POLICY instructor_commissions_select_own
  ON public.instructor_commissions
  FOR SELECT
  USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS instructor_payout_requests_select_own ON public.instructor_payout_requests;
CREATE POLICY instructor_payout_requests_select_own
  ON public.instructor_payout_requests
  FOR SELECT
  USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS instructor_payout_requests_insert_own ON public.instructor_payout_requests;
CREATE POLICY instructor_payout_requests_insert_own
  ON public.instructor_payout_requests
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);
