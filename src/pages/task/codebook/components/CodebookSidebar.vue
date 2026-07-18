<template>
  <aside class="codebook-sidebar">
    <div class="sidebar-project-header">
      <el-button :icon="ArrowLeft" link @click="$emit('back')">返回项目</el-button>
      <div class="project-title-badge">
        <span class="project-icon-dot" />
        <span class="project-name" :title="activeProjectName">{{ activeProjectName }}</span>
      </div>
    </div>

    <div class="sidebar-filter">
      <el-input v-model="localKeyword" :prefix-icon="Search" placeholder="搜索资源" clearable />
    </div>

    <div class="sidebar-toolbar">
      <div>
        <div class="sidebar-title">资源树</div>
        <div class="sidebar-subtitle">{{ currentDirectoryName }}</div>
      </div>
      <el-tooltip content="刷新">
        <el-button :icon="RefreshRight" circle text @click="$emit('refresh')" />
      </el-tooltip>
    </div>

    <div class="tree-scroll" v-loading="treeLoading">
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="key"
        :props="treeProps"
        :current-node-key="selectedTreeKey"
        :default-expanded-keys="defaultExpandedKeys"
        highlight-current
        draggable
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        :expand-on-click-node="false"
        empty-text="暂无资源"
        @node-click="$emit('node-click', $event)"
        @node-contextmenu="handleContextMenu"
        @node-drop="handleDrop"
      >
        <template #default="{ data }">
          <div class="tree-node" :class="{ 'is-root': data.key.startsWith('layer:'), 'is-file': data.kind === 'FILE' }">
            <SvgIcon v-if="data.kind === 'FILE'" :name="getFileIconName(data.name)" size="15px" class="file-icon" />
            <el-icon v-else>
              <FolderOpened v-if="data.kind === 'DIRECTORY'" />
            </el-icon>
            <span class="tree-title">
              <span class="tree-label">{{ data.name }}</span>
              <el-tooltip v-if="data.readonly" content="已发布制品，只读" placement="top" :show-after="300">
                <el-icon class="readonly-lock"><Lock /></el-icon>
              </el-tooltip>
            </span>
          </div>
        </template>
      </el-tree>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { ArrowLeft, FolderOpened, Lock, RefreshRight, Search } from "@element-plus/icons-vue"
import { getFileIconName } from "../composables/useCodebookFile"
import { type CodebookTreeNode, type TreeDropType, type TreeNodeLike } from "../composables/useCodebookTree"

const props = defineProps<{
  activeProjectName: string
  currentDirectoryName: string
  keyword: string
  selectedTreeKey: string
  treeData: CodebookTreeNode[]
  treeProps: Record<string, string>
  treeLoading: boolean
  allowDrag: (node: TreeNodeLike) => boolean
  allowDrop: (draggingNode: TreeNodeLike, dropNode: TreeNodeLike, type: TreeDropType) => boolean
}>()

const emit = defineEmits<{
  (e: "update:keyword", value: string): void
  (e: "back"): void
  (e: "refresh"): void
  (e: "node-click", data: CodebookTreeNode): void
  (e: "node-contextmenu", event: MouseEvent, data: CodebookTreeNode): void
  (e: "node-drop", draggingNode: TreeNodeLike, dropNode: TreeNodeLike, type: TreeDropType): void
}>()

const treeRef = ref()
const defaultExpandedKeys = ["layer:project"]
const localKeyword = computed({
  get: () => props.keyword,
  set: (value) => emit("update:keyword", value)
})

watch(
  () => props.selectedTreeKey,
  (newKey) => {
    nextTick(() => {
      treeRef.value?.setCurrentKey(newKey)
    })
  }
)

function handleContextMenu(event: MouseEvent, data: CodebookTreeNode) {
  emit("node-contextmenu", event, data)
}

function handleDrop(draggingNode: TreeNodeLike, dropNode: TreeNodeLike, type: TreeDropType) {
  emit("node-drop", draggingNode, dropNode, type)
}
</script>

<style lang="scss" scoped>
.codebook-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
}

.sidebar-project-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 14px 12px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(to bottom, #f8fafc, #fff);

  .el-button {
    justify-content: flex-start;
    padding: 0;
    color: #64748b;
    font-size: 13px;

    &:hover {
      color: #2563eb;
    }
  }
}

.project-title-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 6px 10px;
  box-sizing: border-box;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.project-icon-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background-color: #2563eb;
  border-radius: 50%;
}

.project-name {
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-bottom: 1px solid #eef2f7;
}

.sidebar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
}

.sidebar-title {
  color: #111827;
  font-size: 14px;
  font-weight: 700;
}

.sidebar-subtitle {
  max-width: 210px;
  margin-top: 3px;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 8px 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.tree-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: calc(100% - 26px);

  .tree-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 13px;
}

:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: 6px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: #2563eb;
  background: #eff6ff;
}

@media (max-width: 1080px) {
  .codebook-sidebar {
    min-height: 320px;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
}
</style>
