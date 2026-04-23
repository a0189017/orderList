-- =============================================
-- 代購管理系統 - Supabase 資料庫 Schema
-- =============================================
-- 請在 Supabase Dashboard > SQL Editor 執行此檔案

-- 1. 商品資料表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 買家資料表
CREATE TABLE IF NOT EXISTS buyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 訂單資料表
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sell_price DECIMAL(10,2) NOT NULL,   -- 對此買家的自訂售價（單價）
  cost_price DECIMAL(10,2) NOT NULL,   -- 進貨成本（下單時快照）
  status TEXT NOT NULL DEFAULT '待付款'
    CHECK (status IN ('待付款', '已付款', '已出貨', '完成', '取消')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 自動更新 updated_at 欄位的 Trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON buyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) 設定
-- 草創初期先開放全部，之後可搭配 auth 再收緊
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_buyers" ON buyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 範例資料（可選）
-- =============================================
-- INSERT INTO products (name, description, cost_price, stock_quantity)
-- VALUES
--   ('Nike Air Max 90', 'US 10號, 黑色', 3200, 5),
--   ('Supreme Box Logo Tee', 'L號, 白色', 1800, 3);

-- INSERT INTO buyers (name, contact, notes)
-- VALUES
--   ('小明', 'Line: xiao_ming', 'VIP 老客戶'),
--   ('小花', 'IG: xiaohua_tw', '');
