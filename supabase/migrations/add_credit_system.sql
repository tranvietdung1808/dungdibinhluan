-- =====================================================
-- Credit System — Hệ thống credit
-- Gồm: ví credit, lịch sử giao dịch, đơn nạp tiền, giá mở khóa mod
-- Lưu ý: PostgreSQL không hỗ trợ CREATE TRIGGER / CREATE POLICY
-- với IF NOT EXISTS, nên dùng DO block kiểm tra pg_trigger
-- và DROP POLICY IF EXISTS để đảm bảo idempotent.
-- =====================================================

-- =====================================================
-- 1. credit_wallets — Ví credit của user
-- =====================================================
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance      integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned integer NOT NULL DEFAULT 0,
  total_spent  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Trigger tự cập nhật updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_credit_wallets_updated_at') THEN
    CREATE TRIGGER handle_credit_wallets_updated_at
      BEFORE UPDATE ON public.credit_wallets
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS: user chỉ xem được ví của mình, service role quản lý toàn quyền
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User xem ví của mình" ON public.credit_wallets;
CREATE POLICY "User xem ví của mình"
  ON public.credit_wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role quản lý credit_wallets" ON public.credit_wallets;
CREATE POLICY "Service role quản lý credit_wallets"
  ON public.credit_wallets FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 2. credit_transactions — Lịch sử giao dịch credit (audit log)
--    amount dương = cộng credit, âm = trừ credit
-- =====================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text NOT NULL
                   CHECK (type IN ('topup', 'spend', 'refund', 'bonus', 'admin_grant', 'admin_deduct')),
  amount         integer NOT NULL, -- dương = cộng credit, âm = trừ credit
  balance_after  integer,
  reference_type text,
  reference_id   text,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index phục vụ truy vấn nhanh
CREATE INDEX IF NOT EXISTS credit_transactions_user_created_idx
  ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_transactions_type_created_idx
  ON public.credit_transactions(type, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_transactions_reference_idx
  ON public.credit_transactions(reference_type, reference_id);

-- RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User xem giao dịch của mình" ON public.credit_transactions;
CREATE POLICY "User xem giao dịch của mình"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role quản lý credit_transactions" ON public.credit_transactions;
CREATE POLICY "Service role quản lý credit_transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 3. credit_topup_orders — Đơn nạp tiền
-- =====================================================
CREATE TABLE IF NOT EXISTS public.credit_topup_orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email          text NOT NULL,
  order_code     bigint UNIQUE NOT NULL,
  amount_vnd     integer NOT NULL CHECK (amount_vnd >= 50000),
  credit_base    integer NOT NULL,
  credit_bonus   integer NOT NULL DEFAULT 0,
  credit_total   integer NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'cancelled', 'failed', 'expired')),
  payment_link   text,
  transaction_id uuid REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  webhook_data   jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  paid_at        timestamptz
);

-- Index phục vụ truy vấn nhanh
CREATE INDEX IF NOT EXISTS credit_topup_orders_user_created_idx
  ON public.credit_topup_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_topup_orders_status_created_idx
  ON public.credit_topup_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_topup_orders_order_code_idx
  ON public.credit_topup_orders(order_code);

-- Trigger tự cập nhật updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_credit_topup_orders_updated_at') THEN
    CREATE TRIGGER handle_credit_topup_orders_updated_at
      BEFORE UPDATE ON public.credit_topup_orders
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.credit_topup_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User xem đơn nạp của mình" ON public.credit_topup_orders;
CREATE POLICY "User xem đơn nạp của mình"
  ON public.credit_topup_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role quản lý credit_topup_orders" ON public.credit_topup_orders;
CREATE POLICY "Service role quản lý credit_topup_orders"
  ON public.credit_topup_orders FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 4. mod_unlock_prices — Giá mở khóa mod (tính bằng credit)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mod_unlock_prices (
  mod_id      uuid PRIMARY KEY REFERENCES public.mods(id) ON DELETE CASCADE,
  credit_cost integer NOT NULL CHECK (credit_cost > 0),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger tự cập nhật updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_mod_unlock_prices_updated_at') THEN
    CREATE TRIGGER handle_mod_unlock_prices_updated_at
      BEFORE UPDATE ON public.mod_unlock_prices
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS: ai cũng xem được giá, chỉ service role quản lý
ALTER TABLE public.mod_unlock_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public xem giá mod" ON public.mod_unlock_prices;
CREATE POLICY "Public xem giá mod"
  ON public.mod_unlock_prices FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role quản lý mod_unlock_prices" ON public.mod_unlock_prices;
CREATE POLICY "Service role quản lý mod_unlock_prices"
  ON public.mod_unlock_prices FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Tự động tạo ví credit khi user mới đăng ký
-- SECURITY DEFINER để vượt RLS khi insert vào credit_wallets
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_credit_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_credit_wallet') THEN
    CREATE TRIGGER on_auth_user_created_credit_wallet
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_credit_wallet();
  END IF;
END $$;
