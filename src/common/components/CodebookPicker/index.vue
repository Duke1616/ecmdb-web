<template>
  <div
    class="generic-picker-container"
    :class="{ 'is-disabled': disabled, 'is-project-scoped': !!projectId }"
  >
    <el-input
      :model-value="displayValue"
      readonly
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      class="premium-codebook-trigger"
      @click="openDialog"
    >
      <template #prefix v-if="selectedItem">
        <img class="codebook-icon-prefix" :src="getCodebookIcon(selectedItem.name)" alt="" />
      </template>
      <template #suffix>
        <el-icon v-if="clearable && selectedItem" class="clear-icon-suffix" @click.stop="clearSelection">
          <Close />
        </el-icon>
        <el-icon v-else class="arrow-icon-suffix"><ArrowDown /></el-icon>
      </template>
    </el-input>

    <BaseDialog
      v-model="dialogVisible"
      :width="projectId ? '680px' : '820px'"
      type="custom"
      :show-close="true"
      :close-on-click-modal="false"
      destroy-on-close
      :full-height="!projectId"
      :top="projectId ? '10vh' : '15vh'"
    >
      <template #header>
        <div class="picker-dialog-header">
          <div class="header-icon">
            <el-icon><Box /></el-icon>
          </div>
          <div class="header-text">
            <h3>{{ dialogTitle }}</h3>
            <p>{{ dialogDescription }}</p>
          </div>
        </div>
      </template>

      <div
        class="codebook-picker-dialog"
        :class="{ 'is-compact': !!projectId }"
        :style="projectId ? { height: compactDialogHeight } : undefined"
      >
        <div class="picker-panel-body">
          <div class="main-content-layout">
            <!-- 左侧项目列表 -->
            <div v-if="!projectId" v-loading="projectsLoading" class="sidebar-projects-list">
              <el-input
                v-model="projectKeyword"
                :prefix-icon="Search"
                clearable
                placeholder="搜索项目，按回车"
                class="project-search-input"
                @keyup.enter="handleProjectSearch"
              />
              <el-scrollbar class="project-list-scrollbar">
                <div
                  v-for="p in projects"
                  :key="p.id"
                  class="project-sidebar-item"
                  :class="{ 'is-active': activeProjectId === p.id }"
                  @click.stop="selectProject(p.id)"
                >
                  <div class="project-item-meta">
                    <el-icon class="project-node-icon"><Box /></el-icon>
                    <span class="project-node-name">{{ p.name }}</span>
                    <el-tag v-if="p.status === 'ARCHIVED'" size="small" type="info" effect="plain">归档</el-tag>
                  </div>
                  <el-icon class="arrow-right-icon"><ArrowRight /></el-icon>
                </div>
                <div v-if="projects.length === 0 && !projectsLoading" class="project-empty">暂无匹配项目</div>
              </el-scrollbar>
              <div class="project-pagination">
                <span class="project-pagination-total">共 {{ projectsTotal }} 项</span>
                <el-pagination
                  small
                  layout="prev, next"
                  prev-text="上一页"
                  next-text="下一页"
                  :current-page="projectPage"
                  :page-size="projectPageSize"
                  :total="projectsTotal"
                  @current-change="handleProjectPageChange"
                />
              </div>
            </div>

            <!-- 右侧脚本树形浏览区 -->
            <div class="tree-explorer-pane" v-loading="treeLoading">
              <div class="tree-pane-header">
                <div class="tree-pane-title">
                  <span>{{ projectId ? "项目文件" : "目录结构" }}</span>
                  <small v-if="projectId">{{ projectFileCount }} 个文件</small>
                </div>
                <el-input v-model="searchQuery" :placeholder="searchPlaceholder" clearable class="tree-search-input">
                  <template #prefix>
                    <el-icon class="search-icon"><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <el-scrollbar v-if="filteredCodebookTree.length > 0" class="tree-scrollbar">
                <el-tree
                  :data="filteredCodebookTree"
                  node-key="id"
                  :props="treeProps"
                  :default-expanded-keys="searchExpandedKeys"
                  :current-node-key="selectedItem?.id"
                  highlight-current
                  :expand-on-click-node="false"
                  class="explorer-tree"
                  @node-click="handleNodeClick"
                >
                  <template #default="{ data }">
                    <span class="explorer-tree-node" :class="{ 'is-file-node': data.kind === 'FILE' }">
                      <el-icon v-if="data.kind === 'DIRECTORY'" class="node-icon dir-icon"><Folder /></el-icon>
                      <img v-else class="node-icon file-icon" :src="getCodebookIcon(data.name)" />
                      <span class="node-name-label">{{ data.name }}</span>
                    </span>
                  </template>
                </el-tree>
              </el-scrollbar>
              <div class="empty-state-card" v-else>
                <el-empty :description="searchQuery.trim() ? '未匹配到项目文件' : emptyDescription" :image-size="60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { Box, Folder, Search, ArrowRight, ArrowDown, Close } from "@element-plus/icons-vue"
