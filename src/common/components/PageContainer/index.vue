<template>
  <div class="page-container">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// 通用页面容器组件
// 提供统一的页面布局样式和高度处理
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
}
</style>
