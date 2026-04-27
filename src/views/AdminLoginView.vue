<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <span class="login-logo">🛍️</span>
        <h1 class="login-title">まるこ 代購</h1>
        <p class="login-sub">管理後台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">帳號 (Email)</label>
          <input
            class="form-input"
            type="email"
            v-model="email"
            placeholder="輸入管理員 Email"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密碼</label>
          <div class="password-wrap">
            <input
              class="form-input"
              :type="showPw ? 'text' : 'password'"
              v-model="password"
              placeholder="輸入密碼"
              autocomplete="current-password"
              required
            />
            <button type="button" class="pw-toggle" @click="showPw = !showPw">
              {{ showPw ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="btn-login" type="submit" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'

const router = useRouter()
const { signIn } = useAdminAuth()

const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const loading  = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value  = true
  const { error } = await signIn(email.value, password.value)
  loading.value = false
  if (error) {
    errorMsg.value = '帳號或密碼錯誤，請再試一次'
    return
  }
  router.push('/orders')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
}

.login-brand {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo  { font-size: 48px; display: block; margin-bottom: 12px; }
.login-title { font-size: 22px; font-weight: 800; color: #1f2937; margin-bottom: 4px; }
.login-sub   { font-size: 13px; color: #9ca3af; font-weight: 500; letter-spacing: 0.5px; }

.login-form { display: flex; flex-direction: column; gap: 0; }

.form-group  { margin-bottom: 18px; }
.form-label  {
  display: block; font-size: 13px; font-weight: 600;
  color: #374151; margin-bottom: 6px;
}
.form-input  {
  width: 100%; padding: 11px 14px;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: 14px; color: #1f2937;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #f9fafb;
}
.form-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.password-wrap { position: relative; }
.password-wrap .form-input { padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  font-size: 16px; padding: 2px;
  color: #9ca3af;
}

.error-msg {
  background: #fef2f2; color: #dc2626;
  border: 1px solid #fecaca; border-radius: 8px;
  padding: 10px 14px; font-size: 13px;
  margin-bottom: 16px;
}

.btn-login {
  width: 100%; padding: 13px;
  background: #6366f1; color: white;
  font-size: 15px; font-weight: 700;
  border: none; border-radius: 10px;
  cursor: pointer; transition: all 0.15s;
  margin-top: 4px;
}
.btn-login:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
