import { ref, readonly } from 'vue'
import { supabase } from '../supabase.js'

// ── 全域單例 ────────────────────────────────────────
const adminSession = ref(null)
const adminLoading = ref(true)

let initialized = false

export function useAdminAuth() {
  if (!initialized) {
    initialized = true

    // 初始化時讀取現有 session（頁面重整後維持登入狀態）
    supabase.auth.getSession().then(({ data }) => {
      adminSession.value = data.session
      adminLoading.value = false
    })

    // 監聽登入 / 登出事件
    supabase.auth.onAuthStateChange((_event, session) => {
      adminSession.value = session
    })
  }

  /**
   * 管理員登入
   * @param {string} email    - Supabase Auth 使用者 Email
   * @param {string} password - 密碼
   * @returns {{ error: string|null }}
   */
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    adminSession.value = null
  }

  return {
    adminSession: readonly(adminSession),
    adminLoading: readonly(adminLoading),
    signIn,
    signOut,
  }
}
