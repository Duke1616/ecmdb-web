<template>
  <div class="form-section" :class="[themeColor]">
    <div class="section-header">
      <div class="header-main">
        <div class="icon-wrapper">
          <slot name="icon">
            <span class="title-icon">{{ icon }}</span>
          </slot>
        </div>
        <div class="title-container">
          <div class="title-row">
            <span class="section-title">{{ title }}</span>
            <el-tooltip v-if="tooltip" effect="dark" :content="tooltip" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <span v-if="subtitle" class="section-subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <div class="header-extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="section-content" v-if="$slots.default">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  tooltip?: string
  icon?: string
  themeColor?: "blue" | "purple" | "orange" | "green" | "slate"
}

import { QuestionFilled } from "@element-plus/icons-vue"

withDefaults(defineProps<Props>(), {
  icon: "📝",
  themeColor: "blue"
})
</script>

<style scoped lang="scss">
.form-section {
  position: relative;
  padding: 16px 0; // 移除左右内边距，完全由父级控制
  border-bottom: 1px solid #f1f5f9; // 列表式分割线

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px; // 进一步收紧内容间距

  .header-main {
    display: flex;
    align-items: center;
    gap: 14px;
  }
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 18px;
  transition: all 0.3s ease;

  // 主题配色
  .blue & {
    color: #2563eb;
    background: #eff6ff;
    border-color: #dbeafe;
  }
  .purple & {
    color: #7c3aed;
    background: #f5f3ff;
    border-color: #ede9fe;
  }
  .orange & {
    color: #d97706;
    background: #fffbeb;
    border-color: #fef3c7;
  }
  .green & {
    color: #059669;
    background: #ecfdf5;
    border-color: #d1fae5;
  }
}

.title-container {
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.help-icon {
  font-size: 14px;
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s;

  &:hover {
    color: #64748b;
  }
}

.section-subtitle {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.section-content {
  padding-left: 0;
}
</style>
