<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="升级配置" subtitle="管理消息升级配置" @refresh="loadConfigs">
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建配置 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="configs"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="false"
      :enable-row-drag="true"
      v-loading="loading"
      @row-drag="handleRowDrag"
    >
      <!-- 配置信息插槽 -->
      <template #configInfo="{ row }">
        <div class="config-info-cell">
          <h4 class="config-name">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 状态插槽 -->
      <template #status="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "已启用" : "已禁用" }}
        </el-tag>
      </template>

      <!-- 步骤数量插槽 -->
      <template #stepCount="{ row }">
        <div class="step-count-cell">
          <el-tag type="info" size="small"> {{ row.steps?.length || 0 }} 个步骤 </el-tag>
        </div>
      </template>

      <!-- 所属业务插槽 -->
      <template #businessInfo="{ row }">
        <div class="business-cell">
          <el-tag type="primary" size="small">{{ getBusinessTypeLabel(row.biz_id) }}</el-tag>
        </div>
      </template>

      <!-- 详情信息插槽 -->
      <template #details="{ row }">
        <div class="details-cell">
          <el-tooltip :content="`描述: ${row.description || '暂无描述'}`" placement="top" effect="dark">
            <div class="template-desc">{{ row.description || "暂无描述" }}</div>
          </el-tooltip>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="3" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑抽屉 -->
    <CustomDrawer
      v-model="drawerVisible"
      :title="drawerTitle"
      subtitle="请填写升级配置的基本信息"
      size="45%"
      header-icon="Setting"
      :before-close="handleDrawerClose"
      @confirm="handleSubmit"
      @closed="handleDrawerClose"
    >
      <EscalationConfigEditForm ref="formRef" v-model="formData" />
    </CustomDrawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import type { ConfigVO, CreateConfigReq } from "@/api/alert/escalation/types"
import { ESCALATION_LOGIC_TYPES } from "@/api/alert/escalation/types"
import {
  createConfigApi,
  updateConfigApi,
  deleteConfigApi,
  updateConfigStatusApi,
  listConfigsByBizKeyApi
} from "@/api/alert/escalation"
import { getBusinessTypeLabel } from "@@/utils"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import EscalationConfigEditForm from "@/pages/alert/escalation/components/EscalationConfigEditForm.vue"

// 路由
const router = useRouter()

const props = defineProps<{
  workspaceId: number
  workspaceName?: string
}>()

// 响应式数据
const configs = ref<ConfigVO[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const submitLoading = ref(false)
const formData = ref<CreateConfigReq>({
  biz_id: 1,
  key: "",
  name: "",
  description: "",
  enabled: true,
  timeout: 300,
  triggers: [],
  trigger_logic: { type: ESCALATION_LOGIC_TYPES.ALL, expression: "", description: "" },
  steps: [],
  created_by: "admin"
})

// 表单引用
const formRef = ref()

// 编辑状态
const isEdit = ref(false)
const currentEditId = ref<number | null>(null)

// 计算属性
const drawerTitle = computed(() => (isEdit.value ? "编辑配置" : "创建配置"))

// 表格列配置
const tableColumns = [
  {
    prop: "configInfo",
    label: "配置信息",
    minWidth: 120,
    slot: "configInfo"
  },
  {
    prop: "status",
    label: "状态",
    minWidth: 100,
    slot: "status"
  },
  {
    prop: "stepCount",
    label: "步骤数量",
    minWidth: 140,
    slot: "stepCount"
  },
  {
    prop: "businessInfo",
    label: "所属业务",
    minWidth: 140,
    slot: "businessInfo"
  },
  {
    prop: "details",
    label: "详情信息",
    minWidth: 200,
    slot: "details"
  }
]

// 获取操作按钮配置
const getOperateItems = (config: ConfigVO) => {
  return [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "管理步骤", code: "steps", type: "info" },
    { name: config.enabled ? "禁用" : "启用", code: "toggle", type: config.enabled ? "warning" : "success" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 操作事件处理
const operateEvent = (config: ConfigVO, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(config)
      break
    case "steps":
      handleManageSteps(config)
      break
    case "toggle":
      handleToggleStatus(config)
      break
    case "delete":
      handleDelete(config)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 处理行拖拽事件
const handleRowDrag = async (newData: ConfigVO[]) => {
  try {
    // 更新本地数据
    configs.value = newData

    // 这里可以调用API来保存新的排序
    // 例如：await updateConfigOrderApi(newData.map((item, index) => ({ id: item.id, order: index })))

    ElMessage.success("排序已更新")
  } catch (error) {
    console.error("更新排序失败:", error)
    ElMessage.error("更新排序失败")
    // 重新加载数据以恢复原始状态
    await loadConfigs()
  }
}

// 加载配置数据
const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await listConfigsByBizKeyApi({
      biz_id: 1,
      key: props.workspaceId.toString()
    })

    configs.value = response.data.configs || []
  } finally {
    loading.value = false
  }
}

// 创建配置
const handleCreate = () => {
  router.push({
    name: "EscalationConfigCreate",
    query: {
      biz_id: 1, // 工作空间业务类型
      key: props.workspaceId.toString(), // 工作空间ID作为key
      key_name: props.workspaceName || `工作空间 ${props.workspaceId}` // 工作空间名称用于展示
    }
  })
}

// 编辑配置
const handleEdit = (config: ConfigVO) => {
  isEdit.value = true
  currentEditId.value = config.id
  formData.value = {
    biz_id: config.biz_id,
    key: config.key,
    name: config.name,
    description: config.description,
    enabled: config.enabled,
    timeout: config.timeout,
    triggers: config.triggers,
    trigger_logic: config.trigger_logic,
    steps: config.steps,
    created_by: config.created_by
  }
  drawerVisible.value = true
}

// 管理步骤
const handleManageSteps = (config: ConfigVO) => {
  router.push(`/alert/escalation/steps/${config.id}`)
}

// 切换状态
const handleToggleStatus = async (config: ConfigVO) => {
  const action = config.enabled ? "禁用" : "启用"
  await ElMessageBox.confirm(`确定要${action}配置 "${config.name}" 吗？`, `确认${action}`, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await updateConfigStatusApi({
    id: config.id,
    enabled: !config.enabled
  })

  await loadConfigs()
}

// 删除配置
const handleDelete = async (config: ConfigVO) => {
  await ElMessageBox.confirm(`确定要删除配置 "${config.name}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await deleteConfigApi(config.id)
  await loadConfigs()
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
      await updateConfigApi({
        id: currentEditId.value,
        name: formData.value.name,
        description: formData.value.description,
        enabled: formData.value.enabled,
        timeout: formData.value.timeout,
        triggers: formData.value.triggers,
        trigger_logic: formData.value.trigger_logic,
        steps: formData.value.steps
      })
    } else {
      // 创建
      await createConfigApi(formData.value)
    }

    drawerVisible.value = false
    await loadConfigs()
  } finally {
    submitLoading.value = false
  }
}

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false
  formRef.value?.resetFields()
}

// 暴露方法给父组件
defineExpose({
  loadConfigs
})

// 初始化加载数据
onMounted(() => {
  loadConfigs()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 0px !important;
  background: transparent !important;
  width: 100%;
  height: 100%;
}

// 配置信息样式
.config-info-cell {
  .config-name {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }

  .config-key {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 2px;
  }

  .config-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
  }
}

// 步骤数量样式
.step-count-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 所属业务样式
.business-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .business-key {
    font-size: 12px;
    color: #6b7280;
    word-break: break-all;
    text-align: center;
  }
}

// 时间样式
.time-cell {
  font-size: 14px;
  color: #1f2937;
}
</style>