import { detailCodebookApi, listReferenceProjectsApi, treeCodebookApi } from "@/api/task/codebook"
import { workspaceNodeToCodebook } from "@/pages/task/codebook/composables/useCodebookTree"
import { BaseDialog } from "@/common/components/Dialogs"
import type { CodebookProject, codebook, CodebookScope } from "@/api/task/codebook/types/codebook"
import fileIcon from "@/common/assets/icons/preserve-color/file.svg"
import pythonIcon from "@/common/assets/icons/preserve-color/python.svg"
import shellIcon from "@/common/assets/icons/preserve-color/shell.svg"

// ── 属性与事件定义 ──────────────────────────────────────────────────────────
interface CodebookPickerProps {
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  size?: "large" | "default" | "small"
  variant?: "fancy" | "simple" | "element"
  pageSize?: number
  projectId?: number
  scope?: CodebookScope
  includeDirectories?: boolean
  displayPath?: boolean
  clearable?: boolean
  dialogTitle?: string
  dialogDescription?: string
  searchPlaceholder?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<CodebookPickerProps>(), {
  placeholder: "请选择脚本模板...",
  multiple: false,
  disabled: false,
  size: "default",
  variant: "element",
  pageSize: 10,
  projectId: undefined,
  scope: "TENANT",
  includeDirectories: false,
  displayPath: false,
  clearable: false,
  dialogTitle: "选择任务模板",
  dialogDescription: "从项目目录中选择需要绑定的脚本模板",
  searchPlaceholder: "搜索当前项目脚本",
  emptyDescription: "该项目下无脚本模板"
})

const emit = defineEmits<{
  (e: "change", codebook: codebook | null): void
}>()

// NOTE: 该组件为纯 UI 选择控件，与父组件进行双向状态同步
const model = defineModel<number | number[]>()

// ── 状态管理 ────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const searchQuery = ref("")
const projects = ref<CodebookProject[]>([])
const projectsLoading = ref(false)
const projectsTotal = ref(0)
const projectKeyword = ref("")
const projectOffset = ref(0)
const activeProjectId = ref<number | null>(null)
const codebookTree = ref<any[]>([])

const selectedItem = ref<any>(null)

const treeLoading = ref(false)
const projectPageSize = computed(() => Math.min(100, Math.max(1, props.pageSize)))
const projectPage = computed(() => Math.floor(projectOffset.value / projectPageSize.value) + 1)
let projectRequestVersion = 0

const treeProps = {
  label: "name",
  children: "children"
}

// 仅展示选中的脚本名称
const displayValue = computed(() => {
  if (!selectedItem.value) return ""
  return (props.displayPath && selectedItem.value.runtime_path) || selectedItem.value.name || ""
})

const isMatchedNode = (node: any, keyword: string) => {
  const name = String(node.name || "").toLowerCase()
  return name.includes(keyword)
}

