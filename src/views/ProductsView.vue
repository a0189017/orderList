<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
      <button class="btn btn-primary" @click="openCreate">＋ 新增商品</button>
    </div>

    <div class="page-body">
      <div class="filter-bar">
        <input class="search-input" v-model="search" placeholder="🔍 搜尋商品名稱..." />
        <span class="total-hint">共 {{ filteredProducts.length }} 項商品</span>
      </div>

      <div class="card">
        <div v-if="loading" class="loading">載入中...</div>
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>{{ search ? '找不到符合的商品' : '尚未新增任何商品' }}</p>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>商品名稱</th>
                <th>描述</th>
                <th>進貨成本</th>
                <th>公開定價</th>
                <th>庫存數量</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProducts" :key="p.id">
                <td><strong>{{ p.name }}</strong></td>
                <td class="text-muted">{{ p.description || '—' }}</td>
                <td><span class="price-tag">NT$ {{ formatPrice(p.cost_price) }}</span></td>
                <td>
                  <span v-if="p.list_price != null" class="list-price-tag">NT$ {{ formatPrice(p.list_price) }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span :class="['stock-badge', p.stock_quantity <= 0 ? 'out' : p.stock_quantity <= 3 ? 'low' : 'ok']">
                    {{ p.stock_quantity }} 件
                  </span>
                </td>
                <td class="text-muted">{{ formatDate(p.created_at) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-share" @click="openShareModal(p)">🔗 分享</button>
                    <button class="btn btn-ghost btn-sm" @click="openEdit(p)">編輯</button>
                    <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" @click="confirmDelete(p)">刪除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== 新增/編輯 Modal ===== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '編輯商品' : '新增商品' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">商品名稱 *</label>
            <input class="form-input" v-model="form.name" placeholder="例：Nike Air Max 90 黑色 US10" />
          </div>
          <div class="form-group">
            <label class="form-label">描述備注</label>
            <textarea class="form-textarea" v-model="form.description" placeholder="尺寸、顏色、規格..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">進貨成本 (NT$) *</label>
              <input class="form-input" type="number" v-model.number="form.cost_price" placeholder="0" min="0" />
              <p class="form-hint">不會顯示給客戶</p>
            </div>
            <div class="form-group">
              <label class="form-label">庫存數量 *</label>
              <input class="form-input" type="number" v-model.number="form.stock_quantity" placeholder="0" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">公開定價 (NT$)</label>
            <input class="form-input" type="number" v-model="form.list_price_input" placeholder="留空 = 價格面議" min="0" />
            <p class="form-hint">作為分享連結時的預設售價；可在分享時個別調整</p>
          </div>
          <p v-if="formError" class="error-msg">{{ formError }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="saveProduct" :disabled="saving">
              {{ saving ? '儲存中...' : (isEditing ? '更新' : '新增') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 分享連結 Modal ===== -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
      <div class="modal" style="max-width:440px;">
        <div class="modal-header">
          <h3 class="modal-title">產生訂購連結</h3>
          <button class="modal-close" @click="closeShareModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="share-product-preview">
            <span class="share-product-label">商品</span>
            <strong>{{ shareTarget?.name }}</strong>
          </div>

          <div class="form-group">
            <label class="form-label">此次連結的售價 (NT$) *</label>
            <input
              class="form-input"
              type="number"
              v-model.number="sharePrice"
              placeholder="請輸入售價"
              min="0"
            />
            <p class="form-hint">
              售價會安全地存在伺服器，連結中不含任何價格資訊，客戶無法篡改。
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">備注（僅自己看得到）</label>
            <input class="form-input" v-model="shareNote" placeholder="例：給小明的連結、七折優惠..." />
          </div>

          <!-- 產生後顯示連結 -->
          <div v-if="generatedLink" class="generated-link-box">
            <p class="generated-label">✅ 連結已產生，點擊複製：</p>
            <div class="link-row">
              <input class="link-input" :value="generatedLink" readonly @click="copyGeneratedLink" />
              <button class="btn-copy-link" @click="copyGeneratedLink">
                {{ linkCopied ? '✓ 已複製' : '複製' }}
              </button>
            </div>
            <p class="link-note">⚠️ 每次點「產生連結」都會產生新的不同連結</p>
          </div>

          <p v-if="shareError" class="error-msg">{{ shareError }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="closeShareModal">關閉</button>
            <button class="btn btn-primary" @click="generateShareLink" :disabled="generating">
              {{ generating ? '產生中...' : '產生連結' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 刪除確認 Modal ===== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal" style="max-width:380px;">
        <div class="modal-header">
          <h3 class="modal-title">確認刪除</h3>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--gray-600);margin-bottom:20px;">
            確定要刪除 <strong>{{ deleteTarget?.name }}</strong>？此操作無法復原，該商品的所有分享連結也會一併失效。
          </p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
            <button class="btn btn-danger" @click="deleteProduct" :disabled="saving">
              {{ saving ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'

// ===== 商品列表 =====
const products = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const defaultForm = () => ({
  name: '', description: '', cost_price: 0, stock_quantity: 0, list_price_input: ''
})
const form = ref(defaultForm())

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(p =>
    p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
  )
})

// ===== 分享連結 =====
const showShareModal = ref(false)
const shareTarget = ref(null)
const sharePrice = ref(0)
const shareNote = ref('')
const generating = ref(false)
const generatedLink = ref('')
const shareError = ref('')
const linkCopied = ref(false)

async function fetchProducts() {
  loading.value = true
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (data) products.value = data
  loading.value = false
}

function openCreate() {
  form.value = defaultForm()
  isEditing.value = false
  formError.value = ''
  showModal.value = true
}

function openEdit(p) {
  form.value = { ...p, list_price_input: p.list_price != null ? String(p.list_price) : '' }
  isEditing.value = true
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function saveProduct() {
  if (!form.value.name.trim()) { formError.value = '請填寫商品名稱'; return }
  formError.value = ''
  saving.value = true

  const raw = form.value.list_price_input?.toString().trim()
  const listPrice = raw === '' || raw == null ? null : Number(raw)

  const payload = {
    name: form.value.name.trim(),
    description: form.value.description?.trim() || null,
    cost_price: Number(form.value.cost_price),
    stock_quantity: Number(form.value.stock_quantity),
    list_price: listPrice,
  }

  const { error } = isEditing.value
    ? await supabase.from('products').update(payload).eq('id', form.value.id)
    : await supabase.from('products').insert(payload)

  saving.value = false
  if (error) { formError.value = '儲存失敗：' + error.message; return }
  closeModal()
  fetchProducts()
}

function confirmDelete(p) { deleteTarget.value = p; showDeleteModal.value = true }

async function deleteProduct() {
  saving.value = true
  const { error } = await supabase.from('products').delete().eq('id', deleteTarget.value.id)
  saving.value = false
  if (error) { alert('刪除失敗：' + error.message); return }
  showDeleteModal.value = false
  fetchProducts()
}

// ===== 分享連結邏輯 =====
function openShareModal(p) {
  shareTarget.value = p
  sharePrice.value = p.list_price ?? 0
  shareNote.value = ''
  generatedLink.value = ''
  shareError.value = ''
  linkCopied.value = false
  showShareModal.value = true
}

function closeShareModal() {
  showShareModal.value = false
  generatedLink.value = ''
}

async function generateShareLink() {
  if (!sharePrice.value && sharePrice.value !== 0) { shareError.value = '請輸入售價'; return }
  if (Number(sharePrice.value) < 0) { shareError.value = '售價不能為負數'; return }
  shareError.value = ''
  generating.value = true

  // 在 DB 建立 share_link，token 由 DB gen_random_bytes 產生
  const { data, error } = await supabase
    .from('share_links')
    .insert({
      product_id: shareTarget.value.id,
      sell_price: Number(sharePrice.value),
      note: shareNote.value.trim() || null,
    })
    .select('token')
    .single()

  generating.value = false

  if (error) {
    shareError.value = '產生失敗：' + error.message
    return
  }

  // URL 中只有 token，完全不含價格資訊
  generatedLink.value = `${window.location.origin}/shop?token=${data.token}`
  linkCopied.value = false
}

async function copyGeneratedLink() {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch {
    prompt('複製此連結：', generatedLink.value)
  }
}

function formatPrice(n) { return Number(n).toLocaleString('zh-TW') }
function formatDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(fetchProducts)
</script>

<style scoped>
.total-hint { font-size: 13px; color: var(--gray-400); }
.text-muted { color: var(--gray-500); }
.price-tag { font-weight: 600; color: var(--gray-800); }
.list-price-tag { font-weight: 600; color: var(--primary); }
.stock-badge {
  display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.stock-badge.ok  { background: #d1fae5; color: #065f46; }
.stock-badge.low { background: #fef3c7; color: #92400e; }
.stock-badge.out { background: #fee2e2; color: #991b1b; }

.action-btns { display: flex; gap: 6px; align-items: center; }
.btn-share {
  background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;
  padding: 5px 10px; border-radius: 6px; font-size: 12px;
  font-weight: 600; cursor: pointer; white-space: nowrap;
}
.btn-share:hover { background: #ddd6fe; }

/* 分享 modal */
.share-product-preview {
  display: flex; align-items: center; gap: 10px;
  background: var(--gray-50); border-radius: 8px; padding: 10px 14px;
  margin-bottom: 16px; border: 1px solid var(--gray-200);
}
.share-product-label {
  font-size: 12px; color: var(--gray-400); font-weight: 600;
  background: var(--gray-200); padding: 2px 8px; border-radius: 4px;
}

.generated-link-box {
  background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;
  padding: 14px; margin-bottom: 12px;
}
.generated-label { font-size: 13px; font-weight: 600; color: #15803d; margin-bottom: 8px; }
.link-row { display: flex; gap: 6px; }
.link-input {
  flex: 1; padding: 7px 10px; border: 1px solid #86efac; border-radius: 6px;
  font-size: 12px; color: var(--gray-700); background: white; cursor: pointer;
}
.link-input:focus { outline: none; }
.btn-copy-link {
  padding: 7px 14px; background: #16a34a; color: white; border: none;
  border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.btn-copy-link:hover { background: #15803d; }
.link-note { font-size: 11px; color: #6b7280; margin-top: 6px; }
</style>
