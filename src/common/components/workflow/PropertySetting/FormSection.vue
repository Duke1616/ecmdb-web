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
import { QuestionFilled } from "@element-plus/icons-vue"

interface Props {
  title: string
  subtitle?: string
  tooltip?: string
  icon?: string
  themeColor?: "blue" | "purple" | "orange" | "green" | "slate"
}

withDefaults(defineProps<Props>(), {
  icon: "📝",
  themeColor: "blue"
})
</script>

<style scoped lang="scss">
.form-section {
  position: relative;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .header-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 16px;
  transition: all 0.2s ease;

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
  .slate & {
    color: #475569;
    background: #f8fafc;
    border-color: #e2e8f0;
  }
}

.title-container {
  display: flex;
  flex-direction: column;

  .title-row {
    display: flex;
    align-items: center;
    gap: 6px;

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .help-icon {
      font-size: 13px;
      color: #94a3b8;
      cursor: help;
      transition: color 0.2s;

      &:hover {
        color: #64748b;
      }
    }
  }

  .section-subtitle {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }
}

.section-content {
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
  :deep(.el-form-item:only-child) {
    margin-bottom: 0;
  }
}
</style>
