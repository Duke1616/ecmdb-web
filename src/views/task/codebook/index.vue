<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <ManagerHeader
      title="代码本管理"
      subtitle="管理任务代码本和脚本配置"
      add-button-text="新增代码本"
      @add="handlerCreate"
      @refresh="listCodebooksData"
    />

    <!-- 主内容区域 -->
    <DataTable
      :data="codebooksData"
      :columns="tableColumns"
      :actions="tableActions"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @action="handleTableAction"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    <!-- 新增/编辑模版 -->
    <el-card v-show="addDialogDrawer">
      <!-- 代码编辑器模式选择器 -->
      <div class="editor-mode-selector">
        <el-radio-group v-model="codeEditorMode" size="small" :teleported="false">
          <el-radio-button label="simple">简单模式</el-radio-button>
          <el-radio-button label="advanced">文件管理模式</el-radio-button>
        </el-radio-group>
      </div>

      <WizardContainer
        :steps="codebookSteps"
        :formData="formData"
        :formRules="formRules"
        @update:formData="updateFormData"
        @close="onClosed"
        @save="saveCodebook"
        ref="wizardRef"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch, computed, nextTick } from "vue"
import { CirclePlus, RefreshRight, Document, Edit } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import WizardContainer from "@@/components/WizardContainer/index.vue"
import { codebook, type createOrUpdateCodebookReq } from "@/api/codebook/types/codebook"
import { cloneDeep } from "lodash-es"
import { deleteCodebookApi, listCodebookApi, createCodebookApi, updateCodebookApi } from "@/api/codebook"
import { ElMessage, ElMessageBox } from "element-plus"
import InfoPage from "./modal/info.vue"
import Code from "./modal/code.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogDrawer = ref<boolean>(false)

const wizardRef = ref()
const codeEditorMode = ref<"simple" | "advanced">("simple")

// 表格列配置
const tableColumns = [
  { prop: "name", label: "名称", align: "center" as const },
  { prop: "identifier", label: "唯一标识", align: "center" as const },
  { prop: "secret", label: "密钥", align: "center" as const }
]

// 表格操作配置
const tableActions = [
  { key: "edit", label: "修改", type: "primary" as const, icon: Edit },
  { key: "delete", label: "删除", type: "danger" as const }
]

// 选中的行
const selectedRows = ref<codebook[]>([])

