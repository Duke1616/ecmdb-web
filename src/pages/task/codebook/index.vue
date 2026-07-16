<template>
  <ProGovernanceLayout
    title="脚本引擎项目"
    subtitle="管理普通脚本项目和可发布复用的制品库"
    :primary-action="{ label: '新建项目', capability: TASK_CAPABILITIES.Codebook.Add }"
    @refresh="fetchProjects"
    @primary-action="handleCreate"
  >
    <DataTable
      :data="projectsList"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :loading="projectsLoading"
      :total="projectsTotal"
      :page-size="projectLimit"
      :current-page="projectPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #name="{ row }">
        <div class="project-name-cell" @click="selectProject(row)">
          <el-icon class="folder-icon"><FolderOpened /></el-icon>
          <span class="project-name-main">
            <span class="project-name-text">{{ row.name }}</span>
            <el-tooltip v-if="isSystemProject(row)" content="系统项目，只读" placement="top" :show-after="300">
              <el-icon class="project-readonly-lock"><Lock /></el-icon>
            </el-tooltip>
          </span>
        </div>
      </template>

      <template #desc="{ row }">
        <div class="project-desc-cell">
          <el-tooltip :content="row.desc" placement="top" :show-after="300">
            <span class="project-desc-text">{{ row.desc || "-" }}</span>
          </el-tooltip>
        </div>
      </template>

      <template #ctime="{ row }">
        <span class="time-text">{{ formatProjectTime(row.ctime) }}</span>
      </template>

      <template #artifact="{ row }">
        <div v-if="isSystemProject(row)" class="minimal-status primary project-type-status">
          <span class="dot" />
          <span class="text">SYSTEM 公共库</span>
        </div>
        <el-tooltip
          v-else-if="row.artifact_enabled"
          :content="`导入命名空间：${row.artifact_namespace}`"
          placement="top"
          :show-after="250"
        >
          <div class="minimal-status success project-type-status is-artifact">
            <span class="dot" />
            <span class="text">制品库</span>
          </div>
        </el-tooltip>
        <div v-else class="minimal-status info project-type-status">
          <span class="dot" />
          <span class="text">普通项目</span>
        </div>
      </template>

      <template #actions="{ row }">
        <OperateBtn
          :items="getOperateItems(row)"
          :operate-item="row"
          :max-length="2"
          @routeEvent="handleOperateEvent"
        />
      </template>
    </DataTable>

    <ProjectArtifactManager ref="artifactManagerRef" />

    <FormDialog
      v-model="projectDialogVisible"
      :title="projectForm.id ? '编辑项目' : '新建项目'"
      subtitle="配置项目基本信息和项目类型"
      width="520px"
      :header-icon="FolderOpened"
      :confirm-loading="saving"
      confirm-text="保存"
      @closed="handleDialogClosed"
      @cancel="projectDialogVisible = false"
      @confirm="saveProject"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        :validate-on-rule-change="false"
        label-position="top"
        class="project-form"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称，如：数据库同步" clearable />
        </el-form-item>
        <el-form-item label="项目描述" prop="desc">
          <el-input v-model="projectForm.desc" type="textarea" :rows="4" placeholder="请输入项目描述信息" clearable />
        </el-form-item>
        <el-form-item label="项目类型" class="project-type-form-item">
          <div class="project-type-grid" role="radiogroup" aria-label="项目类型">
            <button
              type="button"
              role="radio"
              class="project-type-card"
              :class="{ 'is-active': !projectForm.artifact_enabled }"
              :aria-checked="!projectForm.artifact_enabled"
              @click="projectForm.artifact_enabled = false"
            >
              <span class="project-type-icon">
                <el-icon><Folder /></el-icon>
              </span>
              <span class="project-type-content">
                <strong>普通项目</strong>
                <small>独立维护和运行脚本</small>
              </span>
              <el-icon v-if="!projectForm.artifact_enabled" class="project-type-check"><Select /></el-icon>
            </button>
            <button
              type="button"
              role="radio"
              class="project-type-card"
              :class="{ 'is-active': projectForm.artifact_enabled }"
              :aria-checked="projectForm.artifact_enabled"
              @click="projectForm.artifact_enabled = true"
            >
              <span class="project-type-icon">
                <el-icon><Box /></el-icon>
              </span>
              <span class="project-type-content">
                <strong>制品库</strong>
                <small>发布后供租户内任务复用</small>
              </span>
              <el-icon v-if="projectForm.artifact_enabled" class="project-type-check"><Select /></el-icon>
            </button>
          </div>
        </el-form-item>
        <transition name="namespace-panel">
          <div v-if="projectForm.artifact_enabled" class="namespace-panel">
            <el-form-item label="导入命名空间" prop="artifact_namespace">
              <el-input
                v-model="projectForm.artifact_namespace"
                :disabled="Boolean(projectForm.id && projectForm.artifact_namespace)"
                maxlength="64"
                placeholder="例如：ops_common"
              >
                <template #prefix>
                  <span class="namespace-symbol">@</span>
                </template>
              </el-input>
              <div class="namespace-help">租户内唯一，设置后不可修改；代码通过该名称导入制品库。</div>
            </el-form-item>
          </div>
        </transition>
      </el-form>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { Box, Clock, Delete, Edit, Folder, FolderOpened, Lock, Select, Upload } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import ProjectArtifactManager from "@/pages/task/artifact/components/ProjectArtifactManager.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { usePagination } from "@/common/composables/usePagination"
