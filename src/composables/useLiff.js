import liff from '@line/liff'
import { ref, readonly } from 'vue'
import { supabase } from '../supabase.js'

// ── 全域單例（只初始化一次）────────────────────────
const loading   = ref(true)
const loggedIn  = ref(false)
const profile   = ref(null)
const buyer     = ref(null)
const initError = ref(null)   // LIFF init 錯誤
const buyerError = ref(null)  // DB 同步錯誤（新增，讓 UI 能顯示）

let initialized = false

async function syncBuyer(lineProfile) {
  buyerError.value = null

  // 1. 查找現有買家
  const { data: existing, error: findError } = await supabase
    .from('buyers')
    .select('*')
    .eq('line_user_id', lineProfile.userId)
    .maybeSingle()

  if (findError) {
    // 最常見原因：migration v2 還沒跑，line_user_id 欄位不存在
    buyerError.value = `查詢買家失敗：${findError.message}`
    console.error('[useLiff] syncBuyer find error:', findError)
    return
  }

  if (existing) {
    // 同步 LINE 顯示名稱與頭貼（若有變更）
    const nameChanged   = existing.line_display_name !== lineProfile.displayName
    const avatarChanged = existing.line_avatar_url   !== lineProfile.pictureUrl

    if (nameChanged || avatarChanged) {
      const updates = {
        line_display_name: lineProfile.displayName,
        line_avatar_url:   lineProfile.pictureUrl ?? null,
      }
      // 只在買家名稱仍等於舊 LINE 名稱時才一起更新（保留賣家手動改過的名稱）
      if (existing.name === existing.line_display_name) {
        updates.name = lineProfile.displayName
      }
      const { data: updated, error: updateError } = await supabase
        .from('buyers').update(updates).eq('id', existing.id).select().single()

      if (updateError) {
        console.warn('[useLiff] syncBuyer update error:', updateError)
        buyer.value = existing   // 更新失敗仍使用舊資料，不卡住
      } else {
        buyer.value = updated
      }
    } else {
      buyer.value = existing
    }
    return
  }

  // 2. 第一次登入 → 建立新買家
  const { data: created, error: insertError } = await supabase
    .from('buyers')
    .insert({
      name:              lineProfile.displayName,
      line_user_id:      lineProfile.userId,
      line_display_name: lineProfile.displayName,
      line_avatar_url:   lineProfile.pictureUrl ?? null,
    })
    .select()
    .single()

  if (insertError) {
    buyerError.value = `建立買家失敗：${insertError.message}`
    console.error('[useLiff] syncBuyer insert error:', insertError)
    return
  }

  buyer.value = created
}

export function useLiff() {
  if (!initialized) {
    initialized = true

    const liffId = import.meta.env.VITE_LIFF_ID

    if (!liffId) {
      initError.value = '未設定 VITE_LIFF_ID，請檢查 .env 檔案'
      loading.value = false
      return buildReturn()
    }

    liff
      .init({ liffId })
      .then(async () => {
        if (liff.isLoggedIn()) {
          loggedIn.value = true
          const p = await liff.getProfile()
          profile.value = p
          await syncBuyer(p)
        }
      })
      .catch((e) => {
        initError.value = e.message ?? 'LIFF 初始化失敗'
        console.error('[useLiff] init error:', e)
      })
      .finally(() => {
        loading.value = false
      })
  }

  return buildReturn()
}

function buildReturn() {
  function login() {
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href })
    }
  }

  function logout() {
    liff.logout()
    loggedIn.value  = false
    profile.value   = null
    buyer.value     = null
    buyerError.value = null
  }

  return {
    loading:    readonly(loading),
    loggedIn:   readonly(loggedIn),
    profile:    readonly(profile),
    buyer:      readonly(buyer),
    initError:  readonly(initError),
    buyerError: readonly(buyerError),
    login,
    logout,
  }
}
