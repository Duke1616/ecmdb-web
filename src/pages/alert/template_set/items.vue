<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`模板集合条目 - ${templateSet?.name || ''}`"
      subtitle="管理模板集合中的条目"
      :show-back-button="true"
      @refresh="loadTemplateSet"
      @back="handleBack"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleAddItem"> 添加条目 </el-button>
        <el-button type="success" :icon="Plus" class="action-btn" @click="handleBatchAddItem"> 批量添加 </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          class="action-btn"
          @click="handleDeleteAll"
          :disabled="selectedItems.length === 0"
        >
          批量删除
        </el-button>
        <el-button
          type="warning"
          :icon="Delete"
          class="action-btn"
          @click="handleClearAll"
          :disabled="items.length === 0"
        >
          清空集合
        </el-button>
      </template>
    </ManagerHeader>

    <!-- 卡片列表 -->
    <div class="items-container" v-loading="loading">
      <!-- 条目卡片 -->
      <div class="items-grid" v-if="items.length > 0">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
          :class="{ selected: selectedItems.some((selected) => selected.id === item.id) }"
          @click="handleCardClick(item)"
        >
          <div class="card-header">
            <div class="channel-info">
              <el-tag :type="getChannelType(item.channel)" size="default" class="channel-tag">
                {{ getChannelLabel(item.channel) }}
              </el-tag>
            </div>
            <div class="card-actions">
              <el-checkbox
                :model-value="selectedItems.some((selected) => selected.id === item.id)"
                @change="toggleItemSelection(item)"
                @click.stop
              />
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                circle
                @click.stop="handleDeleteItem(item)"
                class="delete-btn"
              />
            </div>
          </div>

          <div class="card-content">
            <div class="template-info">
              <div class="template-name">{{ item.template_name }}</div>
              <div class="template-id">模板ID: {{ item.template_id }}</div>
            </div>
            <div class="time-info">
              <div class="time-label">创建时间</div>
              <div class="time-value">{{ formatItemTime(item.ctime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无条目">
          <template #image>
            <el-icon size="60" color="#cbd5e1">
              <DocumentAdd />
            </el-icon>
          </template>
          <el-button type="primary" :icon="Plus" @click="handleAddItem"> 添加第一个条目 </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 添加条目对话框 -->
    <FormDialog
      v-model="addDialogVisible"
      title="添加条目"
      subtitle="选择渠道类型和对应的模板"
      width="600px"
      :confirm-loading="addSubmitLoading"
      confirm-text="确定"
      header-icon="Plus"
      @confirm="handleAddSubmit"
      @cancel="handleAddDialogClose"
      @closed="handleAddDialogClose"
    >
      <AddItemForm
        ref="addFormRef"
        v-model="addFormData"
        :available-templates="availableTemplates"
        :templates-loading="templatesLoading"
        :existing-channels="existingChannels"
        @channel-change="handleChannelChange"
      />
    </FormDialog>

    <!-- 批量添加对话框 -->
    <FormDialog
      v-model="batchAddDialogVisible"
      title="批量添加条目"
      subtitle="可以同时添加多个渠道的模板条目"
      width="800px"
      :confirm-loading="batchAddSubmitLoading"
      confirm-text="确定"
      header-icon="Plus"
      @confirm="handleBatchAddSubmit"
      @cancel="handleBatchAddDialogClose"
      @closed="handleBatchAddDialogClose"
    >
      <BatchAddForm
        ref="batchAddFormRef"
        v-model="batchItems"
        v-model:batch-templates="batchTemplates"
        :set-id="Number(route.params.id)"
        :existing-channels="existingChannels"
      />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, Delete, DocumentAdd } from "@element-plus/icons-vue"
import { addItemApi, addItemsApi, deleteItemsApi, deleteAllItemsApi, getTemplateSetApi } from "@/api/alert/template_set"
import { listTemplatesByChannelApi } from "@/api/alert/template"
import type { TemplateSetItem, AddItemReq } from "@/api/alert/template_set/types"
import type { ChannelTemplate } from "@/api/alert/template/types"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { getChannelLabel, getChannelType } from "../template/config/channels"
import AddItemForm from "./components/AddItemForm.vue"
import BatchAddForm from "./components/BatchAddForm.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const templateSet = ref<any>(null)
const items = ref<TemplateSetItem[]>([])
const selectedItems = ref<TemplateSetItem[]>([])
const loading = ref(false)
const templatesLoading = ref(false)
const availableTemplates = ref<ChannelTemplate[]>([])

// 对话框相关
const addDialogVisible = ref(false)
const batchAddDialogVisible = ref(false)
const addSubmitLoading = ref(false)
const batchAddSubmitLoading = ref(false)

// 添加表单
const addFormRef = ref()
const addFormData = ref<AddItemReq>({
  set_id: 0,
  channel: "",
  template_id: undefined
})

// 批量添加
const batchItems = ref<AddItemReq[]>([])
const batchTemplates = ref<Record<number, ChannelTemplate[]>>({}) // 存储每个批量项的模板列表

// 已存在的渠道类型
const existingChannels = computed(() => {
  return items.value.map((item) => item.channel)
})

// 格式化条目时间戳（秒级时间戳转换为毫秒）
const formatItemTime = (timestamp: number) => {
  if (!timestamp) return ""

  // 将秒级时间戳转换为毫秒级
  const date = new Date(timestamp * 1000)

  // 使用 Intl.DateTimeFormat 格式化日期
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  // 格式化后的结果
  const parts = formatter.formatToParts(date)

  // 提取对应的部分并拼接成需要的格式
  const year = parts.find((part) => part.type === "year")?.value || "0000"
  const month = parts.find((part) => part.type === "month")?.value || "00"
  const day = parts.find((part) => part.type === "day")?.value || "00"
  const hour = parts.find((part) => part.type === "hour")?.value || "00"
  const minute = parts.find((part) => part.type === "minute")?.value || "00"

  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

// 加载模板集合信息和条目数据
const loadTemplateSet = async () => {
  const setId = Number(route.params.id)
  if (!setId) return

  loading.value = true
  try {
    const response = await getTemplateSetApi({ id: setId })
    templateSet.value = response.data.template_set
    items.value = response.data.template_set.items || []
  } finally {
    loading.value = false
  }
}

// 加载可用模板 - 按渠道获取
const loadTemplates = async (channel?: string) => {
  if (!channel) {
    availableTemplates.value = []
    return
  }

  templatesLoading.value = true
  try {
    const response = await listTemplatesByChannelApi({
      channel,
      offset: 0,
      limit: 1000
    })
    availableTemplates.value = response.data.templates || []
  } finally {
    templatesLoading.value = false
  }
}

// 切换条目选择状态
const toggleItemSelection = (item: TemplateSetItem) => {
  const index = selectedItems.value.findIndex((selected) => selected.id === item.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

// 处理卡片点击事件 - 跳转到模板编辑页面
const handleCardClick = (item: TemplateSetItem) => {
  router.push(`/alert/notify/template/edit/${item.template_id}`)
}

// 返回操作
const handleBack = () => {
  router.go(-1)
}

// 添加条目
const handleAddItem = () => {
  const setId = Number(route.params.id)
  addFormData.value = {
    set_id: setId,
    channel: "",
    template_id: undefined
  }
  availableTemplates.value = [] // 清空模板列表
  addDialogVisible.value = true
}

// 批量添加条目
const handleBatchAddItem = () => {
  batchItems.value = []
  batchTemplates.value = {}
  batchAddDialogVisible.value = true
}

// 渠道变化处理
const handleChannelChange = (channel: string) => {
  addFormData.value.template_id = undefined // 重置模板选择
  loadTemplates(channel) // 按渠道加载模板
}

// 批量删除
const handleDeleteAll = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning("请选择要删除的条目")
    return
  }

  await ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 个条目吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  const setId = Number(route.params.id)
  const itemIds = selectedItems.value.map((item) => item.id)

  await deleteItemsApi({
    set_id: setId,
    item_ids: itemIds
  })

  loadTemplateSet()
}

// 清空集合所有条目
const handleClearAll = async () => {
  if (items.value.length === 0) {
    ElMessage.warning("集合中暂无条目")
    return
  }

  await ElMessageBox.confirm(
    `确定要清空集合 "${templateSet.value?.name || ""}" 中的所有 ${items.value.length} 个条目吗？此操作不可恢复！`,
    "确认清空",
    {
      confirmButtonText: "确定清空",
      cancelButtonText: "取消",
      type: "warning"
    }
  )

  const setId = Number(route.params.id)

  await deleteAllItemsApi({
    set_id: setId
  })

  loadTemplateSet()
}

// 删除单个条目
const handleDeleteItem = async (item: TemplateSetItem) => {
  await ElMessageBox.confirm(`确定要删除这个条目吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })

  const setId = Number(route.params.id)
  await deleteItemsApi({
    set_id: setId,
    item_ids: [item.id]
  })

  loadTemplateSet()
}

// 提交添加
const handleAddSubmit = async () => {
  if (!addFormRef.value) return

  await addFormRef.value.validate()
  addSubmitLoading.value = true

  try {
    // 确保 template_id 是有效的数字
    if (addFormData.value.template_id === undefined) {
      ElMessage.error("请选择模板")
      return
    }

    await addItemApi({
      ...addFormData.value,
      template_id: addFormData.value.template_id
    })
    addDialogVisible.value = false
    loadTemplateSet()
  } finally {
    addSubmitLoading.value = false
  }
}

// 关闭添加对话框
const handleAddDialogClose = () => {
  addDialogVisible.value = false
  addFormRef.value?.resetFields()
}

// 提交批量添加
const handleBatchAddSubmit = async () => {
  if (batchItems.value.length === 0) {
    ElMessage.warning("请至少添加一个条目")
    return
  }

  // 验证所有条目都有有效的模板ID
  const invalidItems = batchItems.value.filter((item) => !item.channel || item.template_id === undefined)

  if (invalidItems.length > 0) {
    ElMessage.error("请确保所有条目都选择了渠道和模板")
    return
  }

  batchAddSubmitLoading.value = true

  try {
    const setId = Number(route.params.id)
    await addItemsApi({
      set_id: setId,
      items: batchItems.value.map((item) => ({
        ...item,
        template_id: item.template_id!
      }))
    })

    batchAddDialogVisible.value = false
    loadTemplateSet()
  } finally {
    batchAddSubmitLoading.value = false
  }
}

// 关闭批量添加对话框
const handleBatchAddDialogClose = () => {
  batchAddDialogVisible.value = false
  batchItems.value = []
  batchTemplates.value = {}
}

// 初始化
onMounted(() => {
  loadTemplateSet()
})
</script>

<style lang="scss" scoped>
// 卡片容器样式
.items-container {
  min-height: 400px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
  cursor: pointer;

  &.selected {
    border-color: #3b82f6;
    background: #f0f9ff;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;

    .channel-info {
      .channel-tag {
        font-weight: 500;
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .delete-btn {
        opacity: 0.7;
        transition: opacity 0.2s ease;

        &:hover {
          opacity: 1;
        }
      }
    }
  }

  .card-content {
    padding: 16px;

    .template-info {
      margin-bottom: 12px;

      .template-name {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .template-id {
        font-size: 13px;
        color: #6b7280;
      }
    }

    .time-info {
      .time-label {
        font-size: 12px;
        color: #9ca3af;
        margin-bottom: 2px;
      }

      .time-value {
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

// 模板选项样式
.template-option {
  .template-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .template-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
}
</style>
