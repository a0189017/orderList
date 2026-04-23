import { ref, readonly } from 'vue'
import { supabase } from '../supabase.js'

// 全域單例 state（只建立一次）
const session = ref(null)
const buyer = ref(null)
const loading = ref(true)

let initialized = false

/**
 * 根據 Supabase auth session 查找或自動建立 buyer 記錄
 * 利用 LINE 登入後取得的 user_metadata 自動填入名稱與頭貼
 */
async function syncBuyer(authUser) {
  if (!authUser) { buyer.value = null; return }

  // 先嘗試查找現有 buyer（by auth_user_id）
  const { data: existing } = await supabase
    .from('buyers')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (existing) {
    buyer.value = existing
    return
  }

  // 取出 LINE 提供的使用者資訊
  const meta = authUser.user_metadata || {}
  const lineName    = meta.name || meta.full_name || meta.preferred_username || 'LINE 用戶'
  const lineAvatar  = meta.avatar_url || meta.picture || null
  const lineUserId  = meta.provider_id || meta.sub || null

  // 建立新 buyer 記錄
  const { data: created, error } = await supabase
    .from('buyers')
    .insert({
      name: lineName,
      auth_user_id: authUser.id,
      line_user_id: lineUserId,
      line_display_name: lineName,
      line_avatar_url: lineAvatar,
    })
    .select()
    .single()

  if (!error) buyer.value = created
}

export function useAuth() {
  if (!initialized) {
    initialized = true

    // 初始化時讀取現有 session
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      syncBuyer(data.session?.user ?? null).finally(() => {
        loading.value = false
      })
    })

    // 監聽 auth 狀態變化（包括 OAuth callback 回來時）
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      syncBuyer(newSession?.user ?? null)
    })
  }

  /**
   * 用 LINE 登入
   * @param {string} redirectTo - OAuth 完成後回到的 URL（含 query params）
   */
  async function signInWithLine(redirectTo) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'line',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/shop`,
        scopes: 'profile openid',
      },
    })
    if (error) console.error('LINE 登入失敗:', error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    buyer.value = null
    session.value = null
  }

  return {
    session: readonly(session),
    buyer: readonly(buyer),
    loading: readonly(loading),
    signInWithLine,
    signOut,
  }
}
