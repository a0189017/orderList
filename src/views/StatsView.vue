<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">帳務統計</h2>
      <div style="font-size:13px;color:var(--gray-400);">排除「取消」狀態的訂單</div>
    </div>

    <div class="page-body">
      <div v-if="loading" class="loading">載入中...</div>
      <template v-else>
        <!-- 整體概覽 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-label">總營收</div>
            <div class="stat-value blue">NT$ {{ formatPrice(summary.totalRevenue) }}</div>
            <div class="stat-sub">{{ summary.totalOrders }} 筆訂單</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">總成本</div>
            <div class="stat-value red">NT$ {{ formatPrice(summary.totalCost) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">總利潤</div>
            <div class="stat-value" :class="summary.totalProfit >= 0 ? 'green' : 'red'">
              {{ summary.totalProfit >= 0 ? '' : '-' }}NT$ {{ formatPrice(Math.abs(summary.totalProfit)) }}
            </div>
            <div class="stat-sub">利潤率 {{ profitRate }}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">待收款總計</div>
            <div class="stat-value" :class="summary.totalOwed > 0 ? 'red' : 'green'">
              NT$ {{ formatPrice(summary.totalOwed) }}
            </div>
            <div class="stat-sub">{{ summary.owedCount }} 筆待付款</div>
          </div>
        </div>

        <!-- 狀態分佈 -->
        <div class="section-title">訂單狀態分佈</div>
        <div class="status-grid">
          <div v-for="(count, status) in statusCounts" :key="status" class="status-stat-card">
            <span :class="['badge', badgeClass(status)]">{{ status }}</span>
            <div class="status-count">{{ count }} 筆</div>
          </div>
        </div>

        <!-- 買家帳務 -->
        <div class="section-title" style="margin-top:32px;">買家帳務一覽</div>
        <div class="card">
          <div v-if="buyerStats.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <p>尚無訂單資料</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>買家</th>
                  <th>訂單數</th>
                  <th>總消費</th>
                  <th>總成本</th>
                  <th>利潤</th>
                  <th>待付款</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in buyerStats" :key="b.name">
                  <td>
                    <div class="buyer-row">
                      <div class="avatar">{{ (b.name || '?')[0] }}</div>
                      <strong>{{ b.name || '（已刪除）' }}</strong>
                    </div>
                  </td>
                  <td>{{ b.count }}</td>
                  <td>NT$ {{ formatPrice(b.revenue) }}</td>
                  <td class="text-muted">NT$ {{ formatPrice(b.cost) }}</td>
                  <td>
                    <span :class="['profit-cell', b.profit >= 0 ? 'pos' : 'neg']">
                      {{ b.profit >= 0 ? '+' : '' }}NT$ {{ formatPrice(b.profit) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="b.owed > 0" class="owed-badge">
                      NT$ {{ formatPrice(b.owed) }}
                    </span>
                    <span v-else class="clear-badge">✓ 結清</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 商品銷售排行 -->
        <div class="section-title" style="margin-top:32px;">商品銷售排行</div>
        <div class="card">
          <div v-if="productStats.length === 0" class="empty-state">
            <div class="empty-icon">📦</div>
            <p>尚無銷售資料</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>商品</th>
                  <th>銷售數量</th>
                  <th>總營收</th>
                  <th>總利潤</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in productStats" :key="p.name">
                  <td>
                    <span :class="['rank', i < 3 ? 'top' : '']">{{ i + 1 }}</span>
                  </td>
                  <td><strong>{{ p.name || '（已刪除）' }}</strong></td>
                  <td>{{ p.qty }} 件</td>
                  <td>NT$ {{ formatPrice(p.revenue) }}</td>
                  <td>
                    <span :class="['profit-cell', p.profit >= 0 ? 'pos' : 'neg']">
                      {{ p.profit >= 0 ? '+' : '' }}NT$ {{ formatPrice(p.profit) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase.js'

const loading = ref(true)
const orders = ref([])

const activeOrders = computed(() => orders.value.filter(o => o.status !== '取消'))

const summary = computed(() => {
  const ao = activeOrders.value
  const totalRevenue = ao.reduce((s, o) => s + Number(o.sell_price) * Number(o.quantity), 0)
  const totalCost = ao.reduce((s, o) => s + Number(o.cost_price) * Number(o.quantity), 0)
  const pendingOrders = ao.filter(o => o.status === '待付款')
  return {
    totalOrders: ao.length,
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    totalOwed: pendingOrders.reduce((s, o) => s + Number(o.sell_price) * Number(o.quantity), 0),
    owedCount: pendingOrders.length,
  }
})

const profitRate = computed(() => {
  if (!summary.value.totalRevenue) return '0.0'
  return ((summary.value.totalProfit / summary.value.totalRevenue) * 100).toFixed(1)
})

const statusCounts = computed(() => {
  const counts = {}
  const all = ['待付款', '已付款', '已出貨', '完成', '取消']
  all.forEach(s => { counts[s] = orders.value.filter(o => o.status === s).length })
  return counts
})

const buyerStats = computed(() => {
  const map = {}
  activeOrders.value.forEach(o => {
    const key = o.buyer_id || '__none__'
    const name = o.buyers?.name || null
    if (!map[key]) map[key] = { name, count: 0, revenue: 0, cost: 0, profit: 0, owed: 0 }
    const rev = Number(o.sell_price) * Number(o.quantity)
    const cost = Number(o.cost_price) * Number(o.quantity)
    map[key].count++
    map[key].revenue += rev
    map[key].cost += cost
    map[key].profit += rev - cost
    if (o.status === '待付款') map[key].owed += rev
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

const productStats = computed(() => {
  const map = {}
  activeOrders.value.forEach(o => {
    const key = o.product_id || '__none__'
    const name = o.products?.name || null
    if (!map[key]) map[key] = { name, qty: 0, revenue: 0, profit: 0 }
    map[key].qty += Number(o.quantity)
    map[key].revenue += Number(o.sell_price) * Number(o.quantity)
    map[key].profit += (Number(o.sell_price) - Number(o.cost_price)) * Number(o.quantity)
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

function badgeClass(status) {
  const m = { '待付款': 'badge-pending', '已付款': 'badge-paid', '已出貨': 'badge-shipped', '完成': 'badge-done', '取消': 'badge-canceled' }
  return m[status] || ''
}

function formatPrice(n) { return Number(n).toLocaleString('zh-TW') }

async function fetchOrders() {
  loading.value = true
  const { data } = await supabase
    .from('orders')
    .select('*, buyers(name), products(name)')
    .order('created_at', { ascending: false })
  if (data) orders.value = data
  loading.value = false
}

onMounted(fetchOrders)
</script>

<style scoped>
.text-muted { color: var(--gray-500); font-size: 13px; }
.section-title {
  font-size: 15px; font-weight: 700; color: var(--gray-700);
  margin-bottom: 12px; margin-top: 8px;
}
.stat-sub { font-size: 12px; color: var(--gray-400); margin-top: 4px; }

.status-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.status-stat-card {
  background: white; border: 1px solid var(--gray-200); border-radius: 10px;
  padding: 14px 20px; display: flex; flex-direction: column; gap: 6px;
  min-width: 100px; box-shadow: var(--shadow);
}
.status-count { font-size: 20px; font-weight: 700; color: var(--gray-800); }

.buyer-row { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
}

.profit-cell { font-weight: 700; }
.profit-cell.pos { color: var(--success); }
.profit-cell.neg { color: var(--danger); }
.pos { color: var(--success); }
.neg { color: var(--danger); }

.owed-badge {
  background: #fee2e2; color: #991b1b;
  padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;
}
.clear-badge {
  background: #d1fae5; color: #065f46;
  padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;
}

.rank { font-weight: 700; color: var(--gray-400); }
.rank.top { color: var(--warning); }
</style>
