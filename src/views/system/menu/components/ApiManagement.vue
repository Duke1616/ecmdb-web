<template>
  <div class="form-section">
    <div class="section-title">
      <div class="section-left">
        <el-icon><Connection /></el-icon>
        <span>接口设置</span>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="openAddApiDialog" :icon="Plus" class="add-api-btn">
          添加接口
        </el-button>
        <el-button
          v-if="selectedEndpoints.length > 0"
          type="danger"
          size="small"
          @click="handleBatchDelete"
          :icon="Delete"
          class="batch-delete-btn"
        >
          批量删除 ({{ selectedEndpoints.length }})
        </el-button>
      </div>
    </div>

    <div class="api-table-container">
      <DataTable
        :data="apiEndpoints"
        :columns="apiTableColumns"
        :actions="apiTableActions"
        :show-pagination="false"
        :show-selection="true"
        @action="(action, row, index) => removeEndpoint(index)"
        @selection-change="handleSelectionChange"
      >
        <!-- 接口方法插槽 -->
        <template #method="{ row }">
          <el-tag :type="getMethodTagType(row.method)" size="small">
            {{ row.method || "N/A" }}
          </el-tag>
        </template>
      </DataTable>
    </div>

    <!-- 添加接口对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="添加接口"
      width="50%"
      :confirm-loading="dialogLoading"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogClose"
      @close="handleDialogClose"
    >
      <Api ref="apiRef" />
    </FormDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Connection, Plus, Delete } from "@element-plus/icons-vue"
import { endpoint as menuEndpoint } from "@/api/menu/types/menu"
import { endpoint as apiEndpoint } from "@/api/endpoint/types/endpoint"
import { changeMenuEndpoints } from "@/api/menu/utils"
import DataTable from "@/common/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import Api from "../api.vue"

interface Props {
  menuId?: number
  endpoints: menuEndpoint[]
  isEditMode?: boolean
}