import { formatTimestamp } from "@/common/utils/day"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { createProjectApi, listProjectApi, updateProjectApi, deleteProjectApi } from "@/api/task/codebook"
import type { CodebookProject } from "@/api/task/codebook/types/codebook"
import type { Column } from "@@/components/DataTable/types"

const router = useRouter()
const saving = ref(false)

// 使用项目统一的分页 hooks
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 映射分页参数到项目接口参数
const projectPage = computed({
  get: () => paginationData.currentPage,
  set: (val) => {
    paginationData.currentPage = val
  }
})
const projectLimit = computed({
  get: () => paginationData.pageSize,
  set: (val) => {
    paginationData.pageSize = val
  }
})

// 项目管理相关状态
const projectsList = ref<CodebookProject[]>([])
const projectsTotal = ref(0)
const projectsLoading = ref(false)

// 项目弹窗相关状态
const projectDialogVisible = ref(false)
const projectFormRef = ref<FormInstance>()
const artifactManagerRef = ref<InstanceType<typeof ProjectArtifactManager>>()
const projectForm = ref({
  id: undefined as number | undefined,
  name: "",
  desc: "",
  artifact_enabled: false,
  artifact_namespace: ""
})
const projectRules = computed<FormRules>(() => ({
  name: [
    { required: true, message: "请输入项目名称", trigger: "submit" },
    { min: 1, max: 64, message: "项目名长度需在 1 到 64 个字符之间", trigger: "submit" }
  ],
  desc: [{ required: true, message: "请输入项目描述", trigger: "submit" }],
  artifact_namespace: projectForm.value.artifact_enabled
    ? [
        { required: true, message: "请输入导入命名空间", trigger: "submit" },
        {
          pattern: /^(?!etask$)[a-z][a-z0-9_]*$/,
          message: "只能使用小写英文字母、数字和下划线，且不能使用 etask",
          trigger: "submit"
        }
      ]
    : []
}))

const tableColumns: Column[] = [
  { prop: "name", label: "项目名称", slot: "name", align: "center", minWidth: 220 },
  { prop: "desc", label: "项目描述", slot: "desc", align: "center", minWidth: 320 },
  { prop: "artifact_enabled", label: "项目类型", slot: "artifact", align: "center", minWidth: 120 },
  { prop: "ctime", label: "创建时间", slot: "ctime", align: "center", minWidth: 170 }
]

const projectOperateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: TASK_CAPABILITIES.Codebook.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: TASK_CAPABILITIES.Codebook.Delete }
]
const artifactOperateItems = [
  { name: "发布", code: "publish", type: "primary", icon: Upload, capability: TASK_CAPABILITIES.Artifact.Publish },
  { name: "历史", code: "history", type: "primary", icon: Clock, capability: TASK_CAPABILITIES.Artifact.View },
  ...projectOperateItems
]

function isSystemProject(row?: Pick<CodebookProject, "scope"> | null) {
  return row?.scope === "SYSTEM"
}

function warnSystemProject() {
  ElMessage.warning("系统项目为只读资源，不能进行变更操作")
}

function getOperateItems(row: CodebookProject) {
  if (isSystemProject(row)) return []
  return row.artifact_enabled ? artifactOperateItems : projectOperateItems
}

// ==================== 数据加载 ====================
async function fetchProjects() {
  projectsLoading.value = true
  try {
    const { data } = await listProjectApi({
      offset: (projectPage.value - 1) * projectLimit.value,
      limit: projectLimit.value
    })
    projectsList.value = data.projects || []
    projectsTotal.value = data.total || 0
    paginationData.total = data.total || 0
  } catch {
    projectsList.value = []
    projectsTotal.value = 0
    paginationData.total = 0
  } finally {
    projectsLoading.value = false
  }
}

// ==================== 操作逻辑 ====================
function handleCreate() {
  projectForm.value = {
    id: undefined,
    name: "",
    desc: "",
    artifact_enabled: false,
    artifact_namespace: ""
  }
  projectDialogVisible.value = true
}

