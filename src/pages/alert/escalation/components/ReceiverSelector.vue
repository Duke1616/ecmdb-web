<template>
  <div class="receiver-selector-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="filterInput"
          size="large"
          placeholder="输入名称进行搜索..."
          :prefix-icon="Search"
          class="search-input"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧：接收者选择 -->
      <div class="selector-panel">
        <div class="panel-header">
          <h4 class="panel-title">选择接收者</h4>
          <span class="selection-count">已选择 {{ selectedReceivers.length }} 个</span>
        </div>
        <div class="selector-content">
          <!-- 类型选择标签 -->
          <div class="type-tabs">
            <div
              v-for="type in receiverTypes"
              :key="type.value"
              class="type-tab"
              :class="{ active: currentReceiverType === type.value }"
              @click="switchReceiverType(type.value)"
            >
              <el-icon class="type-icon"><component :is="type.icon" /></el-icon>
              <span class="type-label">{{ type.label }}</span>
            </div>
          </div>

          <!-- 接收者列表 -->
          <div class="receiver-list-wrapper">
            <div class="receiver-list">
              <div v-for="item in filteredReceivers" :key="item.id" class="receiver-item" @click="toggleReceiver(item)">
                <div class="receiver-checkbox">
                  <el-checkbox :model-value="isReceiverSelected(item)" @change="toggleReceiver(item)" @click.stop />
                </div>
                <div class="receiver-info">
                  <div class="receiver-name">{{ item.display_name || item.name }}</div>
                  <div class="receiver-desc">
                    {{ item.description }}
                    <!-- 部门类型显示路径信息 -->
                    <span
                      v-if="currentReceiverType === RECEIVER_TYPES.DEPARTMENT && (item as any).path"
                      class="dept-path"
                    >
                      ({{ (item as any).path }})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载和空状态 -->
            <div v-if="loading" class="loading-state">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p class="loading-text">加载中...</p>
            </div>
            <div v-else-if="filteredReceivers.length === 0" class="empty-state">
              <el-empty description="暂无数据" :image-size="60" />
            </div>
          </div>

          <!-- 分页组件（部门类型不显示） -->
          <div v-if="currentReceiverType !== RECEIVER_TYPES.DEPARTMENT" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="paginationData.currentPage"
              v-model:page-size="paginationData.pageSize"
              :page-sizes="paginationData.pageSizes"
              :total="paginationData.total"
              :layout="paginationData.layout"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：已选择接收者 -->
      <div class="selection-panel">
        <div class="panel-header">
          <h4 class="panel-title">已选择接收者</h4>
          <span class="selection-count">{{ selectedReceivers.length }} 个</span>
        </div>
        <div class="selected-receiver-list-wrapper">
          <div v-if="selectedReceivers.length === 0" class="empty-state">
            <el-icon class="empty-icon"><User /></el-icon>
            <p class="empty-text">暂无选择的接收者</p>
            <p class="empty-hint">请在左侧选择需要添加的接收者</p>
          </div>
          <div v-else class="selected-receiver-list">
            <div
              v-for="receiver in selectedReceivers"
              :key="`${receiver.type}_${receiver.id}`"
              class="receiver-card selected"
            >
              <div class="receiver-info">
                <div class="receiver-type">{{ getReceiverTypeLabel(receiver.type) }}</div>
                <div class="receiver-name">{{ receiver.display_name }}</div>
              </div>
              <button class="remove-btn" @click="removeReceiverFromSelection(receiver)" title="移除">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { Search, Close, User, UserFilled, OfficeBuilding, Clock, Loading } from "@element-plus/icons-vue"
