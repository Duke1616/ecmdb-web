<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="升级步骤模板" subtitle="管理升级步骤模板" @refresh="loadTemplates">
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建模板 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="templates"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="tableProps"
      v-loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 模板信息插槽 -->
      <template #templateInfo="{ row }">
        <div class="template-info-cell">
          <h4 class="template-name">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 详情信息插槽 -->
      <template #details="{ row }">
        <div class="details-cell">
          <el-tooltip
            :content="`描述: ${row.description || '暂无描述'}\n创建时间: ${formatTimestamp(row.ctime)}\n更新时间: ${formatTimestamp(row.utime)}`"
            placement="top"
            effect="dark"
          >
            <div class="template-desc">{{ row.description || "暂无描述" }}</div>
          </el-tooltip>
        </div>
      </template>

      <!-- 通知渠道插槽 -->
      <template #channels="{ row }">
        <div class="channels-cell">
          <div v-if="row.channels && row.channels.length > 0" class="channels-container">
            <el-tooltip
              v-for="channel in row.channels"
              :key="channel"
              :content="`通知渠道: ${getChannelLabel(channel)}`"
              placement="top"
              effect="dark"
            >
              <div class="channel-item">
                <el-icon class="channel-icon"><Bell /></el-icon>
                <span class="channel-name">{{ getChannelLabel(channel) }}</span>
              </div>
            </el-tooltip>
          </div>
          <div v-else class="empty-channels">
            <el-text type="info" size="small">暂无渠道</el-text>
          </div>
        </div>
      </template>

      <!-- 接收者插槽 -->
      <template #receivers="{ row }">
        <div class="receivers-cell">
          <div v-if="row.receivers && row.receivers.length > 0" class="receivers-container">
            <el-tooltip
              v-for="receiver in row.receivers"
              :key="receiver.id"
              :content="getReceiverTooltipContent(receiver)"
              placement="top"
              effect="dark"
            >
              <div class="receiver-item">
                <el-icon class="receiver-icon"><User /></el-icon>
                <span class="receiver-name">{{ receiver.display_name }}</span>
                <el-tag :type="getReceiverTypeTagType(receiver.type)" size="small" class="receiver-type-tag">
                  {{ getReceiverTypeLabel(receiver.type) }}
                </el-tag>
              </div>
            </el-tooltip>
          </div>
          <div v-else class="empty-receivers">
            <el-text type="info" size="small">暂无接收者</el-text>
          </div>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑抽屉 -->
    <CustomDrawer
      v-model="drawerVisible"
      :title="drawerTitle"
      subtitle="请填写升级步骤模板的基本信息"
      size="45%"
      header-icon="Document"
      :before-close="handleDrawerClose"
      @confirm="handleSubmit"
      @closed="handleDrawerClose"
    >
      <EscalationStepTemplateForm ref="formRef" v-model="formData" />
    </CustomDrawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Bell, User } from "@element-plus/icons-vue"
