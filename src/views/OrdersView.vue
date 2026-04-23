<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">訂單管理</h2>
      <button class="btn btn-primary" @click="openCreate">＋ 新增訂單</button>
    </div>

    <div class="page-body">
      <!-- 篩選列 -->
      <div class="filter-bar">
        <input class="search-input" v-model="search" placeholder="🔍 搜尋商品或買家..." />
        <select class="form-select" style="width:130px;" v-model="statusFilter">
          <option value="">全部狀態</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <span class="total-hint">共 {{ filteredOrders.length }} 筆訂單</span>
      </div>

      <div class="card">
        <div v-if="loading" class="loading">載入中...</div>
        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>{{ search || statusFilter ? '找不到符合的訂單' : '尚未建立任何訂單' }}</p>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>建立時間</th>
                <th>買家</th>
                <th>商品</th>
                <th>數量</th>
                <th>進貨成本</th>
                <th>售價</th>
                <th>利潤</th>
                <th>狀態</th>
                <th>備注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in filteredOrders" :key="o.id">
                <td class="text-muted">{{ formatDate(o.created_at) }}</td>
                <td>
                  <span class="buyer-chip">{{ o.buyers?.name || '—' }}</span>
                </td>
                <td><strong>{{ o.products?.name || '—' }}</strong></td>
                <td>{{ o.quantity }}</td>
                <td class="text-muted">NT$ {{ formatPrice(o.cost_price * o.quantity) }}</td>
                <td>
                  <span class="sell-price">NT$ {{ formatPrice(o.sell_price * o.quantity) }}</span>
                </td>
                <td>
                  <span :class="['profit', profit(o) >= 0 ? 'pos' : 'neg']">
                    {{ profit(o) >= 0 ? '+' : '' }}NT$ {{ formatPrice(profit(o)) }}
                  </span>
                </td>
                <td>
                  <select class="status-select" :value="o.status" @change="updateStatus(o, $event.target.value)">
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="text-muted">{{ o.notes || '—' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn btn-ghost btn-sm" @click="openEdit(o)">編輯</button>
                    <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" @click="confirmDelete(o)">刪除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增/編輯 Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '編輯訂單' : '新增訂單' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- 買家 -->
          <div class="form-group">
            <label class="form-label">買家 *</label>
            <select class="form-select" v-model="form.buyer_id">
              <option value="">— 選擇買家 —</option>
              <option v-for="b in buyers" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>

          <!-- 商品 -->
          <div class="form-group">
            <label class="form-label">商品 *</label>
            <select class="form-select" v-model="form.product_id" @change="onProductChange">
              <option value="">— 選擇商品 —</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}（庫存 {{ p.stock_quantity }}，成本 NT${{ formatPrice(p.cost_price) }}）
              </option>
            </select>
          </div>

          <div class="form-row">
            <!-- 數量 -->
            <div class="form-group">
              <label class="form-label">數量 *</label>
              <input class="form-input" type="number" v-model.number="form.quantity" min="1" step="1" @input="recalc" />
            </div>
            <!-- 狀態 -->
            <div class="form-group">
              <label class="form-label">狀態</label>
              <select class="form-select" v-model="form.status">
                <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <!-- 進貨成本（唯讀顯示，從商品帶入） -->
            <div class="form-group">
              <label class="form-label">進貨成本（單價）</label>
              <input class="form-input" type="number" v-model.number="form.cost_price" min="0" step="1" />
              <p class="form-hint">從商品自動帶入，可手動調整</p>
            </div>
            <!-- 自訂售價 -->
            <div class="form-group">
              <label class="form-label">售價（對此買家，單價）*</label>
              <input class="form-input" type="number" v-model.number="form.sell_price" min="0" step="1" @input="recalc" />
            </div>
          </div>

          <!-- 利潤預覽 -->
          <div v-if="form.quantity && form.sell_price" class="profit-preview">
            <div class="preview-item">
              <span>總成本</span>
              <strong>NT$ {{ formatPrice(form.cost_price * form.quantity) }}</strong>
            </div>
            <div class="preview-item">
              <span>總售價</span>
              <strong>NT$ {{ formatPrice(form.sell_price * form.quantity) }}</strong>
            </div>
            <div class="preview-item">
              <span>預估利潤</span>
              <strong :class="previewProfit >= 0 ? 'pos' : 'neg'">
                {{ previewProfit >= 0 ? '+' : '' }}NT$ {{ formatPrice(previewProfit) }}
              </strong>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">備注</label>
            <textarea class="form-textarea" v-model="form.notes" placeholder="顏色、尺寸、運送方式..."></textarea>
          </div>

          <p v-if="formError" class="error-msg">{{ formError }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="saveOrder" :disabled="saving">
              {{ saving ? '儲存中...' : (isEditing ? '更新' : '新增') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal" style="max-width:380px;">
        <div class="modal-header">
          <h3 class="modal-title">確認刪除</h3>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--gray-600);margin-bottom:20px;">確定要刪除此訂單？此操作無法復原。</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
            <button class="btn btn-danger" @click="deleteOrder" :disabled="saving">
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

const orders = ref([])
const buyers = ref([])
const products = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref(null)

const statuses = ['待付款', '已付款', '已出貨', '完成', '取消']

const defaultForm = () => ({
  buyer_id: '', product_id: '', quantity: 1,
  cost_price: 0, sell_price: 0, status: '待付款', notes: ''
})
const form = ref(defaultForm())

const previewProfit = computed(() =>
  (Number(form.value.sell_price) - Number(form.value.cost_price)) * Number(form.value.quantity)
)

const filteredOrders = computed(() => {
  let list = orders.value
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(o =>
    (o.products?.name || '').toLowerCase().includes(q) ||
    (o.buyers?.name || '').toLowerCase().includes(q)
  )
  return list
})

async function fetchAll() {
  loading.value = true
  const [ordersRes, buyersRes, productsRes] = await Promise.all([
    supabase.from('orders').select('*, buyers(name), products(name)').order('created_at', { ascending: false }),
    supabase.from('buyers').select('id, name').order('name'),
    supabase.from('products').select('id, name, cost_price, stock_quantity').order('name'),
  ])
  if (!ordersRes.error) orders.value = ordersRes.data
  if (!buyersRes.error) buyers.value = buyersRes.data
  if (!productsRes.error) products.value = productsRes.data
  loading.value = false
}

function onProductChange() {
  const p = products.value.find(p => p.id === form.value.product_id)
  if (p) form.value.cost_price = p.cost_price
}

function recalc() {} // 預留擴充用

function openCreate() {
  form.value = defaultForm()
  isEditing.value = false
  formError.value = ''
  showModal.value = true
}

function openEdit(o) {
  form.value = {
    id: o.id,
    buyer_id: o.buyer_id || '',
    product_id: o.product_id || '',
    quantity: o.quantity,
    cost_price: o.cost_price,
    sell_price: o.sell_price,
    status: o.status,
    notes: o.notes || '',
  }
  isEditing.value = true
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function saveOrder() {
  if (!form.value.buyer_id) { formError.value = '請選擇買家'; return }
  if (!form.value.product_id) { formError.value = '請選擇商品'; return }
  if (!form.value.sell_price && form.value.sell_price !== 0) { formError.value = '請填寫售價'; return }
  if (Number(form.value.quantity) < 1) { formError.value = '數量至少為 1'; return }
  formError.value = ''
  saving.value = true

  const payload = {
    buyer_id: form.value.buyer_id || null,
    product_id: form.value.product_id || null,
    quantity: Number(form.value.quantity),
    cost_price: Number(form.value.cost_price),
    sell_price: Number(form.value.sell_price),
    status: form.value.status,
    notes: form.value.notes?.trim() || null,
  }

  let error
  if (isEditing.value) {
    ;({ error } = await supabase.from('orders').update(payload).eq('id', form.value.id))
  } else {
    ;({ error } = await supabase.from('orders').insert(payload))
  }
  saving.value = false
  if (error) { formError.value = '儲存失敗：' + error.message; return }
  closeModal()
  fetchAll()
}

async function updateStatus(order, newStatus) {
  await supabase.from('orders').update({ status: newStatus }).eq('id', order.id)
  order.status = newStatus
}

function confirmDelete(o) {
  deleteTarget.value = o
  showDeleteModal.value = true
}
async function deleteOrder() {
  saving.value = true
  const { error } = await supabase.from('orders').delete().eq('id', deleteTarget.value.id)
  saving.value = false
  if (error) { alert('刪除失敗：' + error.message); return }
  showDeleteModal.value = false
  fetchAll()
}

function profit(o) {
  return (Number(o.sell_price) - Number(o.cost_price)) * Number(o.quantity)
}

function formatPrice(n) { return Number(n).toLocaleString('zh-TW') }
function formatDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

onMounted(fetchAll)
</script>

<style scoped>
.total-hint { font-size: 13px; color: var(--gray-400); }
.text-muted { color: var(--gray-500); font-size: 13px; }
.buyer-chip {
  background: var(--primary-light); color: var(--primary);
  padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.sell-price { font-weight: 600; color: var(--gray-800); }
.profit { font-weight: 700; }
.profit.pos { color: var(--success); }
.profit.neg { color: var(--danger); }
.pos { color: var(--success); }
.neg { color: var(--danger); }
.action-btns { display: flex; gap: 6px; }

.status-select {
  padding: 4px 8px; border: 1.5px solid var(--gray-200);
  border-radius: 6px; font-size: 12px; background: white; cursor: pointer;
}

/* 利潤預覽 */
.profit-preview {
  display: flex; gap: 16px;
  background: var(--gray-50); border-radius: 8px; padding: 12px 16px;
  margin: 12px 0; border: 1px solid var(--gray-200);
}
.preview-item { display: flex; flex-direction: column; gap: 2px; }
.preview-item span { font-size: 11px; color: var(--gray-400); }
.preview-item strong { font-size: 14px; }
</style>