import type { ReceiverRef, ReceiverType } from "@/api/alert/escalation/types"
import { RECEIVER_TYPES } from "@/api/alert/escalation/types"
import { listUsersApi } from "@/api/user"
import { listTeamsApi } from "@/api/alert/team"
import { listDepartmentTreeApi } from "@/api/department"
import { listRotasApi } from "@/api/rota"
import type { user } from "@/api/user/types/user"
import type { Team } from "@/api/alert/team/types"
import type { department } from "@/api/department/types/department"
import type { rota } from "@/api/rota/types/rota"
import { usePagination } from "@/common/composables/usePagination"

interface Props {
  modelValue: ReceiverRef[]
  defaultReceiverType?: ReceiverType
}

interface Emits {
  (e: "update:modelValue", receivers: ReceiverRef[]): void
  (e: "confirm", receivers: ReceiverRef[]): void
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  defaultReceiverType: RECEIVER_TYPES.USER
})

const emits = defineEmits<Emits>()

// 简单的双向绑定：直接使用props.modelValue
const selectedReceivers = computed(() => props.modelValue || [])

// 响应式数据
const filterInput = ref("")
const currentReceiverType = ref(props.defaultReceiverType)

// 接收者类型配置
const receiverTypes = [
  { value: RECEIVER_TYPES.USER, label: "用户", icon: UserFilled },
  { value: RECEIVER_TYPES.TEAM, label: "团队", icon: OfficeBuilding },
  { value: RECEIVER_TYPES.DEPARTMENT, label: "部门", icon: OfficeBuilding },
  { value: RECEIVER_TYPES.ONCALL, label: "排班", icon: Clock }
]

// 接收者数据
const receiversData = ref<{
  [RECEIVER_TYPES.USER]: Array<{ id: string; name: string; display_name: string; description: string }>
  [RECEIVER_TYPES.TEAM]: Array<{ id: string; name: string; display_name: string; description: string }>
  [RECEIVER_TYPES.DEPARTMENT]: Array<{
    id: string
    name: string
    display_name: string
    description: string
    path: string
  }>
  [RECEIVER_TYPES.ONCALL]: Array<{ id: string; name: string; display_name: string; description: string }>
}>({
  [RECEIVER_TYPES.USER]: [],
  [RECEIVER_TYPES.TEAM]: [],
  [RECEIVER_TYPES.DEPARTMENT]: [],
  [RECEIVER_TYPES.ONCALL]: []
})

// 加载状态
const loading = ref(false)

// 分页配置
const initPagination = {
  currentPage: 1,
  pageSize: 20,
  layout: "prev, pager, next"
}

// 使用分页组合式函数
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(initPagination)

// 计算属性
const filteredReceivers = computed(() => {
  const receivers = receiversData.value[currentReceiverType.value as keyof typeof receiversData.value] || []
  if (!filterInput.value) return receivers

  return receivers.filter((item) => {
    const searchText = filterInput.value.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchText) ||
      item.display_name.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText) ||
      // 部门类型还搜索路径
      (item as any).path?.toLowerCase().includes(searchText)
    )
  })
})

// 加载用户数据
const loadUsers = async () => {
  try {
    const params: any = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    // 如果有搜索关键词，添加到参数中
    if (filterInput.value.trim()) {
      params.keyword = filterInput.value.trim()
    }

    const { data } = await listUsersApi(params)
    receiversData.value[RECEIVER_TYPES.USER] = data.users.map((user: user) => ({
      id: user.id.toString(),
      name: user.username,
      display_name: user.display_name,
      description: user.title || user.email || "用户"
    }))
    paginationData.total = data.total || 0
  } catch (error) {
    console.error("加载用户数据失败:", error)
  }
}

// 加载团队数据
const loadTeams = async () => {
  try {
    const params: any = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    // 如果有搜索关键词，添加到参数中
    if (filterInput.value.trim()) {
      params.keyword = filterInput.value.trim()
    }

    const { data } = await listTeamsApi(params)
    receiversData.value[RECEIVER_TYPES.TEAM] = data.teams.map((team: Team) => ({
      id: team.id.toString(),
      name: team.name,
      display_name: team.name,
      description: `负责人: ${team.owner}`
    }))
    paginationData.total = data.total || 0
  } catch (error) {
    console.error("加载团队数据失败:", error)
  }
}