import type { StepTemplateVO, CreateStepTemplateReq } from "@/api/alert/escalation/types"
import {
  listStepTemplatesApi,
  createStepTemplateApi,
  updateStepTemplateApi,
  deleteStepTemplateApi
} from "@/api/alert/escalation"
import { usePagination } from "@/common/composables/usePagination"
import { getChannelLabel } from "../template/config/channels"
import { RECEIVER_TYPES } from "@/api/alert/escalation/types"
import { formatTimestamp } from "./utils"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import EscalationStepTemplateForm from "./components/EscalationStepTemplateForm.vue"

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 响应式数据
const templates = ref<StepTemplateVO[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const submitLoading = ref(false)
const formData = ref<CreateStepTemplateReq>({
  name: "",
  description: "",
  channels: [],
  receivers: []
})

// 表单引用
const formRef = ref()

// 编辑状态
const isEdit = ref(false)
const currentEditId = ref<number | null>(null)

// 计算属性
const drawerTitle = computed(() => (isEdit.value ? "编辑模板" : "创建模板"))

// 获取接收者类型标签
const getReceiverTypeLabel = (type: string) => {
  const typeMap = {
    [RECEIVER_TYPES.USER]: "用户",
    [RECEIVER_TYPES.TEAM]: "团队",
    [RECEIVER_TYPES.DEPARTMENT]: "部门",
    [RECEIVER_TYPES.ONCALL]: "排班"
  }
  return typeMap[type as keyof typeof typeMap] || "未知类型"
}

// 获取接收者类型标签颜色
const getReceiverTypeTagType = (type: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap = {
    [RECEIVER_TYPES.USER]: "primary" as const,
    [RECEIVER_TYPES.TEAM]: "success" as const,
    [RECEIVER_TYPES.DEPARTMENT]: "warning" as const,
    [RECEIVER_TYPES.ONCALL]: "info" as const
  }
  return typeMap[type as keyof typeof typeMap] || "info"
}

// 获取接收者tooltip内容
const getReceiverTooltipContent = (receiver: any) => {
  const typeLabel = getReceiverTypeLabel(receiver.type)
  const metadata = receiver.metadata || {}

  let content = `接收者: ${receiver.display_name}\n类型: ${typeLabel}`

  // 根据不同类型添加额外信息
  if (receiver.type === RECEIVER_TYPES.USER && metadata.email) {
    content += `\n邮箱: ${metadata.email}`
  } else if (receiver.type === RECEIVER_TYPES.TEAM && metadata.description) {
    content += `\n描述: ${metadata.description}`
  } else if (receiver.type === RECEIVER_TYPES.DEPARTMENT && metadata.path) {
    content += `\n路径: ${metadata.path}`
  } else if (receiver.type === RECEIVER_TYPES.ONCALL && metadata.schedule) {
    content += `\n排班: ${metadata.schedule}`
  }

  return content
}

// 表格列配置
const tableColumns = [
  {
    prop: "templateInfo",
    label: "模板信息",
    slot: "templateInfo"
  },
  {
    prop: "details",
    label: "详情信息",
    minWidth: 300,
    slot: "details"
  },
  {
    prop: "channels",
    label: "通知渠道",
    minWidth: 200,
    slot: "channels"
  },
  {
    prop: "receivers",
    label: "接收者",
    minWidth: 260,
    slot: "receivers"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)"
}

// 获取操作按钮配置
const getOperateItems = (_template: StepTemplateVO) => {
  return [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 操作事件处理
const operateEvent = (template: StepTemplateVO, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(template)
      break
    case "delete":
      handleDelete(template)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 加载模板数据
const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await listStepTemplatesApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    templates.value = response.data.templates || []
    paginationData.total = response.data.total || 0
  } finally {
    loading.value = false
  }
}

// 创建模板
const handleCreate = () => {
  isEdit.value = false
  currentEditId.value = null
  formData.value = {
    name: "",
    description: "",
    channels: [],
    receivers: []
  }
  drawerVisible.value = true
}

// 编辑模板
const handleEdit = (template: StepTemplateVO) => {
  isEdit.value = true
  currentEditId.value = template.id
  formData.value = {
    name: template.name,
    description: template.description,
    channels: [...template.channels], // 深拷贝数组
    receivers: template.receivers.map((receiver) => ({
      ...receiver,
      metadata: { ...receiver.metadata } // 深拷贝对象
    }))
  }
  drawerVisible.value = true
}

// 删除模板
const handleDelete = async (template: StepTemplateVO) => {
  await ElMessageBox.confirm(`确定要删除模板 "${template.name}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  await deleteStepTemplateApi(template.id)
  await loadTemplates()
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
      await updateStepTemplateApi({
        id: currentEditId.value,
        name: formData.value.name,
        description: formData.value.description,
        channels: formData.value.channels,
        receivers: formData.value.receivers
      })
    } else {
      // 创建
      await createStepTemplateApi(formData.value)
    }

    drawerVisible.value = false
    await loadTemplates()
  } finally {
    submitLoading.value = false
  }
}

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false
  formRef.value?.resetFields()
}

// 监听分页变化
watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => {
    loadTemplates()
  }
)

// 初始化加载数据
onMounted(() => {
  loadTemplates()
})
</script>

<style lang="scss" scoped>
// 模板信息样式
.template-info-cell {
  .template-name {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }

  .template-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
  }
}

// 通知渠道样式
.channels-cell {
  .channels-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: center;
  }

  .channel-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
      background: #e0f2fe;
      border-color: #7dd3fc;
    }

    .channel-icon {
      font-size: 11px;
      color: #0284c7;
      flex-shrink: 0;
    }

    .channel-name {
      font-size: 11px;
      color: #0c4a6e;
      font-weight: 500;
      white-space: nowrap;
    }
  }

  .empty-channels {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    color: #9ca3af;
  }
}

// 接收者样式
.receivers-cell {
  .receivers-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: center;
  }

  .receiver-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    .receiver-icon {
      font-size: 11px;
      color: #16a34a;
      flex-shrink: 0;
    }

    .receiver-name {
      font-size: 11px;
      color: #166534;
      font-weight: 500;
      white-space: nowrap;
    }

    .receiver-type-tag {
      font-size: 9px;
      padding: 1px 3px;
      height: 14px;
      line-height: 12px;
      flex-shrink: 0;
    }
  }

  .empty-receivers {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    color: #9ca3af;
  }
}

// 时间样式
.time-cell {
  font-size: 14px;
  color: #1f2937;
}
</style>
