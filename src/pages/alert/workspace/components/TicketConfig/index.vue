<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="工单配置"
      subtitle="配置告警转工单规则"
      :show-back-button="false"
      :show-add-button="true"
      :show-refresh-button="true"
      :add-button-text="'添加配置'"
      @add="handleAddConfig"
      @refresh="loadConfigs"
    />

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
      <!-- 配置名称插槽 -->
      <template #name="{ row }">
        <div class="name-cell">
          <h4 class="config-name">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 描述插槽 -->
      <template #description="{ row }">
        <div class="description-cell">
          <p class="config-description">{{ row.description || "暂无描述" }}</p>
        </div>
      </template>

      <!-- 状态插槽 -->
      <template #enabled="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
          {{ row.enabled ? "已启用" : "已禁用" }}
        </el-tag>
      </template>

      <!-- 匹配条件插槽 -->
      <template #matchers="{ row }">
        <div class="matchers-cell">
          <el-tag v-if="row.matchers && row.matchers.length > 0" size="small" type="info">
            {{ row.matchers.length }} 个匹配器
          </el-tag>
          <span v-else class="text-placeholder">-</span>
        </div>
      </template>

      <!-- 告警级别插槽 -->
      <template #levels="{ row }">
        <div class="levels-cell">
          <el-tag v-for="level in row.levels" :key="level" size="small" type="warning" style="margin-right: 4px">
            P{{ level - 1 }}-{{ getLevelText(level) }}
          </el-tag>
          <span v-if="!row.levels || row.levels.length === 0" class="text-placeholder">-</span>
        </div>
      </template>

      <!-- 触发条件插槽 -->
      <template #trigger="{ row }">
        <div class="trigger-cell">
          <div class="trigger-item">
            <span class="trigger-label">持续:</span>
            <span class="trigger-value">{{ formatDuration(row.duration) }}</span>
          </div>
          <div class="trigger-item">
            <span class="trigger-label">次数:</span>
            <span class="trigger-value">{{ row.eval_count }}次</span>
          </div>
        </div>
      </template>

      <!-- 工单配置插槽 -->
      <template #ticket="{ row }">
        <div class="ticket-cell">
          <div class="ticket-item">
            <span class="ticket-label">模板:</span>
            <span class="ticket-value">{{ row.template_id }}</span>
          </div>
          <div class="ticket-item">
            <span class="ticket-label">工作流:</span>
            <span class="ticket-value">{{ row.workflow_id }}</span>
          </div>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑抽屉 -->
    <Drawer
      v-model="drawerVisible"
      :title="isEdit ? '编辑工单配置' : '添加工单配置'"
      :subtitle="isEdit ? '修改工单配置' : '新建告警转工单规则'"
      header-icon="Document"
      size="50%"
      :confirm-loading="submitting"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <TicketConfigForm
        v-if="Object.keys(formData).length > 0"
        ref="ticketConfigFormRef"
        v-model:form-data="formData"
        :workspace-id="workspaceId"
        :is-edit="isEdit"
      />
    </Drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import type { TicketConfig } from "@/api/alert/ticket_config/types"
import {
  createTicketConfigApi,
  updateTicketConfigApi,
  deleteTicketConfigApi,
  toggleTicketConfigStatusApi,
  listTicketConfigsByWorkspaceApi,
  swapPrioritiesApi
} from "@/api/alert/ticket_config/index"
import { useTicketConfigForm } from "./composables/useTicketConfigForm"
import TicketConfigForm from "./components/TicketConfigForm.vue"

// 接收工作空间ID
const props = defineProps<{
  workspaceId: number
}>()

// 使用表单 composable
const { formData, resetForm, fillFormForEdit, getCleanedFormData } = useTicketConfigForm()

// 响应式数据
const loading = ref(false)
const configs = ref<TicketConfig[]>([])
const currentConfig = ref<TicketConfig | null>(null)
const drawerVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const ticketConfigFormRef = ref<InstanceType<typeof TicketConfigForm>>()

// 加载工单配置列表
const loadConfigs = async () => {
  try {
    loading.value = true
    const response = await listTicketConfigsByWorkspaceApi(props.workspaceId)
    configs.value = Array.isArray(response.data.ticket_configs) ? response.data.ticket_configs : []
  } catch (error) {
    console.error("加载工单配置失败:", error)
    ElMessage.error("加载工单配置失败")
    configs.value = []
  } finally {
    loading.value = false
  }
}

// 获取级别文本
const getLevelText = (level: number) => {
  const levelMap: Record<number, string> = {
    1: "紧急",
    2: "严重",
    3: "错误",
    4: "警告",
    5: "提示"
  }
  return levelMap[level] || "未知"
}

