<template>
  <div class="model-tabs-wrapper">
    <div class="model-tabs-scroll">
      <button
        v-for="model in models"
        :key="model.model_uid"
        class="model-tab-chip"
        :class="{ active: activeModelUid === model.model_uid }"
        @click="emit('select', model.model_uid)"
      >
        <el-icon class="model-icon"><Collection /></el-icon>
        <span class="model-label">{{ getDisplayName(model) }}</span>
        <span class="model-uid">({{ model.model_uid }})</span>
        <span class="model-count-badge">{{ model.total }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Collection } from "@element-plus/icons-vue"
import type { SearchModelItem } from "@/api/cmdb/resource/types/resource"

interface ModelTabsBarProps {
  models: SearchModelItem[]
  activeModelUid: string
  getDisplayName: (model: SearchModelItem) => string
}

defineProps<ModelTabsBarProps>()

const emit = defineEmits<{
  (e: "select", modelUid: string): void
}>()
</script>

<style scoped lang="scss">
.model-tabs-wrapper {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.04);
}

.model-tabs-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
}

.model-tab-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;

  .model-icon {
    font-size: 14px;
    color: #94a3b8;
  }

  .model-uid {
    font-size: 11px;
    font-weight: 400;
    color: #94a3b8;
  }

  .model-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: #e2e8f0;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
  }

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  &.active {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
    box-shadow: 0 4px 10px -2px rgba(37, 99, 235, 0.35);

    .model-icon,
    .model-uid {
      color: rgba(255, 255, 255, 0.8);
    }

    .model-count-badge {
      background: #ffffff;
      color: #2563eb;
    }
  }
}
</style>