function handleEdit(row: CodebookProject) {
  if (isSystemProject(row)) {
    warnSystemProject()
    return
  }
  projectForm.value = {
    id: row.id,
    name: row.name,
    desc: row.desc,
    artifact_enabled: row.artifact_enabled,
    artifact_namespace: row.artifact_namespace
  }
  projectDialogVisible.value = true
}

function handleDeleteProject(row: CodebookProject) {
  if (isSystemProject(row)) {
    warnSystemProject()
    return
  }
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除项目: "),
      h("i", { style: "color: #dc2626" }, row.name),
      h("span", null, "，项目下的所有脚本和目录将一并删除，确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteProjectApi(row.id)
    ElMessage.success("删除成功")
    fetchProjects()
  })
}

function handleOperateEvent(row: CodebookProject, action: string) {
  if (action === "publish") artifactManagerRef.value?.openPublish(row.id, row.name)
  if (action === "history") artifactManagerRef.value?.openHistory(row.id, row.name)
  if (action === "edit") handleEdit(row)
  if (action === "delete") handleDeleteProject(row)
}

async function saveProject() {
  if (!projectFormRef.value) return
  const editingProject = projectForm.value.id
    ? projectsList.value.find((item) => item.id === projectForm.value.id)
    : null
  if (isSystemProject(editingProject)) {
    warnSystemProject()
    return
  }
  const valid = await projectFormRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const payload = {
      name: projectForm.value.name.trim(),
      desc: projectForm.value.desc,
      artifact_enabled: projectForm.value.artifact_enabled,
      artifact_namespace: projectForm.value.artifact_namespace.trim()
    }
    if (projectForm.value.id) {
      await updateProjectApi({
        id: projectForm.value.id,
        ...payload
      })
      ElMessage.success("更新项目成功")
    } else {
      await createProjectApi(payload)
      ElMessage.success("创建项目成功")
    }
    projectDialogVisible.value = false
    fetchProjects()
  } finally {
    saving.value = false
  }
}

function handleDialogClosed() {
  projectForm.value = {
    id: undefined,
    name: "",
    desc: "",
    artifact_enabled: false,
    artifact_namespace: ""
  }
  projectFormRef.value?.clearValidate()
}

function selectProject(row: CodebookProject) {
  router.push({
    name: "ScriptWorkspace",
    query: {
      id: row.id.toString(),
      name: row.name,
      scope: row.scope
    }
  })
}

function formatProjectTime(timestamp?: number) {
  if (!timestamp) return "-"
  const normalized = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return formatTimestamp(normalized)
}

// 监听分页变更
watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    fetchProjects()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.project-name-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #2563eb;
  font-weight: 700;
  transition: color 0.15s;

  &:hover {
    color: #1d4ed8;
  }

  .folder-icon {
    font-size: 16px;
    color: #3b82f6;
  }
}

.project-desc-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.project-name-main {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
}

.project-name-text,
.project-desc-text {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 13px;
}

.project-desc-text {
  color: #667085;
  font-size: 13px;
}

.time-text {
  color: #667085;
  font-size: 12px;
}

.project-type-status {
  &.is-artifact {
    cursor: help;
  }
}

.project-form {
  padding: 18px 4px 4px;

  :deep(.el-form-item__label) {
    color: #344054;
    font-size: 13px;
    font-weight: 700;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 0 0 1px #dfe5ee inset;

    &:hover {
      box-shadow: 0 0 0 1px #b8c4d4 inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 1px #3b82f6 inset,
        0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.project-type-form-item {
  margin-bottom: 20px;

  :deep(.el-form-item__content) {
    width: 100%;
  }
}

.project-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  gap: 12px;
}

.project-type-card {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 72px;
  padding: 12px 34px 12px 12px;
  color: #475569;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dfe5ee;
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    border-color: #93c5fd;
    background: #f8fbff;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  &.is-active {
    background: #f5f9ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12);

    .project-type-icon {
      color: #ffffff;
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .project-type-content strong {
      color: #1d4ed8;
    }
  }
}

.project-type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  color: #64748b;
  font-size: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.16s ease;
}

.project-type-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 10px;
  gap: 3px;

  strong {
    color: #334155;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
  }

  small {
    overflow: hidden;
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.project-type-check {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #3b82f6;
  font-size: 16px;
}

.namespace-panel {
  padding: 14px 14px 2px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.namespace-symbol {
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
}

.namespace-help {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.namespace-panel-enter-active,
.namespace-panel-leave-active {
  overflow: hidden;
  transition: all 0.18s ease;
}

.namespace-panel-enter-from,
.namespace-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 560px) {
  .project-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