// 加载部门数据
const loadDepartments = async () => {
  try {
    const { data } = await listDepartmentTreeApi()

    // 扁平化部门数据，并添加层级路径信息
    const flattenDepartments = (depts: department[], parentPath: string = ""): any[] => {
      let result: any[] = []
      depts.forEach((dept) => {
        const currentPath = parentPath ? `${parentPath} - ${dept.name}` : dept.name
        result.push({
          id: dept.id.toString(),
          name: dept.name,
          display_name: dept.name,
          description: "部门",
          path: currentPath
        })
        if (dept.children && dept.children.length > 0) {
          result = result.concat(flattenDepartments(dept.children, currentPath))
        }
      })
      return result
    }

    receiversData.value[RECEIVER_TYPES.DEPARTMENT] = flattenDepartments(data)
  } catch (error) {
    console.error("加载部门数据失败:", error)
  }
}

// 加载排班数据
const loadRotas = async () => {
  try {
    const params: any = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    // 如果有搜索关键词，添加到参数中
    if (filterInput.value.trim()) {
      params.keyword = filterInput.value.trim()
    }

    const { data } = await listRotasApi(params)
    receiversData.value[RECEIVER_TYPES.ONCALL] = data.rotas.map((rota: rota) => ({
      id: rota.id.toString(),
      name: rota.name,
      display_name: rota.name,
      description: rota.desc || "排班"
    }))
    paginationData.total = data.total || 0
  } catch (error) {
    console.error("加载排班数据失败:", error)
  }
}

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

// 切换接收者类型
const switchReceiverType = async (type: ReceiverType) => {
  currentReceiverType.value = type
  filterInput.value = ""

  // 按需加载数据
  await loadDataByType(type)
}

// 根据类型加载数据
const loadDataByType = async (type: string) => {
  // 部门类型不需要分页，直接加载
  if (type === RECEIVER_TYPES.DEPARTMENT) {
    const currentData = receiversData.value[type as keyof typeof receiversData.value]
    if (currentData && currentData.length > 0) {
      return
    }
    loading.value = true
    try {
      await loadDepartments()
    } finally {
      loading.value = false
    }
    return
  }

  // 其他类型需要分页，总是重新加载
  loading.value = true
  try {
    switch (type) {
      case RECEIVER_TYPES.USER:
        await loadUsers()
        break
      case RECEIVER_TYPES.TEAM:
        await loadTeams()
        break
      case RECEIVER_TYPES.ONCALL:
        await loadRotas()
        break
    }
  } finally {
    loading.value = false
  }
}

// 检查接收者是否已选择
const isReceiverSelected = (item: any) => {
  return selectedReceivers.value.some(
    (receiver) => receiver.id === item.id.toString() && receiver.type === currentReceiverType.value
  )
}

// 切换接收者选择
const toggleReceiver = (item: any) => {
  const currentReceivers = [...selectedReceivers.value]
  const existingIndex = currentReceivers.findIndex(
    (receiver) => receiver.id === item.id.toString() && receiver.type === currentReceiverType.value
  )

  if (existingIndex > -1) {
    // 已选择，移除
    currentReceivers.splice(existingIndex, 1)
  } else {
    // 未选择，添加
    currentReceivers.push({
      id: item.id.toString(),
      type: currentReceiverType.value,
      display_name: item.display_name || item.name,
      metadata: {}
    })
  }

  // 直接触发emit更新父组件
  emits("update:modelValue", currentReceivers)
}

// 从选择列表中移除接收者
const removeReceiverFromSelection = (receiver: ReceiverRef) => {
  const currentReceivers = [...selectedReceivers.value]
  const index = currentReceivers.findIndex((r) => r.id === receiver.id && r.type === receiver.type)
  if (index > -1) {
    currentReceivers.splice(index, 1)
    // 直接触发emit更新父组件
    emits("update:modelValue", currentReceivers)
  }
}