const filterTree = (nodes: any[], keyword: string): any[] => {
  return nodes.reduce<any[]>((result, node) => {
    const children = Array.isArray(node.children) ? filterTree(node.children, keyword) : []
    const matched = isMatchedNode(node, keyword)

    if (matched) {
      result.push(node)
      return result
    }

    if (children.length > 0) {
      result.push({
        ...node,
        children
      })
    }

    return result
  }, [])
}

const filteredCodebookTree = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return codebookTree.value
  return filterTree(codebookTree.value, keyword)
})

const countTreeNodes = (nodes: any[]): number =>
  nodes.reduce((total, node) => total + 1 + countTreeNodes(node.children || []), 0)

const countFiles = (nodes: any[]): number =>
  nodes.reduce((total, node) => total + (node.kind === "FILE" ? 1 : 0) + countFiles(node.children || []), 0)

const projectFileCount = computed(() => countFiles(codebookTree.value))
const compactDialogHeight = computed(
  () => `${Math.min(520, Math.max(300, 150 + countTreeNodes(codebookTree.value) * 36))}px`
)

const getExpandableKeys = (nodes: any[]): number[] => {
  return nodes.flatMap((node) => {
    const children = Array.isArray(node.children) ? node.children : []
    const current = children.length > 0 ? [node.id] : []
    return current.concat(getExpandableKeys(children))
  })
}

const searchExpandedKeys = computed(() => {
  if (!searchQuery.value.trim()) return []
  return getExpandableKeys(filteredCodebookTree.value)
})

// ── 语言与图标推断 ────────────────────────────────────────────────────────
const extLanguageMap: Record<string, string> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  js: "javascript",
  ts: "typescript",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown"
}

const getFileExt = (name: string) =>
  String(name || "")
    .match(/\.([^.]+)$/)?.[1]
    ?.toLowerCase() || ""
const inferLanguage = (name: string) => extLanguageMap[getFileExt(name)] || "text"

const getCodebookIcon = (name: string) => {
  const language = inferLanguage(name)
  if (language === "python") return pythonIcon
  if (language === "shell") return shellIcon
  return fileIcon
}

// ── 项目/树加载 ───────────────────────────────────────────────────────────
const loadProjects = async () => {
  const requestVersion = ++projectRequestVersion
  projectsLoading.value = true
  try {
    const { data } = await listReferenceProjectsApi({
      keyword: projectKeyword.value.trim(),
      offset: projectOffset.value,
      limit: projectPageSize.value
    })
    if (requestVersion !== projectRequestVersion) return
    projects.value = data.projects || []
    projectsTotal.value = data.total || 0
    const activeProject = projects.value.find((project) => project.id === activeProjectId.value)
    if (!activeProject) {
      const firstProject = projects.value[0]
      if (!firstProject) {
        activeProjectId.value = null
        codebookTree.value = []
        return
      }
      activeProjectId.value = firstProject.id
      await loadProjectTree(firstProject.id)
    }
  } catch (e) {
    if (requestVersion !== projectRequestVersion) return
    console.error("加载项目列表失败", e)
    projects.value = []
    projectsTotal.value = 0
    activeProjectId.value = null
    codebookTree.value = []
  } finally {
    if (requestVersion === projectRequestVersion) projectsLoading.value = false
  }
}

const handleProjectSearch = () => {
  projectOffset.value = 0
  loadProjects()
}

const handleProjectPageChange = (page: number) => {
  projectOffset.value = (page - 1) * projectPageSize.value
  loadProjects()
}

const findNode = (nodes: any[], id: number): any | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children || [], id)
    if (found) return found
  }
  return null
}

const loadProjectTree = async (projId: number, scope?: CodebookScope) => {
  treeLoading.value = true
  try {
    const { data } = await treeCodebookApi(projId, scope)
    const projectRoot = data.nodes.find((node) => node.layer === "PROJECT")
    codebookTree.value = (projectRoot?.children || []).map((node) => workspaceNodeToCodebook(node))
  } catch (e) {
    console.error("加载脚本树失败", e)
    codebookTree.value = []
  } finally {
    treeLoading.value = false
  }
}