// 表格操作事件
const handleTableAction = (action: string, row: codebook) => {
  if (action === "edit") {
    handleUpdate(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

// 选择变化事件
const handleSelectionChange = (selection: codebook[]) => {
  selectedRows.value = selection
}

// 向导步骤配置
const codebookSteps = computed(() => [
  {
    title: "基本信息",
    description: "填写脚本基本信息",
    icon: Document,
    component: InfoPage
  },
  {
    title: "代码编写",
    description: codeEditorMode.value === "simple" ? "编写脚本代码" : "管理多文件项目",
    icon: Edit,
    component: Code
  }
])

// 表单数据
const formData = ref<createOrUpdateCodebookReq>(createDefaultFormData())

// 表单验证规则
const formRules = computed(() => {
  const currentStep = wizardRef.value?.currentStep || 0
  if (currentStep === 0) {
    // 基本信息页面验证规则
    return {
      name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
      owner: [{ required: true, message: "必须输入管理员", trigger: "blur" }],
      identifier: [{ required: true, message: "必须输入唯一标识", trigger: "blur" }],
      language: [{ required: true, message: "必须选择脚本语言", trigger: "change" }]
    }
  }
  return {}
})

const codebookRow = ref<codebook>(createDefaultCodebook())

// 创建默认表单数据
function createDefaultFormData(): createOrUpdateCodebookReq {
  return {
    name: "",
    code: "",
    language: "shell",
    owner: "",
    identifier: ""
  }
}

// 创建默认 codebook 数据
function createDefaultCodebook(): codebook {
  return {
    id: 0,
    name: "",
    owner: "",
    code: "",
    language: "",
    identifier: "",
    secret: ""
  }
}

// 重置表单数据
function resetFormData() {
  formData.value = createDefaultFormData()
}

// 重置 codebook 数据
function resetCodebookRow() {
  codebookRow.value = createDefaultCodebook()
}

// 监听弹窗显示状态
watch(
  () => addDialogDrawer.value,
  (val: any) => {
    if (val) {
      // 重置到第一步
      nextTick(() => {
        wizardRef.value?.setStep(0)
      })
    }
  }
)

// 监听编辑数据
watch(
  () => codebookRow.value,
  async (val) => {
    if (val && addDialogDrawer.value) {
      // 使用 nextTick 避免循环更新
      nextTick(async () => {
        const newFormData = cloneDeep(val)
        // owner 现在直接存储为 username，无需转换
        formData.value = newFormData
      })
    } else if (!val) {
      // 重置表单数据
      resetFormData()
    }
  },
  { immediate: true }
)

const handlerCreate = () => {
  resetCodebookRow()
  addDialogDrawer.value = true
}

const handleUpdate = (row: codebook) => {
  codebookRow.value = cloneDeep(row)
  addDialogDrawer.value = true
}

const onClosed = () => {
  addDialogDrawer.value = false
  listCodebooksData()
}

// 向导相关方法
const updateFormData = (data: createOrUpdateCodebookReq) => {
  formData.value = { ...formData.value, ...data }
}

// 准备提交数据
function prepareSubmitData(): createOrUpdateCodebookReq {
  return { ...formData.value }
}

// 判断是否为更新操作
function isUpdateOperation(): boolean {
  return !!formData.value.id
}

// 获取对应的 API 函数
function getApiFunction() {
  return isUpdateOperation() ? updateCodebookApi : createCodebookApi
}

// 处理保存成功
function handleSaveSuccess() {
  ElMessage.success("保存成功")
  onClosed()
}

// 处理保存失败
function handleSaveError(error: any) {
  console.error("保存失败:", error)
  ElMessage.error("保存失败，请重试")
}

const saveCodebook = async () => {
  try {
    const submitData = prepareSubmitData()
    const api = getApiFunction()
    await api(submitData)
    handleSaveSuccess()
  } catch (error) {
    handleSaveError(error)
  }
}

/** 查询模版列表 */
const codebooksData = ref<codebook[]>([])

// 构建查询参数
function buildQueryParams() {
  return {
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  }
}

// 处理查询成功
function handleQuerySuccess(data: any) {
  paginationData.total = data.total
  codebooksData.value = data.codebooks
}

// 处理查询失败
function handleQueryError() {
  codebooksData.value = []
}

const listCodebooksData = () => {
  listCodebookApi(buildQueryParams())
    .then(({ data }) => handleQuerySuccess(data))
    .catch(() => handleQueryError())
    .finally(() => {})
}

// 构建删除确认消息
function buildDeleteMessage(row: codebook) {
  return h("p", null, [
    h("span", null, "正在删除名称: "),
    h("i", { style: "color: red" }, `${row.name}`),
    h("span", null, " 确认删除？")
  ])
}

// 处理删除成功
function handleDeleteSuccess() {
  ElMessage.success("删除成功")
  listCodebooksData()
}

// 执行删除操作
function executeDelete(row: codebook) {
  deleteCodebookApi(row.id).then(handleDeleteSuccess)
}

const handleDelete = (row: codebook) => {
  ElMessageBox({
    title: "删除确认",
    message: buildDeleteMessage(row),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => executeDelete(row))
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listCodebooksData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}

/* 代码编辑器模式选择器 */
.editor-mode-selector {
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  text-align: center;

  .el-radio-group {
    .el-radio-button__inner {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
    }
  }
}

/* WizardContainer 现在自动处理全屏覆盖，无需额外样式 */
</style>
