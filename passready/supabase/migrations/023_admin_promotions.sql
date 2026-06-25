-- Extend admin promo codes into a generic promotion system (discount + trial extension).
-- Run after 014_admin_promo_invites.sql.

ALTER TABLE public.admin_promo_codes
  ADD COLUMN IF NOT EXISTS promotion_type text NOT NULL DEFAULT 'discount',
  ADD COLUMN IF NOT EXISTS trial_days integer,
  ADD COLUMN IF NOT EXISTS campaign_name text,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.admin_promo_codes
SET campaign_name = label
WHERE campaign_name IS NULL AND label IS NOT NULL;

UPDATE public.admin_promo_codes
SET promotion_type = 'discount'
WHERE promotion_type IS NULL OR promotion_type = '';

ALTER TABLE public.admin_promo_codes
  DROP CONSTRAINT IF EXISTS admin_promo_codes_discount_percent_check;

ALTER TABLE public.admin_promo_codes
  ALTER COLUMN discount_percent DROP NOT NULL,
  ALTER COLUMN stripe_coupon_id DROP NOT NULL,
  ALTER COLUMN stripe_promotion_code_id DROP NOT NULL;

ALTER TABLE public.admin_promo_codes
  DROP CONSTRAINT IF EXISTS admin_promo_codes_promotion_type_check;

ALTER TABLE public.admin_promo_codes
  ADD CONSTRAINT admin_promo_codes_promotion_type_check
    CHECK (promotion_type IN ('discount', 'trial_extension'));

ALTER TABLE public.admin_promo_codes
  DROP CONSTRAINT IF EXISTS admin_promo_codes_type_fields_check;

ALTER TABLE public.admin_promo_codes
  ADD CONSTRAINT admin_promo_codes_type_fields_check CHECK (
    (
      promotion_type = 'discount'
      AND discount_percent IS NOT NULL
      AND discount_percent IN (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)
      AND trial_days IS NULL
      AND stripe_coupon_id IS NOT NULL
      AND stripe_promotion_code_id IS NOT NULL
    )
    OR (
      promotion_type = 'trial_extension'
      AND trial_days IS NOT NULL
      AND trial_days > 0
      AND trial_days <= 365
      AND discount_percent IS NULL
      AND stripe_coupon_id IS NULL
      AND stripe_promotion_code_id IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS admin_promo_codes_promotion_type_idx
  ON public.admin_promo_codes (promotion_type, active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.admin_promo_codes (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  promotion_type text NOT NULL CHECK (promotion_type IN ('discount', 'trial_extension')),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  converted_to_paid_at timestamptz,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_promotion_redemptions_promo_user_idx
  ON public.admin_promotion_redemptions (promo_code_id, user_id);

CREATE INDEX IF NOT EXISTS admin_promotion_redemptions_promo_idx
  ON public.admin_promotion_redemptions (promo_code_id, redeemed_at DESC);

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS admin_promo_code_id uuid REFERENCES public.admin_promo_codes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_subscriptions_admin_promo_idx
  ON public.user_subscriptions (admin_promo_code_id)
  WHERE admin_promo_code_id IS NOT NULL;
