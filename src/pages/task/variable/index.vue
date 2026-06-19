<template>
  <ProGovernanceLayout
    title="全局变量"
    subtitle="统一维护任务执行过程中可复用的全局 Key/Value 配置"
    :primary-action="{ label: '新增变量', capability: TASK_CAPABILITIES.Variable.Add }"
    @refresh="loadVariables"
    @primary-action="handleCreate"
  >
    <DataTable
      :data="variablesData"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :loading="loading"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #key="{ row }">
        <div class="variable-key-cell">
          <el-tooltip :content="row.key" placement="top" :show-after="300">
            <span class="key-text">{{ row.key }}</span>
          </el-tooltip>
        </div>
      </template>

      <template #value="{ row }">
        <div class="variable-value-cell">
          <el-tooltip :content="row.secret ? '敏感变量已隐藏' : row.value" placement="top" :show-after="300">
            <span class="value-text" :class="{ 'is-secret': row.secret }">
              {{ row.secret ? "••••••••" : row.value }}
            </span>
          </el-tooltip>
        </div>
      </template>

      <template #secret="{ row }">
        <span class="secret-badge" :class="{ sensitive: row.secret }">
          {{ row.secret ? "敏感" : "普通" }}
        </span>
      </template>

      <template #utime="{ row }">
        <span class="time-text">{{ formatVariableTime(row.utime || row.ctime) }}</span>
      </template>

      <template #actions="{ row }">
        <OperateBtn :items="operateItems" :operate-item="row" :max-length="2" @routeEvent="handleOperateEvent" />
      </template>
    </DataTable>

    <FormDialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑全局变量' : '新增全局变量'"
      subtitle="配置可被任务执行流程复用的 Key/Value 参数"
      width="560px"
      :header-icon="Key"
      :confirm-loading="submitLoading"
      confirm-text="保存"
      footer-info-text="敏感变量会在列表中默认隐藏变量值"
      @closed="handleDialogClosed"
      @cancel="dialogVisible = false"
      @confirm="submitForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="variable-form">
        <el-form-item label="变量名" prop="key">
          <el-input v-model="formData.key" placeholder="请输入变量名，如：DEPLOY_ENV" clearable />
        </el-form-item>

        <el-form-item label="变量值" prop="value">
          <el-input
            v-model="formData.value"
            :type="formData.secret ? 'password' : 'textarea'"
            :rows="formData.secret ? undefined : 4"
            placeholder="请输入变量值"
            show-password
            clearable
          />
        </el-form-item>

        <div class="secret-switch-row">
          <div>
            <span class="switch-title">敏感变量</span>
            <span class="switch-desc">开启后列表默认遮罩变量值</span>
          </div>
          <el-switch v-model="formData.secret" />
        </div>
      </el-form>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { h, reactive, ref, watch } from "vue"
import { Delete, Edit, Key } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { usePagination } from "@/common/composables/usePagination"
import { formatTimestamp } from "@/common/utils/day"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import {
  createVariableApi,
  deleteVariableApi,
  listVariablesApi,
  updateVariableApi
} from "@/api/task/variable"
import type { CreateVariableReq, VariableVO } from "@/api/task/variable/type"
import type { Column } from "@@/components/DataTable/types"

type VariableFormData = CreateVariableReq & { id?: number }

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const variablesData = ref<VariableVO[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEditMode = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<VariableFormData>({
  key: "",
  value: "",
  secret: false
})

const formRules: FormRules = {
  key: [
    { required: true, message: "请输入变量名", trigger: "blur" },
    { min: 1, max: 128, message: "变量名长度需在 1 到 128 个字符之间", trigger: "blur" }
  ],
  value: [{ required: true, message: "请输入变量值", trigger: "blur" }]
}

const tableColumns: Column[] = [
  { prop: "key", label: "变量名", slot: "key", align: "center", minWidth: 220 },
  { prop: "value", label: "变量值", slot: "value", align: "center", minWidth: 260 },
  { prop: "secret", label: "类型", slot: "secret", align: "center", width: 110 },
  { prop: "utime", label: "更新时间", slot: "utime", align: "center", minWidth: 170 }
]

const operateItems = [
  { name: "编辑", code: "edit", type: "primary", icon: Edit, capability: TASK_CAPABILITIES.Variable.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: TASK_CAPABILITIES.Variable.Delete }
]

const buildListParams = () => ({
  offset: (paginationData.currentPage - 1) * paginationData.pageSize,
  limit: paginationData.pageSize
})

const loadVariables = async () => {
  loading.value = true
  try {
    const { data } = await listVariablesApi(buildListParams())
    paginationData.total = data.total || 0
    variablesData.value = data.variables || []
  } catch {
    variablesData.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.id = undefined
  formData.key = ""
  formData.value = ""
  formData.secret = false
  formRef.value?.clearValidate()
}

const handleCreate = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: VariableVO) => {
  isEditMode.value = true
  formData.id = row.id
  formData.key = row.key
  formData.value = row.value
  formData.secret = row.secret
  dialogVisible.value = true
}

const handleDelete = (row: VariableVO) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除变量: "),
      h("i", { style: "color: #dc2626" }, row.key),
      h("span", null, "，确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteVariableApi(row.id)
    ElMessage.success("删除成功")
    loadVariables()
  })
}

const handleOperateEvent = (row: VariableVO, action: string) => {
  if (action === "edit") handleEdit(row)
  if (action === "delete") handleDelete(row)
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate()
  submitLoading.value = true
  try {
    const payload = {
      key: formData.key.trim(),
      value: formData.value,
      secret: formData.secret
    }
    if (isEditMode.value && formData.id) {
      await updateVariableApi({ id: formData.id, ...payload })
    } else {
      await createVariableApi(payload)
    }
    ElMessage.success("保存成功")
    dialogVisible.value = false
    loadVariables()
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClosed = () => {
  resetForm()
  isEditMode.value = false
}

const formatVariableTime = (timestamp?: number) => {
  if (!timestamp) return "-"
  const normalized = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return formatTimestamp(normalized)
}

watch([() => paginationData.currentPage, () => paginationData.pageSize], loadVariables, { immediate: true })
</script>

<style scoped lang="scss">
.variable-key-cell,
.variable-value-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.key-text,
.value-text {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-text {
  color: #1f2937;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  font-weight: 700;
}

.value-text {
  color: #667085;
  font-size: 13px;

  &.is-secret {
    color: #98a2b3;
    letter-spacing: 0.08em;
  }
}

.secret-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  min-width: 46px;
  padding: 0 9px;
  color: #16803c;
  background: #f2fbf5;
  border: 1px solid #c7efd5;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;

  &.sensitive {
    color: #b42318;
    background: #fff7f5;
    border-color: #f4b7ae;
  }
}

.time-text {
  color: #667085;
  font-size: 12px;
}

.variable-form {
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

.secret-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  background: #fbfcfe;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
}

.switch-title,
.switch-desc {
  display: block;
}

.switch-title {
  color: #344054;
  font-size: 13px;
  font-weight: 700;
}

.switch-desc {
  margin-top: 3px;
  color: #98a2b3;
  font-size: 12px;
}
</style>
