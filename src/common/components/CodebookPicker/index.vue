<template>
  <div class="generic-picker-container" :class="{ 'is-disabled': disabled }" @click="openDialog">
    <el-input
      :model-value="displayValue"
      readonly
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      class="premium-codebook-trigger"
    >
      <template #prefix v-if="selectedItem">
        <img class="codebook-icon-prefix" :src="getCodebookIcon(selectedItem.name)" alt="" />
      </template>
      <template #suffix>
        <el-icon class="arrow-icon-suffix"><ArrowDown /></el-icon>
      </template>
    </el-input>

    <!-- 高端毛玻璃/卡片式 Dialog 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择任务模板"
      width="760px"
      destroy-on-close
      align-center
      class="premium-codebook-dialog"
    >
      <div class="picker-panel-body">
        <!-- 顶部全局搜索 -->
        <div class="search-section-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="输入脚本名称 / 负责人 / 扩展名全局搜索..."
            clearable
            @input="handleSearch"
            class="premium-search-input"
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 主体：普通状态双栏，搜索状态扁平列表 -->
        <div class="main-content-layout">
          <template v-if="!searchQuery.trim()">
            <!-- 左侧项目列表 -->
            <div class="sidebar-projects-list">
              <el-scrollbar>
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
                  </div>
                  <el-icon class="arrow-right-icon"><ArrowRight /></el-icon>
                </div>
              </el-scrollbar>
            </div>

            <!-- 右侧脚本树形浏览区 -->
            <div class="tree-explorer-pane" v-loading="treeLoading">
              <el-scrollbar v-if="codebookTree.length > 0">
                <el-tree
                  :data="codebookTree"
                  node-key="id"
                  :props="treeProps"
                  default-expand-all
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
                      <span class="node-owner-label" v-if="data.kind === 'FILE' && data.owner">
                        ({{ data.owner }})
                      </span>
                    </span>
                  </template>
                </el-tree>
              </el-scrollbar>
              <div class="empty-state-card" v-else>
                <el-empty description="该项目下无脚本模板" :image-size="60" />
              </div>
            </div>
          </template>

          <!-- 全局搜索结果面板 -->
          <template v-else>
            <div class="search-results-pane" v-loading="searchLoading">
              <el-scrollbar v-if="searchResults.length > 0">
                <div class="results-grid">
                  <div v-for="item in searchResults" :key="item.id" class="search-result-row" @click="selectFile(item)">
                    <div class="result-details">
                      <img class="file-icon" :src="getCodebookIcon(item.name)" />
                      <div class="file-info-block">
                        <span class="result-file-name">{{ item.name }}</span>
                        <span class="result-file-owner" v-if="item.owner">负责人: {{ item.owner }}</span>
                      </div>
                    </div>
                    <span class="result-project-badge"># {{ item.projectName }}</span>
                  </div>
                </div>
              </el-scrollbar>
              <div class="empty-state-card" v-else>
                <el-empty description="未匹配到任何脚本模板" :image-size="60" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { Box, Folder, Search, ArrowRight, ArrowDown } from "@element-plus/icons-vue"
import { listProjectApi, treeCodebookApi, detailCodebookApi, listCodebookApi } from "@/api/task/codebook"
import { buildTree } from "@/pages/task/codebook/composables/useCodebookTree"
import type { codebook } from "@/api/task/codebook/types/codebook"
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
  scope?: string
  includeDirectories?: boolean
}

const props = withDefaults(defineProps<CodebookPickerProps>(), {
  placeholder: "请选择脚本模板...",
  multiple: false,
  disabled: false,
  size: "default",
  variant: "element",
  pageSize: 10,
  projectId: undefined,
  scope: "",
  includeDirectories: false
})

const emit = defineEmits<{
  (e: "change", codebook: codebook | null): void
}>()

// NOTE: 该组件为纯 UI 选择控件，与父组件进行双向状态同步
const model = defineModel<number | number[]>()

// ── 状态管理 ────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const searchQuery = ref("")
const projects = ref<any[]>([])
const activeProjectId = ref<number | null>(null)
const codebookTree = ref<any[]>([])
const searchResults = ref<any[]>([])

const selectedItem = ref<any>(null)
const selectedItemProjectName = ref("")

const treeLoading = ref(false)
const searchLoading = ref(false)

const treeProps = {
  label: "name",
  children: "children"
}

