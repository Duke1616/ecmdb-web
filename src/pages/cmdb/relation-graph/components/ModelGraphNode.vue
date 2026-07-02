<template>
  <div class="custom-node" :style="{ '--theme-color': node.color || '#3B82F6' }">
    <div class="node-indicator" />
    <div class="node-main">
      <div class="node-icon">
        <AppIcon v-if="node.data?.icon" :name="String(node.data.icon)" fallback="Box" class="node-app-icon" />
        <span v-else class="node-icon-fallback">{{ displayInitial }}</span>
      </div>
      <div class="node-info">
        <span class="node-label" :title="displayText">{{ displayText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { RGNode } from "relation-graph-vue3"
import AppIcon from "@/common/components/AppIcon/index.vue"

const props = defineProps<{
  node: RGNode
}>()

const displayText = computed(() => props.node.text || "")
const displayInitial = computed(() => displayText.value.charAt(0).toUpperCase())
</script>

<style lang="scss" scoped>
.custom-node {
  display: flex;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  cursor: pointer;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
    border-color: var(--theme-color);
  }
}

.node-indicator {
  width: 6px;
  height: 100%;
  background: var(--theme-color);
  flex-shrink: 0;
}

.node-main {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 0 6px;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.node-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: #f1f5f9;
  color: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.node-app-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
  color: var(--theme-color);
}

.node-icon-fallback {
  pointer-events: none;
  user-select: none;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.node-label {
  color: #1e293b;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
</style>
