<template>
  <section class="workspace-section-page">
    <div class="section-toolbar">
      <div class="section-title">
        <h2>{{ title }}</h2>
        <span v-if="subtitle">{{ subtitle }}</span>
      </div>
      <div v-if="$slots.actions || primaryAction || secondaryAction" class="section-actions">
        <slot name="actions">
          <AuthButton
            v-if="secondaryAction"
            :type="secondaryAction.type || ''"
            :icon="secondaryAction.icon"
            :capability="secondaryAction.capability"
            :disable-mode="secondaryAction.disableMode ?? true"
            :loading="secondaryAction.loading"
            :disabled="secondaryAction.disabled"
            @click="emit('secondaryAction')"
          >
            {{ secondaryAction.label }}
          </AuthButton>
          <AuthButton
            v-if="primaryAction"
            :type="primaryAction.type || 'primary'"
            :icon="primaryAction.icon"
            :capability="primaryAction.capability"
            :disable-mode="primaryAction.disableMode ?? true"
            :loading="primaryAction.loading"
            :disabled="primaryAction.disabled"
            @click="emit('primaryAction')"
          >
            {{ primaryAction.label }}
          </AuthButton>
        </slot>
      </div>
    </div>

    <div class="section-body" :class="{ 'is-flush': flushBody }">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import AuthButton from "@/common/components/Auth/AuthButton.vue"

type SectionAction = {
  label: string
  capability?: string | string[]
  icon?: any
  type?: "primary" | "success" | "warning" | "danger" | "info" | ""
  loading?: boolean
  disabled?: boolean
  disableMode?: boolean
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    flushBody?: boolean
    primaryAction?: SectionAction
    secondaryAction?: SectionAction
  }>(),
  {
    subtitle: "",
    flushBody: true
  }
)

const emit = defineEmits<{
  primaryAction: []
  secondaryAction: []
}>()
</script>

<style lang="scss" scoped>
.workspace-section-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  min-height: 72px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  min-width: 0;

  h2 {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 800;
    line-height: 1.3;
  }

  span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 13px;
    line-height: 1.3;
  }
}

.section-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.section-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 20px;

  &.is-flush {
    padding: 0;
  }

  :deep(.manager-content) {
    min-height: 0;
  }

  :deep(.content-card) {
    border: 0;
    border-radius: 0;
  }
}

@media (max-width: 768px) {
  .section-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
