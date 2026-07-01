<template>
  <div
    class="topology-node"
    :class="{
      'is-root': node.data?.kind === 'binding',
      'is-action': node.data?.kind === 'action',
      'is-active': selected
    }"
    @click.stop="emit('nodeClick', node)"
  >
    <el-dropdown
      class="topology-node-dropdown"
      trigger="click"
      placement="bottom-end"
      @command="(command) => emit('command', String(command) as TopologyNodeCommand, node)"
    >
      <button class="topology-node-menu" type="button" @click.stop>
        <el-icon><MoreFilled /></el-icon>
      </button>

      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="detail">查看详情</el-dropdown-item>
          <el-dropdown-item command="focus-root">查看根节点</el-dropdown-item>
          <el-dropdown-item command="fit">适配视图</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <div class="topology-node-icon">
      <AppIcon :name="node.data?.icon" fallback="Box" />
    </div>
    <div class="topology-node-copy">
      <div class="topology-node-name">{{ node.text }}</div>
      <div class="topology-node-model">
        {{ node.data?.subtitle || node.data?.model_name || node.data?.model_uid || "-" }}
      </div>
    </div>
    <div class="topology-node-badge">
      {{ badgeText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { MoreFilled } from "@element-plus/icons-vue"
import type { RGNode } from "relation-graph-vue3"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { cardinalityLabelMap } from "./usePluginTopologyGraph"
import type { TopologyNodeCommand } from "./types"

const props = defineProps<{
  node: RGNode
  selected: boolean
}>()

const emit = defineEmits<{
  command: [command: TopologyNodeCommand, node: RGNode]
  nodeClick: [node: RGNode]
}>()

const badgeText = computed(() => {
  if (props.node.data?.kind === "binding") return "模型"
  if (props.node.data?.kind === "action") return "动作"
  return cardinalityLabelMap[props.node.data?.cardinality || ""] || "-"
})
</script>

<style scoped lang="scss">
.topology-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 208px;
  height: 72px;
  padding: 10px 40px 10px 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #e5ebf3;
  border-radius: 12px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
  box-sizing: border-box;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &::before {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 3px;
    height: calc(100% - 20px);
    background: #dbe7fb;
    border-radius: 999px;
    content: "";
  }

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
    transform: translateY(-1px);
  }

  &.is-root {
    background: #f8fbff;
    border-color: #cfe0fb;

    &::before {
      background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
    }
  }

  &.is-action {
    background: #fcfaff;
    border-color: #eadcff;

    &::before {
      background: linear-gradient(180deg, #c084fc 0%, #8b5cf6 100%);
    }
  }

  &.is-active {
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.14);

    &::before {
      background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
    }
  }
}

.topology-node-dropdown {
  position: absolute;
  top: 8px;
  right: 8px;
}

.topology-node-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    color: #334155;
    background: #f8fafc;
  }
}

.topology-node:hover .topology-node-menu,
.topology-node.is-active .topology-node-menu {
  opacity: 1;
}

.topology-node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  margin-left: 4px;
  overflow: hidden;
  color: #2563eb;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5ebf3;
  border-radius: 10px;
  font-size: 18px;
}

.topology-node-copy {
  flex: 1;
  min-width: 0;
}

.topology-node-name {
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topology-node-model {
  margin-top: 4px;
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topology-node-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 7px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e5ebf3;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
