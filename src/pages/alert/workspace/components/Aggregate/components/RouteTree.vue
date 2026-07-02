<template>
  <aside class="route-tree-panel">
    <div class="panel-header">
      <h5>路由树</h5>
    </div>

    <el-tree
      class="route-tree"
      node-key="id"
      :data="routeTree"
      :props="{ label: 'name', children: 'children' }"
      :current-node-key="selectedRouteId"
      :expand-on-click-node="false"
      default-expand-all
      highlight-current
      draggable
      :allow-drop="allowDrop"
      @node-drop="handleNodeDrop"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <div class="route-tree-node" :class="{ 'is-disabled': !data.enabled }">
          <div class="node-title">
            <el-icon class="node-type-icon"><Operation /></el-icon>
            <span class="node-name" :title="data.name">{{ data.name }}</span>
            <el-tag v-if="data.is_default" size="small" class="custom-badge badge-default">默认</el-tag>
            <el-tag v-if="!data.enabled" size="small" class="custom-badge badge-disabled">停用</el-tag>
          </div>
        </div>
      </template>
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Operation } from "@element-plus/icons-vue"
import type { AggregateGroupRule } from "@/api/alert/aggregate/types"

interface IRouteTreeNode extends AggregateGroupRule {
  children: IRouteTreeNode[]
}

const props = defineProps<{
  routes: AggregateGroupRule[]
  selectedRouteId?: number
}>()

const emit = defineEmits<{
  (e: "select", route: AggregateGroupRule): void
  (e: "reorder", payload: { draggedRouteId: number; targetParentId: number; targetPosition: number }): void
}>()

// 在子组件内自理扁平路由数组转化为树型结构的计算
const routeTree = computed<IRouteTreeNode[]>(() => {
  const nodes = props.routes.map<IRouteTreeNode>((route) => ({
    ...route,
    children: []
  }))
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const roots: IRouteTreeNode[] = []

  nodes.forEach((node) => {
    const parent = node.parent_id ? nodeMap.get(node.parent_id) : undefined
    if (parent) {
      parent.children.push(node)
      return
    }
    roots.push(node)
  })

  const sortNodes = (items: IRouteTreeNode[]) => {
    items.sort((a, b) => a.priority - b.priority || a.id - b.id)
    items.forEach((item) => sortNodes(item.children))
  }
  sortNodes(roots)

  return roots
})

function handleNodeClick(route: AggregateGroupRule) {
  emit("select", route)
}

function allowDrop(draggingNode: any, dropNode: any, type: string) {
  // 默认顶级根路由不能移动
  if (draggingNode.data.is_default && draggingNode.data.parent_id === 0) {
    return false
  }

  // 默认顶级根路由不能被抢占排序
  if (dropNode.data.is_default && dropNode.data.parent_id === 0) {
    if (type === "prev" || type === "inner") {
      return false
    }
  }

  // 任何路由都不能移到与顶级默认路由并列（即移到默认顶级路由的 prev 或 next 导致 parent_id 变成 0）
  if (dropNode.data.parent_id === 0) {
    if (type === "prev" || type === "next") {
      return false
    }
  }

  return true
}

function handleNodeDrop(draggingNode: any, dropNode: any, dropType: string, _ev: any) {
  let targetParentId = 0
  let parentNode = null

  if (dropType === "inner") {
    targetParentId = dropNode.data.id
    parentNode = dropNode
  } else {
    targetParentId = dropNode.data.parent_id || 0
    parentNode = dropNode.parent
  }

  if (!parentNode) return

  const siblingNodes = parentNode.childNodes || []
  const siblingIds = siblingNodes.map((node: any) => node.data.id as number)
  const targetPosition = siblingIds.indexOf(draggingNode.data.id)

  if (targetPosition !== -1) {
    emit("reorder", {
      draggedRouteId: draggingNode.data.id,
      targetParentId: targetParentId,
      targetPosition: targetPosition
    })
  }
}
</script>

<style lang="scss" scoped>
.route-tree-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none;
  border-right: 1px solid #e2e8f0;
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 37px;
  min-height: 37px;
  padding: 0 14px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0;
  box-sizing: border-box;
  flex-shrink: 0;

  h5 {
    margin: 0;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }
}

.route-tree {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
  background: transparent;
  position: relative;

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    align-items: center;
    border-radius: 6px;
    margin-bottom: 4px;
    border: 1px solid transparent;
    background: #f8fafc;
    transition: background-color 0.2s ease;
    padding-left: 8px !important;
    cursor: pointer;

    &:hover {
      background: #f1f5f9;
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: #eff6ff;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #3b82f6;
      border-radius: 3px 0 0 3px;
    }

    .node-name {
      color: #2563eb;
    }
    .node-type-icon {
      color: #2563eb !important;
    }
  }

  :deep(.el-tree-node) {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: -8px;
      top: -12px;
      bottom: 0;
      border-left: 1px dashed #cbd5e1;
      width: 1px;
      height: calc(100% + 12px);
    }

    &::after {
      content: "";
      position: absolute;
      left: -8px;
      top: 22px;
      border-top: 1px dashed #cbd5e1;
      width: 12px;
      height: 1px;
    }

    &:last-child::before {
      height: 34px;
    }
  }

  :deep(> .el-tree-node) {
    &::before,
    &::after {
      display: none;
    }
  }

  :deep(.el-tree-node__children) {
    padding-left: 18px;
    overflow: visible;
  }

  :deep(.el-tree-node__expand-icon) {
    z-index: 2;
    margin-right: 2px;
    color: #64748b;

    &.is-leaf {
      color: transparent;
    }
  }
}

.route-tree-node {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  padding: 2px 6px 2px 2px;

  &.is-disabled {
    opacity: 0.65;
    .node-name {
      text-decoration: line-through;
      color: #94a3b8;
    }
  }
}

.node-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  flex: 1;

  .node-type-icon {
    font-size: 13px;
    color: #64748b;
    flex-shrink: 0;
  }
}

.node-name {
  min-width: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.custom-badge {
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 9px;
  height: 16px;
  padding: 0 4px;
  line-height: 16px;

  &.badge-default {
    background: #f3e8ff;
    color: #7e22ce;
  }

  &.badge-disabled {
    background: #f1f5f9;
    color: #475569;
  }
}
</style>