// 仅展示选中的脚本名称
const displayValue = computed(() => {
  return selectedItem.value?.name || ""
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
  try {
    const { data } = await listProjectApi({ offset: 0, limit: 1000 })
    projects.value = data.projects || []
    if (projects.value.length > 0 && activeProjectId.value === null) {
      activeProjectId.value = projects.value[0].id
      await loadProjectTree(projects.value[0].id)
    }
  } catch (e) {
    console.error("加载项目列表失败", e)
  }
}

const loadProjectTree = async (projId: number) => {
  treeLoading.value = true
  try {
    const { data } = await treeCodebookApi(projId)
    codebookTree.value = buildTree(data.codebooks || [])
  } catch (e) {
    console.error("加载脚本树失败", e)
    codebookTree.value = []
  } finally {
    treeLoading.value = false
  }
}

const selectProject = async (projId: number) => {
  activeProjectId.value = projId
  await loadProjectTree(projId)
}

// ── 交互选择 ─────────────────────────────────────────────────────────────
const openDialog = async () => {
  if (props.disabled) return
  dialogVisible.value = true
  await loadProjects()
}

const handleNodeClick = (data: any) => {
  if (data.kind === "FILE") {
    selectFile(data)
  }
}

const selectFile = (item: any) => {
  model.value = item.id
  emit("change", item)
  dialogVisible.value = false
}

// ── 检索功能 ─────────────────────────────────────────────────────────────
let searchTimer: any = null
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      searchResults.value = []
      return
    }
    searchLoading.value = true
    try {
      const { data } = await listCodebookApi({ offset: 0, limit: 200 })
      const keyword = query.trim().toLowerCase()
      const matched = (data.codebooks || []).filter(
        (c) =>
          c.kind === "FILE" &&
          (c.name.toLowerCase().includes(keyword) || (c.owner && c.owner.toLowerCase().includes(keyword)))
      )

      searchResults.value = matched.map((c) => {
        const proj = projects.value.find((p) => p.id === c.project_id)
        return {
          ...c,
          projectName: proj ? proj.name : `项目 #${c.project_id}`
        }
      })
    } catch (e) {
      console.error(e)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 250)
}

// 监听弹窗可见性，关闭时清理检索，恢复原始树
watch(dialogVisible, (visible) => {
  if (!visible) {
    searchQuery.value = ""
    searchResults.value = []
  }
})

// ── 逆向回显解析 ──────────────────────────────────────────────────────────
const resolveSelectedItem = async (codebookId: number) => {
  if (!codebookId || codebookId <= 0) {
    selectedItem.value = null
    selectedItemProjectName.value = ""
    return
  }

  try {
    const { data } = await detailCodebookApi(codebookId)
    selectedItem.value = data
    if (data && data.project_id) {
      if (projects.value.length === 0) {
        const { data: projData } = await listProjectApi({ offset: 0, limit: 1000 })
        projects.value = projData.projects || []
      }
      const proj = projects.value.find((p) => p.id === data.project_id)
      selectedItemProjectName.value = proj ? proj.name : `项目 #${data.project_id}`
    }
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
      selectedItemProjectName.value = ""
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

// ── Premium Dialog 样式 ──────────────────────────────────────────────────
.picker-panel-body {
  display: flex;
  flex-direction: column;
  height: 480px;
  margin: -10px -20px -20px -20px;
}

.search-section-wrapper {
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  .premium-search-input :deep(.el-input__wrapper) {
    border-radius: 8px;
    padding: 2px 14px;
    border: 1px solid #cbd5e1 !important;
    box-shadow: none !important;
    transition: all 0.25s;

    &:hover,
    &.is-focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
    }
  }

  .search-icon {
    font-size: 16px;
    color: #94a3b8;
  }
}

.main-content-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

// 左侧项目列表
.sidebar-projects-list {
  width: 240px;
  background: #fafafa;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;

  .project-sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f5f9;

    &:hover {
      background: #f1f5f9;
    }

    &.is-active {
      background: #eff6ff;
      border-right: 3px solid #3b82f6;

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
    font-size: 13px;
    color: #334155;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arrow-right-icon {
    font-size: 12px;
    color: #94a3b8;
    opacity: 0;
    transition: opacity 0.2s;
  }
}

// 右侧浏览器面板
.tree-explorer-pane {
  flex: 1;
  padding: 16px;
  background: #ffffff;
  min-width: 0;
}

.explorer-tree {
  background: transparent;

  :deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 6px;
    margin: 2px 0;
    padding: 0 4px;

    &:hover {
      background-color: #f1f5f9;
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #eff6ff;
    color: #3b82f6;
  }
}

.explorer-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  width: 100%;

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

  .node-owner-label {
    font-size: 11px;
    color: #94a3b8;
    margin-left: auto;
    padding-right: 8px;
  }

  &.is-file-node {
    cursor: pointer;
    .node-name-label {
      color: #1e293b;
      font-weight: 500;
    }
  }
}

// 搜索结果面板
.search-results-pane {
  flex: 1;
  padding: 16px;
  background: #ffffff;
  min-width: 0;

  .results-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .search-result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
  }

  .result-details {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .file-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .file-info-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .result-file-name {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-file-owner {
    font-size: 11px;
    color: #94a3b8;
  }

  .result-project-badge {
    font-size: 11px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 4px;
    padding: 2px 8px;
    font-weight: 500;
    white-space: nowrap;
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
// 全局弹窗样式修饰
.premium-codebook-dialog {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;

  .el-dialog__header {
    margin-right: 0px;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;

    .el-dialog__title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .el-dialog__body {
    padding: 20px !important;
  }
}
</style>
