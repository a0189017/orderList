<template>
  <div class="notfound-page">
    <div class="notfound-card">
      <div class="sakura">🌸</div>
      <h1 class="code">404</h1>
      <p class="message">找不到這個頁面</p>
      <p class="sub">你造訪的網址不存在，或已移除</p>
      <a href="/shop" class="btn-home">回到訂購頁面</a>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.notfound-card {
  text-align: center;
}

.sakura {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}

.code {
  font-size: 96px;
  font-weight: 900;
  color: #e0e7ff;
  line-height: 1;
  margin-bottom: 12px;
  letter-spacing: -4px;
}

.message {
  font-size: 22px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.sub {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 32px;
}

.btn-home {
  display: inline-block;
  padding: 12px 32px;
  background: #6366f1;
  color: white;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-home:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}
</style>
