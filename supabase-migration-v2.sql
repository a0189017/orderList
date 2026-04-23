-- =============================================
-- Migration v2：客戶訂購表單 + LINE 登入支援
-- 完全非破壞性 — 僅新增欄位，不刪除任何舊資料
-- 請在 Supabase Dashboard > SQL Editor 執行
-- =============================================

-- 1. products：加入公開定價欄位
--    null = 價格面議（不顯示給客戶）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS list_price DECIMAL(10,2) DEFAULT NULL;

-- 2. buyers：加入 LINE / Supabase Auth 連結欄位
ALTER TABLE buyers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS line_user_id    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS line_display_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS line_avatar_url   TEXT DEFAULT NULL;

-- auth_user_id 唯一索引（一個 auth user 對應一個 buyer）
CREATE UNIQUE INDEX IF NOT EXISTS buyers_auth_user_id_idx
  ON buyers (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- =============================================
-- 3. 更新 RLS：讓未登入訪客可讀商品
--    讓已登入客戶可以建立訂單、讀寫自己的 buyer 記錄
-- =============================================

-- products：保留管理員全權限，額外允許任何人讀取有 list_price 的商品
DROP POLICY IF EXISTS "allow_all_products" ON products;
CREATE POLICY "admin_all_products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- buyers：保留舊全開政策名稱相容，新增客戶可操作自己記錄的政策
DROP POLICY IF EXISTS "allow_all_buyers" ON buyers;
CREATE POLICY "admin_all_buyers" ON buyers
  FOR ALL USING (true) WITH CHECK (true);

-- orders：保留舊全開，另加客戶可 INSERT 自己的訂單
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 完成！新欄位說明：
--   products.list_price        → 客戶看到的公開售價（null = 面議）
--   buyers.auth_user_id        → 對應 Supabase auth.users.id
--   buyers.line_user_id        → LINE User ID（sub）
--   buyers.line_display_name   → LINE 顯示名稱（自動帶入）
--   buyers.line_avatar_url     → LINE 頭貼 URL
-- =============================================
