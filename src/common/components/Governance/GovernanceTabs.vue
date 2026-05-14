<script setup lang="ts">
/**
 * 治理页面专用 Tabs 容器
 * 封装了 .governance-tabs-card 和 .governance-raw-tabs 的样式
 * 支持 v-model 同步当前激活页签
 */
defineOptions({
  name: "GovernanceTabs",
  inheritAttrs: false
})

const activeTab = defineModel<string>()
</script>

<template>
  <div class="governance-tabs-card">
    <el-tabs v-model="activeTab" class="governance-raw-tabs" v-bind="$attrs">
      <slot />
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.governance-tabs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 24px 24px;
}

.governance-raw-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  &.is-active {
    color: var(--gov-brand, #3b82f6);
  }
  &.is-disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
}

:deep(.el-tabs__active-bar) {
  background-color: var(--gov-brand, #3b82f6);
  height: 3px;
  border-radius: 2px;
}
</style>
