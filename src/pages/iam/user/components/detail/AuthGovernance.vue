<script setup lang="ts">
import { ref } from "vue"

const consoleAccess = ref(true)
</script>

<template>
  <section class="auth-settings-card">
    <header class="section-header">
      <div class="section-marker" />
      <div class="section-copy">
        <h3>登录与安全</h3>
      </div>
    </header>

    <div class="settings-list">
      <div class="setting-row">
        <div class="setting-main">
          <span class="setting-title">允许后台登录</span>
          <p class="setting-desc">关闭后，该用户将无法通过后台页面登录系统。</p>
        </div>
        <div class="setting-action">
          <el-switch v-model="consoleAccess" />
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-main">
          <span class="setting-title">二次验证设备</span>
          <p class="setting-desc">通过验证应用增加登录校验，提升账号安全性。</p>
        </div>
        <div class="setting-action">
          <el-button plain class="action-btn">去绑定</el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.auth-settings-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  min-height: 72px;
  border-bottom: 1px solid #f1f5f9;
}

.section-marker {
  width: 5px;
  height: 26px;
  border-radius: 999px;
  background: #3b82f6;
  flex-shrink: 0;
}

.section-copy {
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }
}

.settings-list {
  padding: 4px 24px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 88px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.setting-main {
  min-width: 0;
}

.setting-title {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.setting-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.setting-action {
  flex-shrink: 0;
}

.action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border-color: #dbe4ef;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
}
</style>
