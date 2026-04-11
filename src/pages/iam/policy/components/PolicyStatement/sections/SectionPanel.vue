<template>
  <section class="config-row collapsible" :class="{ is_open: isExpanded }">
    <div class="row-label" :class="{ clickable: !noArrow }" @click="!noArrow && toggle()">
      <div class="arrow-container">
        <el-icon v-if="!noArrow" class="arrow-icon" :class="{ rot: isExpanded }"><CaretRight /></el-icon>
      </div>
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="required-star">*</span>
    </div>
    <div class="row-content">
      <div class="preview-container">
        <div class="preview-link" :class="{ clickable: !noArrow }" @click="!noArrow && toggle()">
          <slot name="preview" />
        </div>
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

const isExpanded = defineModel<boolean>("expanded", { default: false })

defineProps<{
  label: string
  panelClass?: string
  required?: boolean
  noArrow?: boolean
}>()

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
.config-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 14px;
  border-bottom: 1px solid #f2f2f2;

  .row-label {
    width: 115px;
    flex-shrink: 0;
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: flex-start;
    height: 32px; /* 强制对齐到 Element 行为高度 */
    font-size: 15px;
    color: #333;
    white-space: nowrap;

    .arrow-container {
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .label-text {
      font-weight: 600;
      color: #1e293b; /* 采用 1e293b 背景更沉稳，对比度更高 */
    }

    .required-star {
      color: #f56c6c;
      font-size: 15px;
      margin-left: 3px;
      font-family: SimSun, serif;
    }

    .arrow-icon {
      color: #bfbfbf;
      transition: transform 0.2s;
      &.rot {
        transform: rotate(90deg);
        color: #409eff;
      }
    }
  }

  .row-content {
    flex: 1;
    min-width: 0;
    padding-left: 4px;

    .preview-container {
      height: 32px; /* 强制与左侧 label 容器高度一致 */
      display: flex;
      align-items: center; /* 实现内容垂直对齐的核心 */
    }
  }
}

.clickable {
  cursor: pointer;
  &:hover {
    color: #409eff;
    opacity: 0.8;
  }
}

.preview-link {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.embedded-panel {
  margin-top: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  padding: 16px;
  &.full-bleed {
    padding: 0;
  }
}
</style>
