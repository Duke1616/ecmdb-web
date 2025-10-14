<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`升级步骤 - ${config?.name || ''}`"
      subtitle="管理升级配置中的步骤"
      :show-back-button="true"
      @refresh="loadSteps"
      @back="handleBack"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 添加步骤 </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          class="action-btn"
          @click="handleDeleteAll"
          :disabled="selectedSteps.length === 0"
        >
          批量删除
        </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="steps"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="false"
      :table-props="tableProps"
      :enable-row-drag="true"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @row-drag="handleRowDrag"
    >
      <!-- 步骤级别插槽 -->
      <template #level="{ row }">
        <div class="level-cell">
          <el-tag type="primary" size="default"> 第 {{ row.level }} 级 </el-tag>
        </div>
      </template>

      <!-- 模板集信息插槽 -->
      <template #templateSet="{ row }">
        <div class="template-set-cell">
          <div class="template-set-id">模板集ID: {{ row.template_set_id }}</div>
          <div v-if="row.escalation_step_template" class="template-name">
            {{ row.escalation_step_template.name }}
          </div>
        </div>
      </template>

      <!-- 延迟时间插槽 -->
      <template #delay="{ row }">
        <div class="delay-cell">
          <el-tag type="info" size="small"> {{ row.delay }}秒 </el-tag>
        </div>
      </template>

      <!-- 重试配置插槽 -->
      <template #retry="{ row }">
        <div class="retry-cell">
          <div class="retry-info">
            <span>重试: {{ row.max_retries }}次</span>
            <span>间隔: {{ row.retry_interval }}秒</span>
          </div>
        </div>
      </template>

      <!-- 紧急程度插槽 -->
      <template #urgency="{ row }">
        <div class="urgency-cell">
          <el-tag :type="getUrgencyType(row.urgency_level)" size="small">
            {{ getUrgencyLabel(row.urgency_level) }}
          </el-tag>
        </div>
      </template>

      <!-- 条件表达式插槽 -->
      <template #condition="{ row }">
        <div class="condition-cell">
          <el-text v-if="row.condition_expr" type="info" size="small">
            {{ row.condition_expr }}
          </el-text>
          <el-text v-else type="info" size="small">无条件</el-text>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      subtitle="请填写升级步骤的基本信息"
      width="600px"
      :confirm-loading="submitLoading"
      confirm-text="确定"
      header-icon="Operation"
      @confirm="handleSubmit"
      @cancel="handleDialogClose"
      @closed="handleDialogClose"
    >
      <EscalationStepForm ref="formRef" v-model="formData" />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Delete } from "@element-plus/icons-vue"
