# 🛍️ 代購管理系統

Vue 3 + Vite + Supabase 代購訂單追蹤平台

---

## 功能

- **商品管理**：新增/編輯/刪除商品，記錄進貨成本與庫存數量
- **買家管理**：記錄買家資料，自動顯示消費總額與待付款金額
- **訂單管理**：為每位買家自訂售價，追蹤訂單狀態（待付款→已付款→已出貨→完成）
- **帳務統計**：整體利潤、待收款金額、買家帳務一覽、商品銷售排行

---

## 安裝步驟

### 1. 設定 Supabase

1. 前往 [supabase.com](https://supabase.com) 建立免費專案
2. 進入 **SQL Editor**，貼上 `supabase-schema.sql` 內容並執行
3. 進入 **Project Settings > API**，複製：
   - `Project URL`
   - `anon public` key

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`：
```
VITE_SUPABASE_URL=https://你的專案id.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon-key
```

### 3. 安裝與啟動

```bash
npm install
npm run dev
```

瀏覽器開啟 `http://localhost:5173` 即可使用

### 4. 部署上線（可選）

```bash
npm run build
```

產出的 `dist/` 資料夾可部署到 Vercel、Netlify、Cloudflare Pages 等平台（免費）

---

## 資料庫結構

| 資料表 | 說明 |
|--------|------|
| `products` | 商品、進貨成本、庫存 |
| `buyers` | 買家資料 |
| `orders` | 訂單，包含買家專屬售價與狀態 |
