<template>
  <ProGovernanceLayout
    title="脚本引擎项目"
    subtitle="提供基于项目层级的脚本资产隔离与分类管理"
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

      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @routeEvent="handleOperateEvent" />
      </template>
    </DataTable>

    <FormDialog
      v-model="projectDialogVisible"
      :title="projectForm.id ? '编辑项目' : '新建项目'"
      subtitle="配置用于脚本资产隔离的项目维度空间"
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
        label-position="top"
        class="project-form"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称，如：数据库同步" clearable />
        </el-form-item>
        <el-form-item label="项目描述" prop="desc">
          <el-input v-model="projectForm.desc" type="textarea" :rows="4" placeholder="请输入项目描述信息" clearable />
        </el-form-item>
      </el-form>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, FolderOpened, Lock } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
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
const projectForm = ref({
  id: undefined as number | undefined,
  name: "",
  desc: ""
})
const projectRules = ref<FormRules>({
  name: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 1, max: 64, message: "项目名长度需在 1 到 64 个字符之间", trigger: "blur" }
  ],
  desc: [{ required: true, message: "请输入项目描述", trigger: "blur" }]
})

const tableColumns: Column[] = [
  { prop: "name", label: "项目名称", slot: "name", align: "center", minWidth: 220 },
  { prop: "desc", label: "项目描述", slot: "desc", align: "center", minWidth: 320 },
  { prop: "ctime", label: "创建时间", slot: "ctime", align: "center", minWidth: 170 }
]

const operateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: TASK_CAPABILITIES.Codebook.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: TASK_CAPABILITIES.Codebook.Delete }
]

function isSystemProject(row?: Pick<CodebookProject, "scope"> | null) {
  return row?.scope === "SYSTEM"
}

function warnSystemProject() {
  ElMessage.warning("系统项目为只读资源，不能进行变更操作")
}

function getOperateItems(row: CodebookProject) {
  if (isSystemProject(row)) return []
  return operateItems
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
    desc: ""
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
    desc: row.desc
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
      desc: projectForm.value.desc
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
    desc: ""
  }
  projectFormRef.value?.clearValidate()
}

function selectProject(row: CodebookProject) {
  router.push({
    name: "ScriptWorkspace",
    query: {
      id: row.id.toString(),
      name: row.name
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
</style>
