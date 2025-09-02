<template>
  <div class="form-section">
    <div class="section-title">
      <span class="title-icon">{{ icon }}</span>
      <span>{{ title }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: "📝"
})
</script>

<style scoped lang="scss">
.form-section {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  .title-icon {
    font-size: 16px;
  }
}
</style>
