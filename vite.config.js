import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // 允許所有 host 連線（ngrok、手機測試、LIFF 開發都需要）
    allowedHosts: true,
    // 若需要指定 port 可取消下方註解
    // port: 5173,
  },
})
