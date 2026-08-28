-- =====================================================
-- Membership System Tables
-- =====================================================

-- Bảng catalog gói membership
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  description   text,
  price         integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  features      jsonb NOT NULL DEFAULT '[]',
  is_active     boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public xem gói active"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role quản lý plans"
  ON public.membership_plans FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================

-- Bảng subscription của user
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id     text NOT NULL REFERENCES public.membership_plans(id),
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sub_user_id_idx    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS sub_status_idx     ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS sub_expires_at_idx ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS sub_user_active_idx
  ON public.subscriptions(user_id, status, expires_at)
  WHERE status = 'active';

CREATE TRIGGER handle_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User xem subscription của mình"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role quản lý subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================

-- Bảng lịch sử thanh toán
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text NOT NULL,
  plan_id         text REFERENCES public.membership_plans(id),
  order_code      bigint UNIQUE NOT NULL,
  amount          integer NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  subscription_id uuid REFERENCES public.subscriptions(id),
  webhook_data    jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pt_order_code_idx ON public.payment_transactions(order_code);
CREATE INDEX IF NOT EXISTS pt_user_id_idx    ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS pt_status_idx     ON public.payment_transactions(status, created_at DESC);

CREATE TRIGGER handle_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User xem giao dịch của mình"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role quản lý transactions"
  ON public.payment_transactions FOR ALL
  USING (auth.role() = 'service_role');
