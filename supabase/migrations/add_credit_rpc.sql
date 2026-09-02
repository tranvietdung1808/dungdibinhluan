-- =====================================================
-- Credit System — Hardening
-- 1) Unique index chống double-processing topup (idempotency)
-- 2) Unique index mod_access(user_id, mod_id) chống double-charge
-- 3) RPC atomic: credit_add / credit_deduct / credit_fulfill_topup
--    - Chống race condition khi cộng/trừ credit
--    - Webhook claim + cộng credit trong 1 DB transaction (không partial state)
--    - Chỉ service_role được gọi (không cho client tự cộng credit)
-- =====================================================

-- =====================================================
-- 1. Idempotency: mỗi order nạp chỉ được ghi 1 transaction 'payment'
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_payment_unique
  ON public.credit_transactions(reference_type, reference_id)
  WHERE reference_type = 'payment' AND reference_id IS NOT NULL;

-- =====================================================
-- 2. Mỗi user chỉ mở khóa 1 mod 1 lần
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS mod_access_user_mod_unique
  ON public.mod_access(user_id, mod_id);

-- =====================================================
-- 3a. credit_add — cộng credit ATOMIC (topup/bonus/refund)
--     Ghi transaction trước, cập nhật ví trong cùng transaction.
--     Nếu trùng reference (payment) → unique violation → rollback toàn bộ.
-- =====================================================
CREATE OR REPLACE FUNCTION public.credit_add(
  p_user_id uuid,
  p_amount integer,
  p_ref_type text DEFAULT NULL,
  p_ref_id text DEFAULT NULL,
  p_desc text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'AMOUNT_INVALID';
  END IF;

  -- Tạo ví nếu chưa tồn tại (an toàn khi nhiều request đồng thời)
  INSERT INTO public.credit_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_wallets
     SET balance = balance + p_amount,
         total_earned = total_earned + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id
   RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  VALUES
    (p_user_id, 'topup', p_amount, v_balance, p_ref_type, p_ref_id, p_desc);

  RETURN v_balance;
END;
$$;

-- =====================================================
-- 3b. credit_deduct — trừ credit ATOMIC với kiểm tra đủ số dư
--     WHERE balance >= p_amount chống double-spend khi concurrent.
-- =====================================================
CREATE OR REPLACE FUNCTION public.credit_deduct(
  p_user_id uuid,
  p_amount integer,
  p_ref_type text DEFAULT NULL,
  p_ref_id text DEFAULT NULL,
  p_desc text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'AMOUNT_INVALID';
  END IF;

  UPDATE public.credit_wallets
     SET balance = balance - p_amount,
         total_spent = total_spent + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND balance >= p_amount
   RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDIT';
  END IF;

  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, reference_type, reference_id, description)
  VALUES
    (p_user_id, 'spend', -p_amount, v_balance, p_ref_type, p_ref_id, p_desc);

  RETURN v_balance;
END;
$$;

-- =====================================================
-- 3c. credit_fulfill_topup — xử lý webhook ATOMIC
--     Claim order (status pending → paid) + cộng credit trong 1 transaction.
--     Retry của PayOS sẽ thấy order đã paid → return false, không cộng đúp.
-- =====================================================
CREATE OR REPLACE FUNCTION public.credit_fulfill_topup(
  p_order_id uuid,
  p_webhook_data jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.credit_topup_orders%ROWTYPE;
  v_balance integer;
BEGIN
  -- Atomic claim: lock row order tới hết transaction
  UPDATE public.credit_topup_orders
     SET status = 'paid',
         paid_at = now(),
         webhook_data = COALESCE(p_webhook_data, webhook_data),
         updated_at = now()
   WHERE id = p_order_id AND status = 'pending'
   RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN false; -- đã xử lý trước đó (hoặc không tồn tại)
  END IF;

  -- Cộng credit + ghi transaction trong cùng transaction (không partial state)
  IF v_order.user_id IS NOT NULL THEN
    INSERT INTO public.credit_wallets (user_id)
    VALUES (v_order.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.credit_wallets
       SET balance = balance + v_order.credit_total,
           total_earned = total_earned + v_order.credit_total,
           updated_at = now()
     WHERE user_id = v_order.user_id
     RETURNING balance INTO v_balance;

    INSERT INTO public.credit_transactions
      (user_id, type, amount, balance_after, reference_type, reference_id, description)
    VALUES
      (v_order.user_id, 'topup', v_order.credit_total, v_balance, 'payment',
       v_order.order_code::text,
       'Nạp ' || v_order.credit_total || ' credit (từ đơn #' || v_order.order_code || ')');

    -- Gán transaction_id cho order
    UPDATE public.credit_topup_orders o
       SET transaction_id = t.id
      FROM public.credit_transactions t
     WHERE t.reference_type = 'payment'
       AND t.reference_id = o.order_code::text
       AND o.id = v_order.id;
  END IF;

  RETURN true;
END;
$$;

-- =====================================================
-- 4. Chỉ service_role được gọi RPC (client không tự cộng credit được)
-- =====================================================
REVOKE ALL ON FUNCTION public.credit_add(uuid, integer, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_deduct(uuid, integer, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_fulfill_topup(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_add(uuid, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_deduct(uuid, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_fulfill_topup(uuid, jsonb) TO service_role;
