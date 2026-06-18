<template>
  <div class="premium-config-card">
    <div class="config-row">
      <div class="config-icon timer">
        <el-icon><Timer /></el-icon>
      </div>
      <div class="config-body">
        <div class="config-label">最大执行时间</div>
        <div class="config-desc">单次任务调度的最大生命周期（秒），超时将强制阻断执行</div>
      </div>
      <div class="config-action">
        <el-input-number v-model="maxExecution" :min="1" controls-position="right" class="premium-number-box" />
      </div>
    </div>

    <div class="config-divider" />

    <div class="config-row">
      <div class="config-icon refresh">
        <el-icon><RefreshRight /></el-icon>
      </div>
      <div class="config-body">
        <div class="config-label">最大重试次数</div>
        <div class="config-desc">执行失败或遭遇网络抖动时，系统自动发起重试的次数</div>
      </div>
      <div class="config-action">
        <el-input-number v-model="maxRetries" :min="0" :max="10" controls-position="right" class="premium-number-box" />
      </div>
    </div>

    <div class="sub-config-wrapper" :class="{ 'is-expanded': (maxRetries ?? 0) > 0 }">
      <div class="sub-config-inner">
        <div class="sub-config-grid">
          <div class="sub-config-item">
            <span class="sub-label">初始间隔 (ms)</span>
            <el-input-number
              v-model="initialInterval"
              :min="100"
              :step="100"
              controls-position="right"
              class="sub-number-box"
            />
          </div>
          <div class="sub-config-item">
            <span class="sub-label">最大间隔 (ms)</span>
            <el-input-number
              v-model="maxInterval"
              :min="initialInterval"
              :step="100"
              controls-position="right"
              class="sub-number-box"
            />
          </div>
        </div>
        <div class="sub-config-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>重试采用带抖动的指数退避算法，防止重试风暴</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Timer, RefreshRight, InfoFilled } from "@element-plus/icons-vue"

// NOTE: 该组件作为重试配置专属的控制器组件，针对特定的简单值字段使用独立 defineModel，满足规范要求
const maxExecution = defineModel<number | undefined>("maxExecutionSeconds")
const maxRetries = defineModel<number | undefined>("maxRetries")
const initialInterval = defineModel<number | undefined>("initialInterval")
const maxInterval = defineModel<number | undefined>("maxInterval")
</script>

<style scoped lang="scss">
.premium-config-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.config-row {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
  background: #ffffff;
  transition: background-color 0.2s;

  &:hover {
    background: #f8fafc;
  }
}

.config-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 20px;
  }

  &.timer {
    background: #fff1f2;
    color: #f43f5e;
  }

  &.refresh {
    background: #eff6ff;
    color: #3b82f6;
  }
}

.config-body {
  flex: 1;
  min-width: 0;
}

.config-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.config-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.config-action {
  flex-shrink: 0;
}

.config-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 16px;
}

.premium-number-box {
  width: 130px;
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: 1.5px solid #e2e8f0;
    transition: all 0.2s;
    background: #f8fafc;
    &:hover,
    &.is-focus,
    &.is-active {
      border-color: #3b82f6;
      background: #ffffff;
    }
  }
}

.sub-config-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
  border-top: 1px solid transparent;

  &.is-expanded {
    grid-template-rows: 1fr;
    border-top-color: #f1f5f9;
  }
}

.sub-config-inner {
  overflow: hidden;
}

.sub-config-grid {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.sub-config-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .sub-label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }
}

.sub-number-box {
  width: 100%;
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: 1.5px solid #cbd5e1;
    background: #ffffff;
    transition: border-color 0.2s;
    &:hover,
    &.is-focus {
      border-color: #3b82f6;
    }
  }
}

.sub-config-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px 16px;
  font-size: 11px;
  color: #059669;

  .el-icon {
    font-size: 14px;
  }
}
</style>