// 确认选择
const handleConfirm = () => {
  emits("confirm", selectedReceivers.value)
}

// 取消选择
const handleCancel = () => {
  emits("cancel")
}

// 搜索防抖
let searchTimer: NodeJS.Timeout | null = null
watch(
  () => filterInput.value,
  () => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
      // 搜索时重置到第一页
      paginationData.currentPage = 1
      loadDataByType(currentReceiverType.value)
    }, 500) // 500ms 防抖
  }
)

// 监听分页变化，重新加载数据
watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  // 部门类型不需要分页，跳过
  if (currentReceiverType.value === RECEIVER_TYPES.DEPARTMENT) {
    return
  }
  loadDataByType(currentReceiverType.value)
})

// 组件挂载时加载默认类型数据
onMounted(() => {
  loadDataByType(currentReceiverType.value)
})

// 暴露方法给父组件
defineExpose({
  handleConfirm,
  handleCancel,
  getSelectedReceivers: () => selectedReceivers.value
})
</script>

<style lang="scss" scoped>
// 接收者选择器样式
.receiver-selector-container {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
  height: 60vh;
}

.search-section {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
  flex-shrink: 0;

  .search-container {
    display: flex;
    align-items: center;

    .search-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0 12px;
        height: 40px;
        transition: all 0.2s ease;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
          background: #ffffff;
        }

        &.is-focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        color: #111827;
        font-weight: 400;

        &::placeholder {
          color: #6b7280;
          font-weight: 400;
        }
      }

      :deep(.el-input__prefix) {
        color: #6b7280;
        font-size: 16px;
      }
    }
  }
}

.content-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.selector-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .selection-count {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  }

  .selector-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.type-tabs {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;
  flex-shrink: 0;

  .type-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f9fafb;
    border: 1px solid #e5e7eb;

    &:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    &.active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .type-icon {
      font-size: 14px;
    }

    .type-label {
      font-size: 13px;
      font-weight: 500;
    }
  }
}

.receiver-list-wrapper {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow-y: auto;

  .receiver-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .receiver-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #fafbfc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .receiver-checkbox {
      flex-shrink: 0;
    }

    .receiver-info {
      flex: 1;

      .receiver-name {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        margin-bottom: 2px;
      }

      .receiver-desc {
        font-size: 12px;
        color: #6b7280;
      }
    }
  }
}

.selection-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    .panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .selection-count {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  }

  .selected-receiver-list-wrapper {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .selected-receiver-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}

.receiver-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #f3f4f6;
  }

  &.selected {
    background: #eff6ff;
  }

  .receiver-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-right: 8px;
    text-align: left;

    .receiver-type {
      font-size: 11px;
      font-weight: 500;
      color: #3b82f6;
    }

    .receiver-name {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
      text-align: left;
    }
  }

  .remove-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
      transform: scale(1.1);
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

// 部门路径样式
.dept-path {
  color: #6b7280;
  font-size: 11px;
  margin-left: 4px;
}

// 分页样式
.pagination-wrapper {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    .el-pagination__total {
      color: #64748b;
      font-size: 12px;
    }

    .el-pagination__sizes {
      .el-select {
        .el-input__wrapper {
          height: 28px;
          font-size: 12px;
        }
      }
    }

    .el-pager li {
      min-width: 28px;
      height: 28px;
      line-height: 28px;
      font-size: 12px;
    }

    .btn-prev,
    .btn-next {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 40px 20px;

  .loading-icon {
    font-size: 32px;
    color: #3b82f6;
    margin-bottom: 12px;
    animation: rotate 1s linear infinite;
  }

  .loading-text {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;

  .empty-icon {
    font-size: 36px;
    color: #cbd5e1;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    margin: 0 0 6px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }
}
</style>
