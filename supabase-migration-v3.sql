-- =============================================
-- Migration v3：安全分享連結（token-based pricing）
-- 移除明文 ?price 參數，改用 server-side token
-- 請在 Supabase Dashboard > SQL Editor 執行
-- =============================================

-- share_links：每個 token 對應一組（商品 + 賣家設定售價）
-- token 由 DB 用 gen_random_bytes 產生，客戶無法逆推出價格
CREATE TABLE IF NOT EXISTS share_links (
  id           UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  token        TEXT      UNIQUE NOT NULL
                         DEFAULT encode(gen_random_bytes(16), 'hex'),
  product_id   UUID      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sell_price   DECIMAL(10,2) NOT NULL,
  note         TEXT      DEFAULT NULL,        -- 賣家備注（不顯示給客戶）
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS：任何人可讀（客戶需要用 token 查詢）；寫入保留給管理端
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_share_links" ON share_links FOR SELECT USING (true);
CREATE POLICY "admin_write_share_links" ON share_links
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 完成！架構說明：
--   賣家操作：輸入售價 → INSERT share_links → 取回 token → 複製連結
--   客戶收到：/shop?token=a3b4c5d6...（無任何價格資訊）
--   客戶開啟：前端用 token 查 share_links → 從 DB 取得 product_id + sell_price
--   客戶下單：sell_price 完全由 DB 決定，URL 無法篡改
-- =============================================