// 格式化持续时间
const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`
  } else {
    return `${Math.floor(seconds / 3600)}小时`
  }
}

// 表格列配置
const tableColumns = [
  { prop: "name", label: "配置名称", minWidth: 150, slot: "name" },
  { prop: "description", label: "描述", minWidth: 150, slot: "description" },
  { prop: "enabled", label: "状态", minWidth: 100, slot: "enabled" },
  { prop: "matchers", label: "匹配器", minWidth: 100, slot: "matchers" },
  { prop: "levels", label: "告警级别", minWidth: 150, slot: "levels" },
  { prop: "trigger", label: "触发条件", minWidth: 150, slot: "trigger" },
  { prop: "ticket", label: "工单配置", minWidth: 150, slot: "ticket" }
]

// 获取操作按钮配置
const getOperateItems = (row: TicketConfig) => {
  const items = [
    {
      name: "编辑",
      code: "edit",
      type: "primary",
      icon: "Edit"
    },
    {
      name: row.enabled ? "禁用" : "启用",
      code: "toggle",
      type: row.enabled ? "warning" : "success",
      icon: "Refresh"
    },
    {
      name: "删除",
      code: "delete",
      type: "danger",
      icon: "Delete"
    }
  ]
  return items
}

// 添加配置
const handleAddConfig = () => {
  isEdit.value = false
  currentConfig.value = null
  formData.value.workspace_id = props.workspaceId
  drawerVisible.value = true
}

// 编辑配置
const handleEditConfig = (config: TicketConfig) => {
  isEdit.value = true
  currentConfig.value = config
  fillFormForEdit(config)
  drawerVisible.value = true
}

// 删除配置
const handleDeleteConfig = async (config: TicketConfig) => {
  await ElMessageBox.confirm(`确定要删除工单配置"${config.name}"吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await deleteTicketConfigApi(config.id)
  ElMessage.success("删除成功")
  loadConfigs()
}

// 切换配置状态
const handleToggleConfig = async (config: TicketConfig) => {
  await toggleTicketConfigStatusApi(config.id)
  ElMessage.success(`${config.enabled ? "启用" : "禁用"}成功`)
  loadConfigs()
}

// 处理拖拽排序
const handleRowDrag = async (newData: TicketConfig[]) => {
  try {
    // 找到被移动的配置
    for (let i = 0; i < newData.length; i++) {
      const newConfig = newData[i]
      const originalConfig = configs.value[i]

      // 如果配置ID不匹配，说明这个配置被移动了
      if (originalConfig && newConfig.id !== originalConfig.id) {
        // 直接调用交换接口
        await swapPrioritiesApi({
          src_id: originalConfig.id,
          dst_id: newConfig.id
        })
        ElMessage.success("优先级更新成功")
        return
      }
    }
  } finally {
    loadConfigs()
  }
}

// 操作事件处理
const operateEvent = (row: TicketConfig, action: string) => {
  switch (action) {
    case "edit":
      handleEditConfig(row)
      break
    case "toggle":
      handleToggleConfig(row)
      break
    case "delete":
      handleDeleteConfig(row)
      break
  }
}

// 提交表单
const handleConfirm = async () => {
  const formRef = ticketConfigFormRef.value?.formRef
  if (!formRef) {
    ElMessage.warning("表单未初始化")
    return
  }

  const isValid = await formRef.validate().catch(() => false)
  if (!isValid) {
    ElMessage.warning("请完善必填信息")
    return
  }

  try {
    submitting.value = true

    const cleanedData = getCleanedFormData()
    if (!cleanedData) {
      ElMessage.warning("表单数据异常")
      return
    }

    if (isEdit.value && currentConfig.value?.id) {
      await updateTicketConfigApi({ id: currentConfig.value.id, ...cleanedData })
      ElMessage.success("更新成功")
    } else {
      await createTicketConfigApi(cleanedData)
      ElMessage.success("创建成功")
    }

    handleCancel()
    loadConfigs()
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  drawerVisible.value = false
  isEdit.value = false
  currentConfig.value = null
  resetForm()
}

// 初始化
onMounted(() => {
  loadConfigs()
})
</script>

<style lang="scss" scoped>
.name-cell {
  .config-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.5;
  }
}

.description-cell {
  .config-description {
    margin: 0;
    font-size: 12px;
    color: #999;
    line-height: 1.5;
  }
}

.matchers-cell,
.levels-cell,
.ticket-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trigger-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .trigger-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .trigger-label {
      color: #999;
    }

    .trigger-value {
      color: #333;
      font-weight: 500;
    }
  }
}

.ticket-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .ticket-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .ticket-label {
      color: #999;
    }

    .ticket-value {
      color: #333;
      font-weight: 500;
    }
  }
}

.text-placeholder {
  color: #999;
  font-size: 12px;
}

:deep(.el-table) {
  .cell {
    overflow: visible;
  }
}
</style>
