<template>
  <section class="config-row collapsible" :class="{ is_open: isExpanded }">
    <div class="row-label clickable" @click="toggle">
      <el-icon class="arrow-icon" :class="{ rot: isExpanded }"><CaretRight /></el-icon>
      {{ title }}
    </div>
    <div class="row-content">
      <div class="preview-link" @click="toggle">
        <slot name="preview" />
      </div>
      <el-collapse-transition>
        <div v-show="isExpanded" class="embedded-panel" :class="panelClass">
          <slot />
        </div>
      </el-collapse-transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CaretRight } from "@element-plus/icons-vue"

// 该组件为纯 UI 状态控制组件，使用 defineModel 允许父组件同步或控制其展开状态
const isExpanded = defineModel<boolean>("expanded", { default: false })

defineProps<{
  title: string
  panelClass?: string
}>()

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
.config-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  &.no-border {
    border-bottom: none;
  }

  .row-label {
    width: 100px;
    flex-shrink: 0;
    font-size: 13px;
    color: #333;
    padding-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;

    .arrow-icon {
      color: #bfbfbf;
      transition: transform 0.2s;
      &.rot {
        transform: rotate(90deg);
        color: #0070cc;
      }
    }

    &.clickable {
      cursor: pointer;
      &:hover {
        color: #0070cc;
      }
    }
  }

  .row-content {
    flex: 1;
    min-width: 0;
    padding-left: 8px;
  }
}

.preview-link {
  display: inline-block;
  font-size: 13px;
  color: #0070cc;
  cursor: pointer;
  padding: 4px 0;
  &:hover {
    color: #00559e;
  }
  .placeholder-text {
    color: #ccc;
    font-style: italic;
  }
}

.embedded-panel {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  padding: 16px;

  &.full-bleed {
    padding: 0;
  }

  &.no-border-panel {
    border: none;
  }
}
</style>
