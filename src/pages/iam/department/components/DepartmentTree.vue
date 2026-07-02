<template>
  <div class="department-panel">
    <el-card class="department-card" v-loading="loading">
      <!-- 操作按钮区域 -->
      <div class="card-header">
        <div class="header-top">
          <h3 class="card-title">部门列表</h3>
          <span class="department-count">{{ departmentCount }} 个部门</span>
        </div>

        <div class="header-actions">
          <el-input
            v-model="filterInput"
            placeholder="搜索部门..."
            :prefix-icon="Search"
            class="search-input"
            clearable
          />
          <div class="action-buttons">
            <el-button size="small" type="primary" @click="emits('add-dept')" :icon="Plus"> 添加部门 </el-button>
            <el-button size="small" :disabled="!currentNodeKey" @click="emits('add-sub-dept')" :icon="FolderAdd">
              添加子部门
            </el-button>
            <el-button size="small" @click="handleToggleExpand" :icon="isExpand ? FolderOpened : Folder">
              {{ isExpand ? "收起" : "展开" }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 树形菜单区域 -->
      <div class="tree-container">
        <el-scrollbar class="tree-scrollbar">
          <el-tree
            v-if="departmentCount > 0"
            ref="treeRef"
            :data="treeData"
            node-key="id"
            :highlight-current="true"
            :expand-on-click-node="false"
            draggable
            @node-click="handleNodeClick"
            @node-drop="handleNodeDrop"
            :current-node-key="currentNodeKey || undefined"
            :props="defaultProps"
            :filter-node-method="filterNode"
            class="department-tree"
          />
          <div v-else class="empty-tree-state">
            <el-icon class="empty-icon" size="48">
              <FolderOpened />
            </el-icon>
            <p class="empty-text">暂无部门数据</p>
            <p class="empty-hint">点击上方"添加部门"按钮创建第一个部门</p>
          </div>
        </el-scrollbar>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, nextTick } from "vue"
import { Search, Plus, FolderAdd, FolderOpened, Folder } from "@element-plus/icons-vue"
import { ElTree, ElScrollbar } from "element-plus"
import type { IDepartmentNode } from "@/api/iam/department/type"

interface IDepartmentTreeProps {
  treeData: IDepartmentNode[]
  loading: boolean
  currentNodeKey: number | null
}

const props = defineProps<IDepartmentTreeProps>()

const emits = defineEmits<{
  (e: "node-click", node: IDepartmentNode): void
  (e: "add-dept"): void
  (e: "add-sub-dept"): void
  (e: "node-drop", data: { draggingId: number; parentId: number }): void
}>()

const filterInput = ref("")
const isExpand = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()

const defaultProps = {
  children: "children",
  label: "name",
  key: "id"
}

const departmentCount = computed(() => props.treeData?.length || 0)

// 节点点击事件分发
const handleNodeClick = (node: IDepartmentNode) => {
  emits("node-click", node)
}

interface ITreeNode {
  data: IDepartmentNode
}

// NOTE: 树节点拖拽完成回调。根据放置类型计算拖拽后节点的最新父节点 parentId 并向父组件发射更新事件
const handleNodeDrop = (draggingNode: ITreeNode, dropNode: ITreeNode, dropType: "before" | "after" | "inner") => {
  const parentId = dropType === "inner" ? dropNode.data.id : dropNode.data.parent_id || 0
  emits("node-drop", {
    draggingId: draggingNode.data.id,
    parentId
  })
}

// 树搜索过滤规则
const filterNode = (value: string, data: Record<string, any>) => {
  if (!value) return true
  return typeof data.name === "string" && data.name.includes(value)
}

// 监听搜索词变化触发过滤
watch(filterInput, (val) => {
  treeRef.value?.filter(val)
})

// NOTE: 监听当前高亮选中的 key 或树结构数据的变化，在变化后重新高亮当前节点，防止树数据重载（例如新增、修改、删除部门）时高亮状态丢失
watch(
  [() => props.currentNodeKey, () => props.treeData],
  () => {
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.setCurrentKey(props.currentNodeKey ?? undefined)
      }
    })
  },
  { immediate: true }
)

// 递归设置节点的展开或收起状态
const toggleAllNodes = (expanded: boolean) => {
  const nodesMap = treeRef.value?.store?.nodesMap
  if (!nodesMap) return

  const toggleRecursive = (list: IDepartmentNode[]) => {
    for (const item of list) {
      if (nodesMap[item.id]) {
        nodesMap[item.id].expanded = expanded
      }
      if (item.children && item.children.length > 0) {
        toggleRecursive(item.children)
      }
    }
  }

  toggleRecursive(props.treeData)
}

// 切换展开/收起状态
const handleToggleExpand = () => {
  isExpand.value = !isExpand.value
  toggleAllNodes(isExpand.value)
}

defineExpose({
  treeRef
})
</script>

<style lang="scss" scoped>
.department-panel {
  flex: 0 0 calc(19rem + 2vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.department-card {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: calc(0.4rem + 0.1vw);
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
}

.card-header {
  flex-shrink: 0;
  padding: calc(0.8rem + 0.2vw);
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: calc(0.6rem + 0.1vw);

    .card-title {
      margin: 0;
      font-size: calc(0.8rem + 0.1vw);
      font-weight: 600;
      color: #374151;
    }

    .department-count {
      background: #f3f4f6;
      color: #6b7280;
      padding: calc(0.1rem + 0.05vw) calc(0.4rem + 0.1vw);
      border-radius: calc(0.2rem + 0.05vw);
      font-size: calc(0.6rem + 0.1vw);
    }
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: calc(0.6rem + 0.1vw);

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: calc(0.3rem + 0.1vw);
        border: 1px solid #d1d5db;
        background: white;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      }

      :deep(.el-input__inner) {
        height: calc(1.6rem + 0.2vw);
        font-size: calc(0.7rem + 0.1vw);
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: calc(0.2rem + 0.05vw);
      width: 100%;

      .el-button {
        border-radius: calc(0.3rem + 0.1vw);
        font-size: calc(0.6rem + 0.1vw);
        padding: calc(0.3rem + 0.1vw) calc(0.4rem + 0.1vw);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.el-button--small {
          height: calc(1.4rem + 0.2vw);
          min-width: 0;
        }
      }
    }
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  padding: calc(0.6rem + 0.2vw);

  .tree-scrollbar {
    height: 100%;
  }

  .department-tree {
    height: 100%;

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

  .empty-tree-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    padding: calc(1rem + 0.2vw);
    text-align: center;

    .empty-icon {
      color: #d1d5db;
      margin-bottom: calc(0.8rem + 0.2vw);
    }

    .empty-text {
      margin: 0 0 calc(0.4rem + 0.1vw) 0;
      font-size: calc(0.8rem + 0.1vw);
      font-weight: 500;
      color: #6b7280;
    }

    .empty-hint {
      margin: 0;
      font-size: calc(0.7rem + 0.1vw);
      color: #9ca3af;
      line-height: 1.4;
    }
  }
}
</style>
