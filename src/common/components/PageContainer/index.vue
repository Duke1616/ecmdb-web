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
  padding: calc(1rem + 0.4vw);
}
</style>
