<script lang="ts" setup>
import { useRouter } from "vue-router"

const router = useRouter()

const backToHome = () => {
  router.push("/")
}
</script>

<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">500</h1>
      <h2 class="error-title">服务器内部错误</h2>
      <p class="error-desc">抱歉，后端服务似乎遇到了点麻烦。我们正在全力抢修中，请稍后再试。</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="backToHome"> 尝试刷新 </el-button>
        <el-button size="large" @click="() => router.back()"> 返回上一页 </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  font-family: "Inter", "PingFang SC", sans-serif;
}

.error-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: 800;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.error-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 20px;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
