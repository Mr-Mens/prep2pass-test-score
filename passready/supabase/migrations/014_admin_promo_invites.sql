-- Admin promo codes and premium learner invite links (service-role access only).

CREATE TABLE IF NOT EXISTS public.admin_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text,
  discount_percent integer NOT NULL CHECK (discount_percent IN (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)),
  stripe_coupon_id text NOT NULL,
  stripe_promotion_code_id text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  max_redemptions integer CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  times_redeemed integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_promo_codes_code_lower_idx
  ON public.admin_promo_codes (lower(code));

CREATE INDEX IF NOT EXISTS admin_promo_codes_active_idx
  ON public.admin_promo_codes (active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_premium_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  pupil_email text NOT NULL,
  promo_code_id uuid REFERENCES public.admin_promo_codes (id) ON DELETE SET NULL,
  discount_percent integer NOT NULL CHECK (discount_percent IN (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'redeemed', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  redeemed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_premium_invites_token_idx
  ON public.admin_premium_invites (token);

CREATE INDEX IF NOT EXISTS admin_premium_invites_email_idx
  ON public.admin_premium_invites (lower(pupil_email));

CREATE INDEX IF NOT EXISTS admin_premium_invites_status_idx
  ON public.admin_premium_invites (status, created_at DESC);