const selectProject = async (projId: number) => {
  activeProjectId.value = projId
  searchQuery.value = ""
  await loadProjectTree(projId)
}

// ── 交互选择 ─────────────────────────────────────────────────────────────
const openDialog = async () => {
  if (props.disabled) return
  dialogVisible.value = true
  if (props.projectId) {
    activeProjectId.value = props.projectId
    await loadProjectTree(props.projectId, props.scope)
    return
  }
  await loadProjects()
}

const handleNodeClick = (data: any) => {
  if (data.kind === "FILE") {
    selectFile(data)
  }
}

const selectFile = (item: any) => {
  selectedItem.value = item
  model.value = item.id
  emit("change", item)
  dialogVisible.value = false
}

const clearSelection = () => {
  model.value = undefined
  selectedItem.value = null
  emit("change", null)
}

// 监听弹窗可见性，关闭时清理检索，恢复原始树
watch(dialogVisible, (visible) => {
  if (!visible) {
    searchQuery.value = ""
  }
})

// ── 逆向回显解析 ──────────────────────────────────────────────────────────
const resolveSelectedItem = async (codebookId: number) => {
  if (!codebookId || codebookId <= 0) {
    selectedItem.value = null
    return
  }

  try {
    if (props.projectId) {
      if (activeProjectId.value !== props.projectId || codebookTree.value.length === 0) {
        activeProjectId.value = props.projectId
        await loadProjectTree(props.projectId, props.scope)
      }
      const projectFile = findNode(codebookTree.value, codebookId)
      if (projectFile) {
        selectedItem.value = projectFile
        return
      }
    }
    const { data } = await detailCodebookApi(codebookId)
    selectedItem.value = data
  } catch (e) {
    console.error("解析回显脚本失败", e)
  }
}

watch(
  () => model.value,
  async (newVal) => {
    const id = Array.isArray(newVal) ? newVal[0] : newVal
    if (id) {
      await resolveSelectedItem(id)
    } else {
      selectedItem.value = null
    }
  },
  { immediate: true }
)

</script>

<style scoped lang="scss">
.generic-picker-container {
  width: 100%;
  cursor: pointer;
}

.premium-codebook-trigger {
  cursor: pointer;

  :deep(.el-input__wrapper) {
    cursor: pointer !important;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border: 1px solid #d1d5db;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .el-input__inner {
      cursor: pointer !important;
      color: #1f2937;
      font-weight: 500;
    }
  }
}

.codebook-icon-prefix {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.arrow-icon-suffix {
  color: #9ca3af;
  font-size: 14px;
}

.clear-icon-suffix {
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    color: #475569;
  }
}

.picker-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #ffffff;
    background: #2563eb;
    border-radius: 8px;
    box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22);
  }

  .header-text {
    min-width: 0;

    h3 {
      margin: 0 0 3px;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.3;
      color: #111827;
    }

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
    }
  }
}

.codebook-picker-dialog {
  display: flex;
  flex: 1;
  min-height: 0;
  background: #ffffff;

  &.is-compact {
    background: #f8fafc;

    .tree-explorer-pane {
      padding: 14px 16px 16px;
      background: #f8fafc;
    }

    .tree-pane-header {
      padding: 0 0 12px;
    }

    .tree-scrollbar {
      padding: 7px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    }

    .empty-state-card {
      background: #ffffff;
      border: 1px dashed #d8e0eb;
      border-radius: 10px;
    }
  }
}

.picker-panel-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.main-content-layout {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #ffffff;
}