import type { StepVO, CreateStepReq, ConfigVO } from "@/api/alert/escalation/types"
import { listStepsByConfigIDApi, createStepApi, updateStepApi, deleteStepApi } from "@/api/alert/escalation"
import { getConfigApi } from "@/api/alert/escalation"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import EscalationStepForm from "./components/EscalationStepForm.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const config = ref<ConfigVO | null>(null)
const steps = ref<StepVO[]>([])
const selectedSteps = ref<StepVO[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formData = ref<CreateStepReq>({
  level: 1,
  template_set_id: 0,
  step_template_id: 0,
  delay: 0,
  max_retries: 3,
  retry_interval: 60,
  skip_if_handled: false,
  continue_on_fail: true,
  condition_expr: "",
  urgency_level: 1
})

// 表单引用
const formRef = ref()

// 编辑状态
const isEdit = ref(false)
const currentEditId = ref<number | null>(null)

// 计算属性
const dialogTitle = computed(() => (isEdit.value ? "编辑步骤" : "添加步骤"))
const configId = computed(() => Number(route.params.id))

// 表格列配置
const tableColumns = [
  {
    prop: "level",
    label: "升级级别",
    width: 120,
    slot: "level"
  },
  {
    prop: "templateSet",
    label: "模板集信息",
    minWidth: 200,
    slot: "templateSet"
  },
  {
    prop: "delay",
    label: "延迟时间",
    width: 100,
    slot: "delay"
  },
  {
    prop: "retry",
    label: "重试配置",
    width: 150,
    slot: "retry"
  },
  {
    prop: "urgency",
    label: "紧急程度",
    width: 100,
    slot: "urgency"
  },
  {
    prop: "condition",
    label: "条件表达式",
    minWidth: 200,
    slot: "condition"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)"
}

// 获取紧急程度标签类型
const getUrgencyType = (level: number) => {
  const types = ["", "success", "info", "warning", "danger", "danger"]
  return (types[level] || "info") as "success" | "info" | "warning" | "danger"
}

// 获取紧急程度标签文字
const getUrgencyLabel = (level: number) => {
  const labels = ["", "低", "较低", "中等", "高", "紧急"]
  return labels[level] || "未知"
}

// 获取操作按钮配置
const getOperateItems = (_step: StepVO) => {
  return [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 操作事件处理
const operateEvent = (step: StepVO, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(step)
      break
    case "delete":
      handleDelete(step)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 加载配置信息
const loadConfig = async () => {
  if (!configId.value) return

  const response = await getConfigApi(configId.value)
  config.value = response.data.config
}

// 加载步骤数据
const loadSteps = async () => {
  if (!configId.value) return

  loading.value = true
  try {
    const response = await listStepsByConfigIDApi({
      config_id: configId.value
    })

    steps.value = response.data.steps || []
  } finally {
    loading.value = false
  }
}

// 选择变化处理
const handleSelectionChange = (selection: StepVO[]) => {
  selectedSteps.value = selection
}

// 行拖拽处理
const handleRowDrag = async (newSteps: StepVO[]) => {
  try {
    // 更新本地数据
    steps.value = newSteps

    // 重新计算级别
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      level: index + 1
    }))

    // 批量更新级别
    const updatePromises = updatedSteps.map((step, index) => {
      if (step.level !== index + 1) {
        return updateStepApi({
          id: step.id,
          level: index + 1,
          template_set_id: step.template_set_id,
          step_template_id: step.step_template_id,
          delay: step.delay,
          max_retries: step.max_retries,
          retry_interval: step.retry_interval,
          skip_if_handled: step.skip_if_handled,
          continue_on_fail: step.continue_on_fail,
          condition_expr: step.condition_expr,
          urgency_level: step.urgency_level
        })
      }
      return Promise.resolve()
    })

    await Promise.all(updatePromises.filter(Boolean))

    // 更新本地数据
    steps.value = updatedSteps

    ElMessage.success("步骤顺序已更新")
  } catch (error) {
    ElMessage.error("更新步骤顺序失败")
    // 重新加载数据
    await loadSteps()
  }
}

// 创建步骤
const handleCreate = () => {
  isEdit.value = false
  currentEditId.value = null
  formData.value = {
    config_id: configId.value,
    level: steps.value.length + 1,
    template_set_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 60,
    skip_if_handled: false,
    continue_on_fail: true,
    condition_expr: "",
    urgency_level: 1
  }
  dialogVisible.value = true
}

// 编辑步骤
const handleEdit = (step: StepVO) => {
  isEdit.value = true
  currentEditId.value = step.id
  formData.value = {
    config_id: step.config_id,
    level: step.level,
    template_set_id: step.template_set_id,
    step_template_id: step.step_template_id,
    delay: step.delay,
    max_retries: step.max_retries,
    retry_interval: step.retry_interval,
    skip_if_handled: step.skip_if_handled,
    continue_on_fail: step.continue_on_fail,
    condition_expr: step.condition_expr,
    urgency_level: step.urgency_level
  }
  dialogVisible.value = true
}

// 删除步骤
const handleDelete = async (step: StepVO) => {
  await ElMessageBox.confirm(`确定要删除第 ${step.level} 级步骤吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await deleteStepApi(step.id)
  await loadSteps()
}

// 批量删除
const handleDeleteAll = async () => {
  if (selectedSteps.value.length === 0) {
    ElMessage.warning("请选择要删除的步骤")
    return
  }

  await ElMessageBox.confirm(`确定要删除选中的 ${selectedSteps.value.length} 个步骤吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  const stepIds = selectedSteps.value.map((step) => step.id)
  for (const stepId of stepIds) {
    await deleteStepApi(stepId)
  }

  await loadSteps()
}

// 返回操作
const handleBack = () => {
  router.go(-1)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  const isValid = await formRef.value.validate()
  if (!isValid) return

  submitLoading.value = true

  try {
    if (isEdit.value && currentEditId.value) {
      // 更新
      await updateStepApi({
        id: currentEditId.value,
        level: formData.value.level,
        template_set_id: formData.value.template_set_id,
        step_template_id: formData.value.step_template_id,
        delay: formData.value.delay,
        max_retries: formData.value.max_retries,
        retry_interval: formData.value.retry_interval,
        skip_if_handled: formData.value.skip_if_handled,
        continue_on_fail: formData.value.continue_on_fail,
        condition_expr: formData.value.condition_expr,
        urgency_level: formData.value.urgency_level
      })
    } else {
      // 创建
      await createStepApi(formData.value)
    }

    dialogVisible.value = false
    await loadSteps()
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 初始化加载数据
onMounted(async () => {
  await loadConfig()
  await loadSteps()
})
</script>

<style lang="scss" scoped>
// 级别样式
.level-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 模板集信息样式
.template-set-cell {
  .template-set-id {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .template-name {
    font-size: 12px;
    color: #6b7280;
  }
}

// 延迟时间样式
.delay-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 重试配置样式
.retry-cell {
  .retry-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #6b7280;
  }
}

// 紧急程度样式
.urgency-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 条件表达式样式
.condition-cell {
  font-size: 12px;
  word-break: break-all;
}
</style>
