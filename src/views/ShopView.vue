<template>
  <div class="shop-page">
    <!-- ── Header ── -->
    <header class="shop-header">
      <div class="shop-header-inner">
        <div class="shop-brand">
          <span class="shop-logo">🛍️</span>
          <span class="shop-name">まるこ 代購選物🌸</span>
        </div>
        <div v-if="loggedIn && buyer" class="user-info">
          <img v-if="buyer.line_avatar_url" :src="buyer.line_avatar_url" class="user-avatar" />
          <div v-else class="user-avatar-placeholder">{{ (buyer.name || '?')[0] }}</div>
          <span class="user-name">{{ buyer.name }}</span>
          <button class="btn-logout" @click="logout">登出</button>
        </div>
      </div>
    </header>

    <div class="shop-body">

      <!-- LIFF 初始化中 -->
      <div v-if="loading" class="center-box">
        <div class="spinner"></div>
        <p>載入中...</p>
      </div>

      <!-- LIFF 設定錯誤（開發期間才會出現） -->
      <div v-else-if="initError" class="center-box">
        <div style="font-size:40px;margin-bottom:12px">⚙️</div>
        <p style="color:#ef4444;font-weight:600;text-align:center">{{ initError }}</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px">請確認 .env 中的 VITE_LIFF_ID 已正確設定</p>
      </div>

      <!-- token 無效 -->
      <div v-else-if="tokenError" class="center-box">
        <div style="font-size:48px;margin-bottom:12px">❌</div>
        <p style="color:#ef4444;font-weight:600">{{ tokenError }}</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px">請向賣家索取有效的訂購連結</p>
      </div>

      <!-- 未登入 -->
      <div v-else-if="!loggedIn" class="login-box">
        <div class="login-card">
          <div class="login-icon">🛍️</div>
          <h2 class="login-title">まるこ 代購選物🌸</h2>
          <p class="login-desc">請先使用 LINE 帳號登入，即可查看商品並完成訂購</p>
          <button class="btn-line" @click="login">
            <svg class="line-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            使用 LINE 帳號登入
          </button>
          <p class="login-note">如果你是從 LINE 開啟此頁面，應會自動登入</p>
        </div>
      </div>

      <!-- 已登入 但 buyer 同步失敗 -->
      <div v-else-if="loggedIn && buyerError" class="center-box">
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <p style="color:#ef4444;font-weight:600;text-align:center">{{ buyerError }}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:8px;text-align:center">
          請確認 Supabase migration v2 已執行，且 buyers 資料表有 line_user_id 欄位
        </p>
        <button style="margin-top:16px;padding:8px 20px;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;" @click="logout">重新登入</button>
      </div>

      <!-- 已登入 但 buyer 還在建立中 -->
      <div v-else-if="loggedIn && !buyer" class="center-box">
        <div class="spinner"></div>
        <p>正在建立你的帳號...</p>
      </div>

      <!-- 已登入 + buyer 就緒：訂購流程 -->
      <div v-else class="order-flow">

        <!-- 成功畫面 -->
        <div v-if="orderSuccess" class="success-box">
          <div class="success-icon">✅</div>
          <h2>訂單已送出！</h2>
          <p class="success-desc">我們收到你的訂單了，稍後會聯絡你確認付款細節</p>
          <div class="success-details">
            <div class="detail-row"><span>商品</span><strong>{{ lastOrder.productName }}</strong></div>
            <div class="detail-row"><span>數量</span><strong>{{ lastOrder.quantity }} 件</strong></div>
            <div class="detail-row"><span>金額</span><strong>NT$ {{ formatPrice(lastOrder.sell_price * lastOrder.quantity) }}</strong></div>
          </div>
          <button class="btn-again" @click="resetOrder">繼續訂購</button>
        </div>

        <div v-else>

          <!-- 無 token：商品列表 -->
          <div v-if="!urlToken && !selectedProduct" class="section">
            <h2 class="section-title">選擇商品</h2>
            <div v-if="productsLoading" class="center-box"><div class="spinner"></div></div>
            <div v-else-if="availableProducts.length === 0" class="empty-products">
              <div style="font-size:40px;margin-bottom:8px">🚫</div>
              <p>目前沒有可訂購的商品</p>
            </div>
            <div v-else class="product-grid">
              <div
                v-for="p in availableProducts" :key="p.id"
                class="product-card"
                @click="selectProduct(p)"
              >
                <div class="product-name">{{ p.name }}</div>
                <div v-if="p.description" class="product-desc">{{ p.description }}</div>
                <div class="product-price-row">
                  <span v-if="p.list_price != null" class="product-price">NT$ {{ formatPrice(p.list_price) }}</span>
                  <span v-else class="product-price-tbd">價格面議</span>
                  <span class="product-stock">庫存 {{ p.stock_quantity }} 件</span>
                </div>
                <button class="btn-select">選擇 →</button>
              </div>
            </div>
          </div>

          <!-- 有 token 或已選商品：填寫訂購表單 -->
          <div v-else-if="selectedProduct" class="section">
            <button v-if="!urlToken" class="btn-back" @click="selectedProduct = null">← 返回商品列表</button>

            <h2 class="section-title">填寫訂購資訊</h2>

            <div class="selected-product-card">
              <div class="sp-name">{{ selectedProduct.name }}</div>
              <div v-if="selectedProduct.description" class="sp-desc">{{ selectedProduct.description }}</div>
              <div class="sp-price">
                <span v-if="effectivePrice != null">NT$ {{ formatPrice(effectivePrice) }} / 件</span>
                <span v-else class="price-tbd">價格由賣家確認</span>
              </div>
            </div>

            <div class="order-form-card">
              <div class="form-group">
                <label class="form-label">訂購數量</label>
                <div class="qty-control">
                  <button class="qty-btn" @click="qty = Math.max(1, qty - 1)">－</button>
                  <input class="qty-input" type="number" v-model.number="qty" min="1" :max="selectedProduct.stock_quantity" />
                  <button class="qty-btn" @click="qty = Math.min(selectedProduct.stock_quantity, qty + 1)">＋</button>
                </div>
                <p class="form-hint">最多可訂 {{ selectedProduct.stock_quantity }} 件</p>
              </div>

              <div class="form-group">
                <label class="form-label">備注（選填）</label>
                <textarea class="form-textarea" v-model="notes" placeholder="尺寸、顏色、特殊需求..."></textarea>
              </div>

              <div v-if="effectivePrice != null" class="price-preview">
                <span>{{ qty }} 件 × NT$ {{ formatPrice(effectivePrice) }}</span>
                <strong>= NT$ {{ formatPrice(effectivePrice * qty) }}</strong>
              </div>

              <p v-if="orderError" class="error-msg">{{ orderError }}</p>
              <button class="btn-submit" @click="submitOrder" :disabled="submitting">
                {{ submitting ? '送出中...' : '確認下單' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase.js'
import { useLiff } from '../composables/useLiff.js'

const route = useRoute()
const { loading, loggedIn, buyer, initError, buyerError, login, logout } = useLiff()

// ── URL 參數（只接受 token，不接受 price） ──────────
const urlToken = computed(() => route.query.token || null)

// ── Token 解析結果 ──────────────────────────────────
const tokenLoading   = ref(false)
const tokenError     = ref('')
const selectedProduct = ref(null)
const effectivePrice  = ref(null)   // 完全由 DB 決定，URL 無法影響

// ── 商品瀏覽（無 token 時） ─────────────────────────
const availableProducts = ref([])
const productsLoading   = ref(false)

// ── 訂單表單 ───────────────────────────────────────
const qty       = ref(1)
const notes     = ref('')
const submitting  = ref(false)
const orderError  = ref('')
const orderSuccess = ref(false)
const lastOrder   = ref(null)

// ── 用 token 向 DB 查詢商品與售價 ──────────────────
async function resolveToken(token) {
  tokenLoading.value = true
  tokenError.value   = ''

  const { data, error } = await supabase
    .from('share_links')
    .select(`sell_price, products(id, name, description, cost_price, stock_quantity)`)
    .eq('token', token)
    .maybeSingle()

  tokenLoading.value = false

  if (error || !data) {
    tokenError.value = '連結無效或已失效'
    return
  }
  if (!data.products) {
    tokenError.value = '此連結對應的商品已下架'
    return
  }
  if (data.products.stock_quantity <= 0) {
    tokenError.value = '此商品目前無庫存，請向賣家確認'
    return
  }

  selectedProduct.value = data.products
  effectivePrice.value  = Number(data.sell_price)   // 價格來自 DB
}

// ── 無 token 時載入全部上架商品 ────────────────────
async function loadAllProducts() {
  productsLoading.value = true
  const { data } = await supabase
    .from('products')
    .select('id, name, description, list_price, cost_price, stock_quantity')
    .gt('stock_quantity', 0)
    .order('name')
  availableProducts.value = data || []
  productsLoading.value = false
}

function selectProduct(p) {
  selectedProduct.value = p
  effectivePrice.value  = p.list_price ?? null   // 來自 DB，非 URL
  qty.value   = 1
  notes.value = ''
  orderError.value = ''
}

// ── 下單 ───────────────────────────────────────────
async function submitOrder() {
  if (!buyer.value)          { orderError.value = '請先登入'; return }
  if (!selectedProduct.value){ orderError.value = '請選擇商品'; return }
  if (qty.value < 1)         { orderError.value = '數量至少 1 件'; return }
  if (qty.value > selectedProduct.value.stock_quantity) {
    orderError.value = `庫存不足，最多可訂 ${selectedProduct.value.stock_quantity} 件`; return
  }
  if (effectivePrice.value == null) {
    orderError.value = '此商品尚未設定售價，請聯繫賣家'; return
  }

  orderError.value  = ''
  submitting.value  = true

  const { error } = await supabase.from('orders').insert({
    buyer_id:   buyer.value.id,
    product_id: selectedProduct.value.id,
    quantity:   qty.value,
    sell_price: effectivePrice.value,          // 來自 DB，不可被客戶篡改
    cost_price: selectedProduct.value.cost_price || 0,
    status:     '待付款',
    notes:      notes.value.trim() || null,
  })

  submitting.value = false
  if (error) { orderError.value = '送出失敗，請稍後再試'; return }

  lastOrder.value = {
    productName: selectedProduct.value.name,
    quantity:    qty.value,
    sell_price:  effectivePrice.value,
  }
  orderSuccess.value = true
}

function resetOrder() {
  orderSuccess.value = false
  if (!urlToken.value) { selectedProduct.value = null; effectivePrice.value = null }
  qty.value = 1; notes.value = ''; orderError.value = ''; lastOrder.value = null
}

function formatPrice(n) { return Number(n).toLocaleString('zh-TW') }

// ── 登入後觸發資料載入 ─────────────────────────────
// LIFF 在 LINE IAB 通常一開啟就是 loggedIn，watch immediate 確保不遺漏
watch(loggedIn, async (isLoggedIn) => {
  if (!isLoggedIn) return
  if (urlToken.value) {
    await resolveToken(urlToken.value)
  } else {
    await loadAllProducts()
  }
}, { immediate: true })
</script>

<style scoped>
.shop-page { min-height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%); display: flex; flex-direction: column; }
.shop-header { background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 50; }
.shop-header-inner { max-width: 640px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
.shop-brand { display: flex; align-items: center; gap: 8px; }
.shop-logo { font-size: 22px; }
.shop-name { font-size: 16px; font-weight: 700; color: #1f2937; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.user-avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #6366f1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.user-name { font-size: 14px; font-weight: 600; color: #374151; }
.btn-logout { font-size: 12px; color: #9ca3af; background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.btn-logout:hover { background: #f3f4f6; }

.shop-body { flex: 1; max-width: 640px; margin: 0 auto; width: 100%; padding: 24px 20px 60px; }

.center-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px; color: #9ca3af; min-height: 40vh; }
.spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #6366f1; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.login-box { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.login-card { background: white; border-radius: 20px; padding: 40px 36px; text-align: center; box-shadow: 0 8px 40px rgba(99,102,241,0.12); max-width: 360px; width: 100%; }
.login-icon { font-size: 52px; margin-bottom: 16px; }
.login-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
.login-desc { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.6; }
.btn-line { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 14px; background: #06C755; color: white; font-size: 16px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all 0.15s; }
.btn-line:hover { background: #05b34b; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,199,85,0.3); }
.line-icon { width: 22px; height: 22px; flex-shrink: 0; }
.login-note { font-size: 12px; color: #9ca3af; margin-top: 16px; }

.section { }
.section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 16px; }
.empty-products { text-align: center; padding: 48px; color: #9ca3af; }
.product-grid { display: flex; flex-direction: column; gap: 12px; }
.product-card { background: white; border-radius: 14px; padding: 18px 20px; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.15s; }
.product-card:hover { border-color: #6366f1; box-shadow: 0 4px 16px rgba(99,102,241,0.1); }
.product-name { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
.product-desc { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.product-price-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.product-price { font-size: 18px; font-weight: 700; color: #6366f1; }
.product-price-tbd { font-size: 14px; color: #9ca3af; }
.product-stock { font-size: 12px; color: #9ca3af; }
.btn-select { display: block; width: 100%; padding: 10px; background: #6366f1; color: white; font-size: 14px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; }
.btn-select:hover { background: #4f46e5; }

.btn-back { background: none; border: none; cursor: pointer; font-size: 14px; color: #6b7280; margin-bottom: 16px; padding: 0; }
.btn-back:hover { color: #1f2937; }
.selected-product-card { background: white; border-radius: 14px; padding: 18px 20px; border: 2px solid #6366f1; margin-bottom: 16px; }
.sp-name { font-size: 17px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
.sp-desc { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.sp-price { font-size: 20px; font-weight: 700; color: #6366f1; }
.price-tbd { font-size: 14px; color: #9ca3af; font-weight: 400; }

.order-form-card { background: white; border-radius: 14px; padding: 20px; border: 1px solid #e5e7eb; }
.qty-control { display: flex; align-items: center; margin-bottom: 4px; }
.qty-btn { width: 40px; height: 40px; border: 1.5px solid #d1d5db; background: #f9fafb; font-size: 18px; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.qty-btn:hover { background: #f3f4f6; border-color: #6366f1; }
.qty-input { width: 64px; text-align: center; border: 1.5px solid #d1d5db; padding: 8px; font-size: 16px; font-weight: 700; margin: 0 8px; border-radius: 8px; -moz-appearance: textfield; }
.qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.qty-input:focus { outline: none; border-color: #6366f1; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 80px; resize: vertical; font-family: inherit; }
.form-textarea:focus { outline: none; border-color: #6366f1; }
.form-hint { font-size: 12px; color: #9ca3af; margin-top: 4px; }
.price-preview { display: flex; align-items: center; justify-content: space-between; background: #f0f4ff; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; color: #374151; }
.price-preview strong { font-size: 18px; font-weight: 700; color: #6366f1; }
.error-msg { color: #ef4444; font-size: 13px; margin-bottom: 12px; }
.btn-submit { width: 100%; padding: 14px; background: #6366f1; color: white; font-size: 16px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all 0.15s; }
.btn-submit:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.success-box { background: white; border-radius: 20px; padding: 40px 32px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.success-icon { font-size: 56px; margin-bottom: 16px; }
.success-box h2 { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
.success-desc { font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
.success-details { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; }
.detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb; }
.detail-row:last-child { border-bottom: none; }
.detail-row strong { color: #1f2937; }
.btn-again { padding: 12px 32px; background: #6366f1; color: white; font-size: 15px; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; }
.btn-again:hover { background: #4f46e5; }
</style>
