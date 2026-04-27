import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase.js'

import ProductsView    from '../views/ProductsView.vue'
import BuyersView      from '../views/BuyersView.vue'
import OrdersView      from '../views/OrdersView.vue'
import StatsView       from '../views/StatsView.vue'
import ShopView        from '../views/ShopView.vue'
import AdminLoginView  from '../views/AdminLoginView.vue'
import NotFoundView    from '../views/NotFoundView.vue'

// 登入路徑從 .env 讀取，不寫死在程式碼裡
// 即使有人看到原始碼，也找不到實際的登入入口
// 自動補上開頭的 /，防止漏填導致路由無法匹配
const rawAdminPath = import.meta.env.VITE_ADMIN_PATH || '/admin-login'
const ADMIN_LOGIN_PATH = rawAdminPath.startsWith('/') ? rawAdminPath : '/' + rawAdminPath

const routes = [
  // ── 管理後台（需要登入）───────────────────────────
  { path: '/',         redirect: '/shop' },
  { path: '/orders',   component: OrdersView,   meta: { requiresAuth: true, title: '訂單管理' } },
  { path: '/products', component: ProductsView,  meta: { requiresAuth: true, title: '商品管理' } },
  { path: '/buyers',   component: BuyersView,    meta: { requiresAuth: true, title: '買家管理' } },
  { path: '/stats',    component: StatsView,     meta: { requiresAuth: true, title: '帳務統計' } },

  // ── 管理員登入頁（路徑由 .env 決定）──────────────
  {
    path: ADMIN_LOGIN_PATH,
    component: AdminLoginView,
    meta: { noSidebar: true, title: '登入' },
  },

  // ── 客戶訂購頁（無 sidebar、無需 admin auth）──────
  {
    path: '/shop',
    component: ShopView,
    meta: { noSidebar: true, title: 'まるこ 代購選物🌸' },
  },

  // ── 其他所有不存在的路徑 → 404 頁面
  { path: '/:pathMatch(.*)*', component: NotFoundView, meta: { noSidebar: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Navigation Guard：保護後台路由 ─────────────────
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { path: ADMIN_LOGIN_PATH }
  }
  return true
})
