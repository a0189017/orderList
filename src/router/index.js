import { createRouter, createWebHistory } from 'vue-router'
import ProductsView from '../views/ProductsView.vue'
import BuyersView from '../views/BuyersView.vue'
import OrdersView from '../views/OrdersView.vue'
import StatsView from '../views/StatsView.vue'
import ShopView from '../views/ShopView.vue'

const routes = [
  // ===== 管理後台 =====
  { path: '/', redirect: '/orders' },
  { path: '/orders',   component: OrdersView,   meta: { title: '訂單管理' } },
  { path: '/products', component: ProductsView,  meta: { title: '商品管理' } },
  { path: '/buyers',   component: BuyersView,    meta: { title: '買家管理' } },
  { path: '/stats',    component: StatsView,     meta: { title: '帳務統計' } },

  // ===== 客戶訂購頁（無側邊欄） =====
  {
    path: '/shop',
    component: ShopView,
    meta: {
      title: '代購訂購',
      noSidebar: true,   // App.vue 根據此 flag 隱藏側邊欄
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
