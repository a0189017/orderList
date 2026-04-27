<template>
  <!-- 客戶訂購頁：無側邊欄，直接全版面 -->
  <div v-if="route.meta.noSidebar" class="full-page">
    <RouterView />
  </div>

  <!-- 管理後台：有側邊欄 -->
  <div v-else class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">🛍️</div>
        <h1 class="brand">代購管理</h1>
      </div>
      <nav class="nav-menu">
        <RouterLink to="/orders" class="nav-item">
          <span class="nav-icon">📋</span>
          <span>訂單管理</span>
        </RouterLink>
        <RouterLink to="/products" class="nav-item">
          <span class="nav-icon">📦</span>
          <span>商品管理</span>
        </RouterLink>
        <RouterLink to="/buyers" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>買家管理</span>
        </RouterLink>
        <RouterLink to="/stats" class="nav-item">
          <span class="nav-icon">💰</span>
          <span>帳務統計</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <a href="/shop" target="_blank" class="shop-link">
          <span>🔗</span> 客戶訂購頁
        </a>
        <div class="admin-user" v-if="adminSession">
          <span class="admin-email">{{ adminSession.user.email }}</span>
          <button class="btn-admin-logout" @click="signOut">登出</button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from './composables/useAdminAuth.js'

const route  = useRoute()
const router = useRouter()
const { adminSession, signOut: authSignOut } = useAdminAuth()

async function signOut() {
  await authSignOut()
  router.push('/admin-login')
}
</script>

<style>
/* ===== 全域樣式 ===== */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #e0e7ff;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --sidebar-w: 220px;
  --radius: 10px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', sans-serif;
  background: var(--gray-50);
  color: var(--gray-800);
  font-size: 14px;
  line-height: 1.5;
}

/* 客戶頁全版面 */
.full-page { min-height: 100vh; }

/* ===== 版面 ===== */
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ===== 側邊欄 ===== */
.sidebar {
  width: var(--sidebar-w);
  background: var(--gray-900);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo { font-size: 24px; }
.brand { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }

.nav-menu {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}
.nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
.nav-item.router-link-active {
  background: var(--primary);
  color: white;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; }

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.shop-link {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 8px;
  color: rgba(255,255,255,0.5); font-size: 13px;
  text-decoration: none; transition: all 0.15s;
}
.shop-link:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); }

.admin-user {
  margin-top: 8px; padding: 10px 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.admin-email {
  display: block; font-size: 11px; color: rgba(255,255,255,0.4);
  margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.btn-admin-logout {
  width: 100%; padding: 7px; border-radius: 6px;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.1); font-size: 12px;
  cursor: pointer; transition: all 0.15s;
}
.btn-admin-logout:hover { background: rgba(239,68,68,0.25); color: #fca5a5; border-color: rgba(239,68,68,0.3); }

/* ===== 主內容 ===== */
.main-content {
  margin-left: var(--sidebar-w);
  flex: 1;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ===== 通用頁面元件 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px 20px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}
.page-title { font-size: 20px; font-weight: 700; color: var(--gray-900); }
.page-body { padding: 24px 32px; }

/* ===== 按鈕 ===== */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; font-size: 14px;
  font-weight: 500; border: none; cursor: pointer; transition: all 0.15s;
  text-decoration: none;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-danger { background: var(--danger); color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-ghost { background: transparent; color: var(--gray-600); border: 1px solid var(--gray-200); }
.btn-ghost:hover { background: var(--gray-50); border-color: var(--gray-300); }
.btn-sm { padding: 5px 10px; font-size: 13px; }
.btn-copy {
  background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
  padding: 5px 10px; border-radius: 6px; font-size: 12px;
  font-weight: 600; cursor: pointer; white-space: nowrap;
}
.btn-copy:hover { background: #d1fae5; }

/* ===== 卡片 ===== */
.card {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--gray-200);
}

/* ===== 表格 ===== */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th {
  text-align: left; padding: 10px 16px;
  font-size: 12px; font-weight: 600; color: var(--gray-500);
  background: var(--gray-50); border-bottom: 1px solid var(--gray-200);
  text-transform: uppercase; letter-spacing: 0.5px;
}
td {
  padding: 12px 16px; border-bottom: 1px solid var(--gray-100);
  color: var(--gray-700); vertical-align: middle;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--gray-50); }

/* ===== 狀態標籤 ===== */
.badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
}
.badge-pending  { background: #fef3c7; color: #92400e; }
.badge-paid     { background: #d1fae5; color: #065f46; }
.badge-shipped  { background: #dbeafe; color: #1e40af; }
.badge-done     { background: #f3f4f6; color: #374151; }
.badge-canceled { background: #fee2e2; color: #991b1b; }

/* ===== 模態框 ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 14px;
  width: 100%; max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}
.modal-title { font-size: 17px; font-weight: 700; }
.modal-close {
  background: var(--gray-100); border: none; cursor: pointer;
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--gray-500);
}
.modal-close:hover { background: var(--gray-200); }
.modal-body { padding: 20px 24px 24px; }

/* ===== 表單 ===== */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--gray-700); margin-bottom: 6px; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 9px 12px;
  border: 1.5px solid var(--gray-200); border-radius: 8px;
  font-size: 14px; color: var(--gray-800);
  transition: border-color 0.15s;
  background: white;
  font-family: inherit;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}
.form-textarea { resize: vertical; min-height: 80px; }
.form-hint { font-size: 12px; color: var(--gray-400); margin-top: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions {
  display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;
  padding-top: 16px; border-top: 1px solid var(--gray-100);
}

/* ===== 空狀態 ===== */
.empty-state {
  text-align: center; padding: 60px 20px; color: var(--gray-400);
}
.empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { font-size: 15px; }

/* ===== 搜尋/篩選欄 ===== */
.filter-bar {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px;
}
.search-input {
  flex: 1; max-width: 260px;
  padding: 8px 12px; border: 1.5px solid var(--gray-200);
  border-radius: 8px; font-size: 14px; background: white;
}
.search-input:focus { outline: none; border-color: var(--primary); }

/* ===== 統計卡 ===== */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: white; border-radius: var(--radius);
  padding: 20px; border: 1px solid var(--gray-200);
  box-shadow: var(--shadow);
}
.stat-label { font-size: 12px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--gray-900); }
.stat-value.green { color: var(--success); }
.stat-value.red { color: var(--danger); }
.stat-value.blue { color: var(--info); }

/* ===== 錯誤訊息 ===== */
.error-msg { color: var(--danger); font-size: 13px; margin-top: 4px; }
.loading { text-align: center; padding: 40px; color: var(--gray-400); }
</style>
