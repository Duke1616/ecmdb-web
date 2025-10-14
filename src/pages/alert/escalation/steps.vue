<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="升级步骤管理"
      subtitle="管理升级配置中的步骤"
      :show-back-button="true"
      @refresh="loadSteps"
      @back="handleBack"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="handleAddStep"> 新增步骤 </el-button>
      </template>
    </ManagerHeader>

    <!-- 升级步骤表格 -->
    <EscalationStepsTable
      v-model="steps"
      v-loading="loading"
      @add-step="handleAddStep"
      @edit-step="handleEditStep"
      @delete-step="handleDeleteStep"
      @row-drag="handleStepRowDrag"
    />

    <!-- 编辑抽屉 -->
    <CustomDrawer
      v-model="drawerVisible"
      :title="drawerTitle"
      :subtitle="drawerSubtitle"
      size="50%"
      direction="rtl"
      :show-footer="true"
      @closed="handleDrawerClose"
      @confirm="handleSubmit"
    >
      <template #footer>
        <el-button @click="handleDrawerClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? "更新" : "保存" }}
        </el-button>
      </template>

      <EscalationStepForm v-if="drawerVisible" v-model="currentStep" ref="formRef" />
    </CustomDrawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { clearZeroValues } from "@@/utils"
import type { StepVO, CreateStepReq } from "@/api/alert/escalation/types"
import { listStepsByConfigIDApi, createStepApi, updateStepApi, deleteStepApi } from "@/api/alert/escalation"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import EscalationStepsTable from "./components/EscalationStepsTable.vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import EscalationStepForm from "./components/EscalationStepForm.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const steps = ref<StepVO[]>([])
const loading = ref(false)

// 编辑相关状态
const drawerVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const currentStepIndex = ref(-1)
const currentStep = ref<CreateStepReq>({
  level: 1,
  template_set_id: 0,
  step_template_id: 0,
  delay: 0,
  max_retries: 3,
  retry_interval: 300,
  skip_if_handled: false,
  continue_on_fail: false,
  condition_expr: "",
  urgency_level: 1,
  config_id: 0
})
const formRef = ref()

// 计算属性
const configId = computed(() => Number(route.params.id))
const drawerTitle = computed(() => (isEdit.value ? "编辑升级步骤" : "添加升级步骤"))
const drawerSubtitle = computed(() => (isEdit.value ? `升级步骤 ${currentStepIndex.value + 1}` : "添加新的升级步骤"))

// 加载步骤数据
const loadSteps = async () => {
  if (!configId.value) return

  loading.value = true
  try {
    const response = await listStepsByConfigIDApi({
      config_id: configId.value
    })
    steps.value = response.data.steps || []
  } catch (error) {
    console.error("加载步骤数据失败:", error)
    ElMessage.error("加载步骤数据失败")
  } finally {
    loading.value = false
  }
}

// 处理添加步骤回调
const handleAddStep = () => {
  isEdit.value = false
  currentStepIndex.value = -1

  const newStepData: CreateStepReq = {
    level: steps.value.length + 1,
    template_set_id: 0,
    step_template_id: 0,
    delay: 0,
    max_retries: 3,
    retry_interval: 300,
    skip_if_handled: false,
    continue_on_fail: false,
    condition_expr: "",
    urgency_level: 1,
    config_id: configId.value
  }

  currentStep.value = clearZeroValues(newStepData) as CreateStepReq
  drawerVisible.value = true
}

// 处理编辑步骤回调
const handleEditStep = (index: number, step: CreateStepReq) => {
  isEdit.value = true
  currentStepIndex.value = index

  const editStepData: CreateStepReq = {
    level: step.level,
    template_set_id: step.template_set_id,
    step_template_id: step.step_template_id,
    delay: step.delay,
    max_retries: step.max_retries,
    retry_interval: step.retry_interval,
    skip_if_handled: step.skip_if_handled,
    continue_on_fail: step.continue_on_fail,
    condition_expr: step.condition_expr,
    urgency_level: step.urgency_level,
    config_id: configId.value
  }

  currentStep.value = clearZeroValues(editStepData) as CreateStepReq
  drawerVisible.value = true
}

// 处理删除步骤回调
const handleDeleteStep = async (index: number, step: CreateStepReq) => {
  try {
    await ElMessageBox.confirm(`确定要删除第 ${step.level} 级步骤吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 获取要删除的步骤的 ID
    const stepToDelete = steps.value[index]
    if (stepToDelete) {
      // 调用删除 API
      await deleteStepApi(stepToDelete.id)
      ElMessage.success("删除成功")

      // 重新加载数据
      await loadSteps()
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除步骤失败:", error)
      ElMessage.error("删除步骤失败")
    }
  }
}

// 处理步骤拖拽回调
const handleStepRowDrag = async (newSteps: CreateStepReq[]) => {
  try {
    // 重新计算级别并批量更新
    const updatePromises = newSteps.map((step, index) => {
      const originalStep = steps.value[index]
      if (originalStep && step.level !== index + 1) {
        const updateData = {
          id: originalStep.id,
          level: index + 1,
          template_set_id: step.template_set_id || 0,
          step_template_id: step.step_template_id || 0,
          delay: step.delay,
          max_retries: step.max_retries,
          retry_interval: step.retry_interval,
          skip_if_handled: step.skip_if_handled,
          continue_on_fail: step.continue_on_fail,
          condition_expr: step.condition_expr,
          urgency_level: step.urgency_level
        }
        return updateStepApi(updateData)
      }
      return Promise.resolve()
    })

    await Promise.all(updatePromises.filter(Boolean))

    // 更新本地数据
    steps.value = newSteps.map((step, index) => ({
      ...steps.value[index],
      level: index + 1
    }))

    ElMessage.success("步骤顺序已更新")
  } catch (error) {
    console.error("更新步骤顺序失败:", error)
    ElMessage.error("更新步骤顺序失败")
    // 重新加载数据
    await loadSteps()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    submitLoading.value = true

    const submitData = cloneDeep(currentStep.value)

    if (isEdit.value && currentStepIndex.value !== -1) {
      // 更新现有步骤
      const stepToUpdate = steps.value[currentStepIndex.value]
      await updateStepApi({
        id: stepToUpdate.id,
        level: submitData.level,
        template_set_id: submitData.template_set_id || 0,
        step_template_id: submitData.step_template_id || 0,
        delay: submitData.delay,
        max_retries: submitData.max_retries,
        retry_interval: submitData.retry_interval,
        skip_if_handled: submitData.skip_if_handled,
        continue_on_fail: submitData.continue_on_fail,
        condition_expr: submitData.condition_expr,
        urgency_level: submitData.urgency_level
      })
      ElMessage.success("更新成功")
    } else {
      // 创建新步骤
      await createStepApi(submitData)
      ElMessage.success("创建成功")
    }

    drawerVisible.value = false
    await loadSteps()
  } catch (error) {
    console.error("保存步骤失败:", error)
    ElMessage.error("保存步骤失败")
  } finally {
    submitLoading.value = false
  }
}

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false
  formRef.value?.resetFields()
}

// 返回操作
const handleBack = () => {
  router.go(-1)
}

// 初始化加载数据
onMounted(async () => {
  await loadSteps()
})
</script>
