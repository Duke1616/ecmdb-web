<template>
  <div class="menu-drag-tree">
    <!-- 树形菜单区域 -->
    <div class="tree-container">
      <el-scrollbar class="tree-scrollbar">
        <el-tree
          ref="treeRef"
          :data="menuTreeData"
          show-checkbox
          node-key="id"
          :highlight-current="true"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
          :current-node-key="currentNodeKey || undefined"
          :props="defaultProps"
          :filter-node-method="filterNode"
          :draggable="isDragMode"
          :allow-drop="allowDrop"
          @node-drop="handleDragEnd"
          class="menu-tree"
          :class="{ 'drag-mode': isDragMode }"
        />
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import type { menu } from "@/api/menu/types/menu"
import { MenuType } from "@/api/menu/types/menu"

interface Props {
  menuTreeData: menu[]
  currentNodeKey: number | null
  isDragMode: boolean
  filterNode: (value: string, data: any) => boolean
  defaultProps: any
}

interface Emits {
  (e: "node-click", node: menu): void
  (e: "drag-end", dragNode: any, dropNode: any, dropType: string): void
}

withDefaults(defineProps<Props>(), {
  menuTreeData: () => [],
  currentNodeKey: null,
  isDragMode: false,
  filterNode: () => true,
  defaultProps: () => ({})
})

const emit = defineEmits<Emits>()

const treeRef = ref<InstanceType<typeof import("element-plus").ElTree>>()

// 处理菜单节点点击
const handleNodeClick = (node: menu) => {
  emit("node-click", node)
}

// 处理拖拽结束
const handleDragEnd = (dragNode: any, dropNode: any, dropType: string) => {
  emit("drag-end", dragNode, dropNode, dropType)
}

// 拖拽前验证
const allowDrop = (dragNode: any, dropNode: any, type: string) => {
  // 不允许拖拽到自身
  if (dragNode.id === dropNode.id) {
    return false
  }

  // 不允许将父节点拖拽到子节点下
  if (type === "inner" && isChildNode(dragNode, dropNode)) {
    return false
  }

  // 获取拖拽节点和目标父节点的类型
  const dragType = dragNode.data.type
  let parentType = 0 // 0 代表根节点

  if (type === "inner") {
    // 放入 dropNode 内部，父节点即为 dropNode
    parentType = dropNode.data.type
  } else {
    // 放入 dropNode 前后，父节点为 dropNode 的父节点
    if (dropNode.parent && dropNode.parent.level > 0) {
      parentType = dropNode.parent.data.type
    }
  }

  // 规则校验
  // 1. Directory(1) 下可以是: Directory(1), Menu(2), Button(3)
  // 2. Menu(2) 下可以是: Menu(2), Button(3)
  // 3. Button(3) 下可以是: Button(3)
  // 4. 根节点(0) 下一般不放 Button

  if (parentType === 0) {
    // 根节点禁止放按钮
    if (dragType === MenuType.BUTTON) return false
  } else if (parentType === MenuType.DIRECTORY) {
    // 目录节点下允许所有 (逻辑上暂无限制，符合 user: 目录 -> 目录/菜单/按钮)
  } else if (parentType === MenuType.MENU) {
    // 菜单节点下禁止放目录
    if (dragType === MenuType.DIRECTORY) return false
  } else if (parentType === MenuType.BUTTON) {
    // 按钮节点下禁止放目录和菜单
    if (dragType !== MenuType.BUTTON) return false
  }

  return true
}

// 检查是否为子节点
const isChildNode = (parentNode: any, childNode: any): boolean => {
  if (!parentNode.children || parentNode.children.length === 0) {
    return false
  }

  for (const child of parentNode.children) {
    if (child.id === childNode.id) {
      return true
    }
    if (isChildNode(child, childNode)) {
      return true
    }
  }

  return false
}

// 暴露方法给父组件
defineExpose({
  treeRef
})
</script>

<style lang="scss" scoped>
.menu-drag-tree {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.drag-tip {
  position: absolute;
  top: calc(0.4rem + 0.2vw);
  left: 50%;
  transform: translateX(-50%);
  background: #fef3c7;
  color: #92400e;
  padding: calc(0.3rem + 0.1vw) calc(0.6rem + 0.2vw);
  border-radius: calc(0.3rem + 0.1vw);
  font-size: calc(0.6rem + 0.1vw);
  z-index: 10;
  border: 1px solid #fbbf24;
  display: flex;
  align-items: center;
  gap: calc(0.3rem + 0.1vw);
  box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);

  .el-icon {
    font-size: calc(0.7rem + 0.1vw);
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: calc(0.6rem + 0.2vw);
  overflow: hidden;
}

.tree-scrollbar {
  height: 100%;
  max-height: 100%;
}

/* 树形节点样式 */
.menu-tree {
  flex: 1;
  min-height: 0;

  :deep(.el-tree-node) {
    .el-tree-node__content {
      height: calc(1.8rem + 0.3vw);
      padding: 0 calc(0.6rem + 0.2vw);
      border-radius: calc(0.3rem + 0.1vw);
      margin-bottom: calc(0.1rem + 0.05vw);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;

      &:hover {
        background: #f9fafb;
      }
    }

    &.is-current > .el-tree-node__content {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 500;
    }

    .el-tree-node__expand-icon {
      color: #9ca3af;
      font-size: calc(0.7rem + 0.1vw);
      margin-right: calc(0.4rem + 0.1vw);
    }

    .el-tree-node__label {
      font-size: calc(0.7rem + 0.1vw);
      color: #374151;
      font-weight: 500;
    }

    .el-checkbox {
      margin-right: calc(0.4rem + 0.1vw);
    }
  }
}

/* 拖拽模式样式 */
.menu-tree.drag-mode {
  :deep(.el-tree-node) {
    .el-tree-node__content {
      cursor: move;
      transition: all 0.3s ease;
      height: calc(1.8rem + 0.3vw);
      padding: 0 calc(0.6rem + 0.2vw);
      border-radius: calc(0.3rem + 0.1vw);
      margin-bottom: calc(0.1rem + 0.05vw);
      display: flex;
      align-items: center;
      position: relative;

      &:hover {
        background-color: #f0f9ff;
        border: 1px dashed #3b82f6;
      }

      &::before {
        content: "⋮⋮";
        position: absolute;
        left: calc(0.4rem + 0.1vw);
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: calc(0.6rem + 0.1vw);
        line-height: 1;
        letter-spacing: -1px;
        z-index: 1;
      }
    }

    &.is-dragging {
      .el-tree-node__content {
        background-color: #dbeafe;
        border: 1px solid #3b82f6;
        box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.4rem + 0.1vw) rgba(59, 130, 246, 0.3);
      }
    }

    .el-tree-node__expand-icon {
      display: none;
    }

    .el-tree-node__label {
      margin-left: calc(1rem + 0.2vw);
      font-size: calc(0.7rem + 0.1vw);
      color: #374151;
      font-weight: 500;
    }

    .el-checkbox {
      margin-right: calc(0.4rem + 0.1vw);
      margin-left: calc(1rem + 0.2vw);
    }
  }
}
</style>