interface Emits {
  (e: "update:endpoints", endpoints: menuEndpoint[]): void
  (e: "refresh"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 接口管理
const apiEndpoints = ref<menuEndpoint[]>([])
const selectedEndpoints = ref<menuEndpoint[]>([])
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const apiRef = ref()

// API 表格配置
const apiTableColumns = [
  { prop: "path", label: "接口路径", minWidth: 200 },
  { prop: "method", label: "接口方法", width: 120, slot: "method" },
  { prop: "resource", label: "资源标识", minWidth: 150 },
  { prop: "desc", label: "接口介绍", minWidth: 150 }
]

const apiTableActions = [
  {
    key: "delete",
    type: "danger" as const,
    size: "small" as const,
    text: true,
    label: "删除",
    icon: "Delete"
  }
]

// 初始化接口数据
const initEndpoints = (endpoints: menuEndpoint[] = []) => {
  apiEndpoints.value = [...endpoints]
  selectedEndpoints.value = []
}

// 监听 props 变化
watch(
  () => props.endpoints,
  (newEndpoints) => {
    initEndpoints(newEndpoints)
  },
  { immediate: true }
)

// 手动同步到父组件的方法
const syncToParent = () => {
  nextTick(() => {
    emit("update:endpoints", apiEndpoints.value)
  })
}

// 获取方法标签类型
const getMethodTagType = (method: string) => {
  const types: Record<string, "success" | "warning" | "danger" | "info"> = {
    GET: "success",
    POST: "warning",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info"
  }
  return types[method?.toUpperCase()] || "info"
}

// 打开添加接口对话框
const openAddApiDialog = () => {
  dialogVisible.value = true

  // 等待对话框打开后，设置已存在接口的勾选状态
  nextTick(() => {
    if (apiRef.value && apiEndpoints.value.length > 0) {
      // 将已存在的接口转换为 API 接口格式
      const existingEndpoints = apiEndpoints.value.map((endpoint) => ({
        path: endpoint.path,
        method: endpoint.method,
        resource: endpoint.resource,
        desc: endpoint.desc || endpoint.name
      }))

      // 设置选择状态
      apiRef.value.setSelection(existingEndpoints)
    }
  })
}

// 处理对话框确认
const handleDialogConfirm = async () => {
  const selectedEndpoints = apiRef.value?.getSelectionTableData() || []

  // 设置 loading 状态
  dialogLoading.value = true

  try {
    await addEndpoints(selectedEndpoints)
    apiRef.value?.clearSelection()
    dialogVisible.value = false
  } finally {
    // 无论成功还是失败，都要关闭 loading
    dialogLoading.value = false
  }
}

// 处理对话框关闭
const handleDialogClose = () => {
  // 对话框关闭时清空选择状态
  apiRef.value?.clearSelection()
  dialogVisible.value = false
}

// 添加接口
const addEndpoints = async (newEndpoints: apiEndpoint[]) => {
  if (!newEndpoints || newEndpoints.length === 0) {
    ElMessage.warning("请选择要添加的接口")
    return
  }

  const convertedEndpoints = newEndpoints.map(convertApiEndpointToMenuEndpoint)
  const uniqueEndpoints = convertedEndpoints.filter((endpoint) => {
    return !apiEndpoints.value.some((existing) => {
      return endpoint.path === existing.path && endpoint.name === existing.name
    })
  })

  if (uniqueEndpoints.length === 0) {
    ElMessage.warning("所选接口已存在，无需重复添加")
    return
  }

  // 如果是编辑模式且有菜单ID，先调用API
  if (props.isEditMode && props.menuId) {
    try {
      await changeMenuEndpoints.add(props.menuId, uniqueEndpoints)

      // API调用成功后才更新本地数据
      apiEndpoints.value.push(...uniqueEndpoints)
      ElMessage.success("端点添加成功")

      // 同步到父组件
      syncToParent()

      // 触发回调，通知父组件刷新数据
      emit("refresh")
    } catch (error) {
      console.error("添加端点失败:", error)
      ElMessage.error("添加端点失败")
    }
  } else {
    // 新增模式，直接更新本地数据
    apiEndpoints.value.push(...uniqueEndpoints)
    ElMessage.success("端点添加成功")

    // 同步到父组件
    syncToParent()
  }
}

// 删除接口
const removeEndpoint = async (index: number) => {
  const endpointToRemove = apiEndpoints.value[index]
  if (!endpointToRemove) return

  // 如果是编辑模式且有菜单ID，先调用API
  if (props.isEditMode && props.menuId) {
    try {
      // 确保被删除的端点包含完整的字段
      const endpointToDelete = {
        name: endpointToRemove.name || "",
        path: endpointToRemove.path || "",
        method: endpointToRemove.method || "",
        resource: endpointToRemove.resource || "",
        desc: endpointToRemove.desc || ""
      }

      // 调用 change_endpoints 接口，传递被删除的端点
      await changeMenuEndpoints.replace(props.menuId, [endpointToDelete])

      // API调用成功后显示成功消息
      ElMessage.success("端点删除成功")

      // 触发回调，通知父组件刷新数据
      emit("refresh")

      // 注意：不在这里更新本地数据，等待父组件刷新后通过 props 更新
    } catch (error) {
      console.error("删除端点失败:", error)
      ElMessage.error("删除端点失败")
    }
  } else {
    // 新增模式，直接更新本地数据
    apiEndpoints.value.splice(index, 1)
    ElMessage.success("端点删除成功")

    // 同步到父组件
    syncToParent()
  }
}

// 处理选择变化
const handleSelectionChange = (selection: menuEndpoint[]) => {
  selectedEndpoints.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedEndpoints.value.length === 0) {
    ElMessage.warning("请选择要删除的端点")
    return
  }

  try {
    // 确认删除
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedEndpoints.value.length} 个端点吗？`, "批量删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 构建要删除的端点列表
    const endpointsToDelete = selectedEndpoints.value.map((endpoint) => ({
      name: endpoint.name || "",
      path: endpoint.path || "",
      method: endpoint.method || "",
      resource: endpoint.resource || "",
      desc: endpoint.desc || ""
    }))

    // 如果是编辑模式且有菜单ID，先调用API
    if (props.isEditMode && props.menuId) {
      try {
        // 调用 change_endpoints 接口，传递要删除的端点
        await changeMenuEndpoints.replace(props.menuId, endpointsToDelete)

        // API调用成功后显示成功消息
        ElMessage.success(`成功删除 ${endpointsToDelete.length} 个端点`)

        // 清空选择
        selectedEndpoints.value = []

        // 触发回调，通知父组件刷新数据
        emit("refresh")

        // 注意：不在这里更新本地数据，等待父组件刷新后通过 props 更新
      } catch (error) {
        console.error("批量删除端点失败:", error)
        ElMessage.error("批量删除端点失败")
      }
    } else {
      // 新增模式，直接更新本地数据
      selectedEndpoints.value.forEach((selected) => {
        const index = apiEndpoints.value.findIndex(
          (ep) => ep.path === selected.path && ep.resource === selected.resource
        )
        if (index !== -1) {
          apiEndpoints.value.splice(index, 1)
        }
      })

      // 清空选择
      selectedEndpoints.value = []
      ElMessage.success(`成功删除 ${endpointsToDelete.length} 个端点`)

      // 同步到父组件
      syncToParent()
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除端点失败:", error)
    }
  }
}

// 转换 API 接口格式
const convertApiEndpointToMenuEndpoint = (apiEndpoint: apiEndpoint): menuEndpoint => {
  return {
    name: apiEndpoint.desc || "", // 使用 desc 作为 name
    path: apiEndpoint.path || "",
    method: apiEndpoint.method || "",
    resource: apiEndpoint.resource || "",
    desc: apiEndpoint.desc || ""
  }
}

// 暴露方法给父组件
defineExpose({
  initEndpoints
})
</script>

<style lang="scss" scoped>
.form-section {
  margin-bottom: 24px;

  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border-left: 3px solid #3b82f6;

    .section-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .el-icon {
        font-size: 14px;
        color: #3b82f6;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
    }

    .section-actions {
      display: flex;
      gap: 8px;
      align-items: center;

      .add-api-btn,
      .batch-delete-btn {
        height: 28px;
        font-size: 12px;
        padding: 6px 8px;
        border-radius: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .batch-delete-btn {
        background: #ef4444;
        border-color: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
          border-color: #dc2626;
        }
      }
    }
  }

  .api-table-container {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
}
</style>