// 左侧项目列表
.sidebar-projects-list {
  display: flex;
  flex-direction: column;
  width: 216px;
  min-height: 0;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;

  .project-search-input {
    flex-shrink: 0;
    padding: 12px 12px 10px;

    :deep(.el-input__wrapper) {
      min-height: 34px;
      padding: 0 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        border-color: #cbd5e1;
      }

      &.is-focus {
        border-color: #93b4f8;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
      }
    }

    :deep(.el-input__prefix-inner) {
      color: #94a3b8;
      font-size: 14px;
    }

    :deep(.el-input__inner) {
      font-size: 13px;
      color: #334155;

      &::placeholder {
        color: #94a3b8;
      }
    }
  }

  .project-list-scrollbar {
    flex: 1;
    min-height: 0;
    padding: 0 10px 10px;
  }

  .project-sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 38px;
    padding: 0 10px;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    border-radius: 8px;

    &:hover {
      background: #eef2f7;
    }

    &.is-active {
      background: #eaf2ff;

      .project-node-icon {
        color: #3b82f6;
      }
      .project-node-name {
        color: #1d4ed8;
        font-weight: 700;
      }
      .arrow-right-icon {
        color: #3b82f6;
        opacity: 1;
      }
    }
  }

  .project-item-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .project-node-icon {
    font-size: 16px;
    color: #64748b;
  }

  .project-node-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: #334155;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.el-tag) {
    flex-shrink: 0;
  }

  .arrow-right-icon {
    font-size: 12px;
    color: #94a3b8;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .project-empty {
    padding: 32px 12px;
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
  }

  .project-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    min-height: 48px;
    padding: 8px 10px 8px 14px;
    background: rgba(255, 255, 255, 0.72);
    border-top: 1px solid #e2e8f0;

    .project-pagination-total {
      color: #94a3b8;
      font-size: 12px;
      white-space: nowrap;
    }

    :deep(.el-pagination) {
      --el-pagination-button-bg-color: transparent;
      --el-pagination-hover-color: #2563eb;
      padding: 0;
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
      min-width: auto;
      height: 28px;
      margin: 0 1px;
      padding: 0 6px;
      color: #64748b;
      font-size: 12px;
      border-radius: 6px;

      &:not(:disabled):hover {
        background: #eaf2ff;
      }

      &:disabled {
        color: #94a3b8;
        opacity: 0.72;
      }
    }
  }
}

// 右侧浏览器面板
.tree-explorer-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
  background: #ffffff;
  min-width: 0;
  min-height: 0;
}

.tree-pane-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.tree-pane-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;

  span {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
  }

  small {
    color: #94a3b8;
    font-size: 11px;
    font-weight: 500;
  }
}

.tree-search-input {
  width: 260px;
  flex-shrink: 0;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #d8e0eb !important;
    box-shadow: none !important;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;

    &:hover,
    &.is-focus {
      border-color: #3b82f6 !important;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
  }
}

.search-icon {
  font-size: 15px;
  color: #94a3b8;
}

.tree-scrollbar {
  flex: 1;
  min-height: 0;
}

.explorer-tree {
  background: transparent;

  :deep(.el-tree-node__content) {
    height: 34px;
    border-radius: 6px;
    margin: 1px 0;
    padding: 0 8px;

    &:hover {
      background-color: #f8fafc;
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #eaf2ff;
    color: #3b82f6;
  }
}

.explorer-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  width: 100%;
  min-width: 0;

  .node-icon {
    font-size: 15px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &.dir-icon {
      color: #e6a23c;
    }

    &.file-icon {
      width: 15px;
      height: 15px;
      object-fit: contain;
    }
  }

  .node-name-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #475569;
  }

  &.is-file-node {
    cursor: pointer;
    .node-name-label {
      color: #1e293b;
      font-weight: 500;
    }
  }
}

.empty-state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>

<style lang="scss">
body .base-dialog--custom:has(.codebook-picker-dialog) {
  overflow: hidden;
  border-radius: 12px;
  box-shadow:
    0 24px 56px rgba(15, 23, 42, 0.18),
    0 10px 22px rgba(15, 23, 42, 0.08);

  .el-dialog__header {
    margin: 0;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .el-dialog__headerbtn {
    top: 16px;
    right: 18px;
    width: 32px;
    height: 32px;
    border-radius: 8px;

    &:hover {
      background: #f1f5f9;
    }
  }

  .el-dialog__body {
    padding: 0 !important;
    background: #ffffff;
  }
}
</style>
