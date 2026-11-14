<template>
  <div class="form-section" :class="`is-${variant}`">
    <div class="section-header">
      <div class="section-icon">
        <slot name="icon" />
      </div>
      <div class="section-title">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description: string; variant?: "card" | "designer" }>(), {
  variant: "card"
})
</script>

<style scoped lang="scss">
.form-section {
  &.is-card {
    padding: 24px;
    border-bottom: 1px solid #f1f5f9;

    &:last-child {
      border-bottom: none;
    }

    @media (max-width: 480px) {
      padding: 20px;
    }
  }

  &.is-designer {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
  }
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.is-designer .section-header {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.section-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;

  :deep(svg),
  :deep(.el-icon) {
    width: 16px;
    height: 16px;
    font-size: 16px;
    color: white;
  }
}

.section-title {
  h3 {
    margin: 0 0 3px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.4;
  }
}
</style>