<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">買家管理</h2>
      <button class="btn btn-primary" @click="openCreate">＋ 新增買家</button>
    </div>

    <div class="page-body">
      <div class="filter-bar">
        <input class="search-input" v-model="search" placeholder="🔍 搜尋買家名稱..." />
        <span class="total-hint">共 {{ filteredBuyers.length }} 位買家</span>
      </div>

      <div class="card">
        <div v-if="loading" class="loading">載入中...</div>
        <div v-else-if="filteredBuyers.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <p>{{ search ? '找不到符合的買家' : '尚未新增任何買家' }}</p>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>買家名稱</th>
                <th>聯絡方式</th>
                <th>訂單數</th>
                <th>總消費</th>
                <th>待付款</th>
                <th>備注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBuyers" :key="b.id">
                <td>
                  <div class="buyer-name">
                    <div class="avatar">{{ b.name[0] }}</div>
                    <strong>{{ b.name }}</strong>
                  </div>
                </td>
                <td class="text-muted">{{ b.contact || '—' }}</td>
                <td>
                  <span class="order-count">{{ b.order_count || 0 }}</span>
                </td>
                <td>
                  <span class="text-amount">NT$ {{ formatPrice(b.total_revenue || 0) }}</span>
                </td>
                <td>
                  <span :class="['owed-amount', (b.owed || 0) > 0 ? 'has-owed' : '']">
                    NT$ {{ formatPrice(b.owed || 0) }}
                  </span>
                </td>
                <td class="text-muted">{{ b.notes || '—' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn btn-ghost btn-sm" @click="openEdit(b)">編輯</button>
                    <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" @click="confirmDelete(b)">刪除</button>
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
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '編輯買家' : '新增買家' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">買家名稱 *</label>
            <input class="form-input" v-model="form.name" placeholder="例：小明、LINE暱稱..." />
          </div>
          <div class="form-group">
            <label class="form-label">聯絡方式</label>
            <input class="form-input" v-model="form.contact" placeholder="例：Line: xxx、IG: @xxx、電話..." />
          </div>
          <div class="form-group">
            <label class="form-label">備注</label>
            <textarea class="form-textarea" v-model="form.notes" placeholder="VIP 客戶、特殊需求..."></textarea>
          </div>
          <p v-if="formError" class="error-msg">{{ formError }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="saveBuyer" :disabled="saving">
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
          <p style="color:var(--gray-600);margin-bottom:20px;">
            確定要刪除買家 <strong>{{ deleteTarget?.name }}</strong>？相關訂單的買家資料將變為空白。
          </p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="showDeleteModal = false">取消</button>
            <button class="btn btn-danger" @click="deleteBuyer" :disabled="saving">
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

const buyers = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const deleteTarget = ref(null)

const defaultForm = () => ({ name: '', contact: '', notes: '' })
const form = ref(defaultForm())

const filteredBuyers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return buyers.value
  return buyers.value.filter(b =>
    b.name.toLowerCase().includes(q) || (b.contact || '').toLowerCase().includes(q)
  )
})

async function fetchBuyers() {
  loading.value = true

  // 取得買家 + 從訂單彙總統計
  const { data: buyerList } = await supabase.from('buyers').select('*').order('created_at', { ascending: false })
  const { data: orderStats } = await supabase
    .from('orders')
    .select('buyer_id, sell_price, quantity, status')

  // 計算每位買家的統計
  const statsMap = {}
  ;(orderStats || []).forEach(o => {
    if (!o.buyer_id) return
    if (!statsMap[o.buyer_id]) statsMap[o.buyer_id] = { order_count: 0, total_revenue: 0, owed: 0 }
    const total = Number(o.sell_price) * Number(o.quantity)
    statsMap[o.buyer_id].order_count++
    if (o.status !== '取消') {
      statsMap[o.buyer_id].total_revenue += total
      if (o.status === '待付款') statsMap[o.buyer_id].owed += total
    }
  })

  buyers.value = (buyerList || []).map(b => ({
    ...b,
    ...(statsMap[b.id] || { order_count: 0, total_revenue: 0, owed: 0 })
  }))
  loading.value = false
}

function openCreate() {
  form.value = defaultForm()
  isEditing.value = false
  formError.value = ''
  showModal.value = true
}
function openEdit(b) {
  form.value = { ...b }
  isEditing.value = true
  formError.value = ''
  showModal.value = true
}
function closeModal() { showModal.value = false }

async function saveBuyer() {
  if (!form.value.name.trim()) { formError.value = '請填寫買家名稱'; return }
  formError.value = ''
  saving.value = true
  const payload = {
    name: form.value.name.trim(),
    contact: form.value.contact?.trim() || null,
    notes: form.value.notes?.trim() || null,
  }
  let error
  if (isEditing.value) {
    ;({ error } = await supabase.from('buyers').update(payload).eq('id', form.value.id))
  } else {
    ;({ error } = await supabase.from('buyers').insert(payload))
  }
  saving.value = false
  if (error) { formError.value = '儲存失敗：' + error.message; return }
  closeModal()
  fetchBuyers()
}

function confirmDelete(b) {
  deleteTarget.value = b
  showDeleteModal.value = true
}
async function deleteBuyer() {
  saving.value = true
  const { error } = await supabase.from('buyers').delete().eq('id', deleteTarget.value.id)
  saving.value = false
  if (error) { alert('刪除失敗：' + error.message); return }
  showDeleteModal.value = false
  fetchBuyers()
}

function formatPrice(n) { return Number(n).toLocaleString('zh-TW') }

onMounted(fetchBuyers)
</script>

<style scoped>
.total-hint { font-size: 13px; color: var(--gray-400); }
.text-muted { color: var(--gray-500); font-size: 13px; }
.buyer-name { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.order-count { font-weight: 600; color: var(--gray-700); }
.text-amount { font-weight: 600; color: var(--gray-800); }
.owed-amount { font-weight: 600; color: var(--gray-400); }
.owed-amount.has-owed { color: var(--danger); }
.action-btns { display: flex; gap: 6px; }
</style>
