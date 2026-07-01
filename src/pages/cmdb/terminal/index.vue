<template>
  <div class="term-container">
    <!-- 连接选择对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="title || '选择连接方式'"
      :subtitle="`请选择连接到资源 ${resourceId} 的方式`"
      :width="600"
      :show-close="false"
      :close-on-click-modal="false"
      :confirm-text="loading ? '连接中...' : '连接'"
      :confirm-loading="loading"
      :confirm-disabled="!selectedOption || loading"
      :footer-info-text="selectedOption ? `已选择: ${getCurrentOptionLabel()}` : '请选择一种连接方式'"
      header-icon="Connection"
      @cancel="handleCancel"
      @confirm="connect"
    >
      <div class="connection-options">
        <div
          v-for="option in connectionOptions"
          :key="option.value"
          class="connection-option"
          :class="{
            selected: selectedOption === option.value,
            disabled: option.disabled
          }"
          @click="selectOption(option)"
        >
          <div class="option-icon">
            <el-icon :size="24">
              <component :is="option.icon" />
            </el-icon>
          </div>
          <div class="option-content">
            <div class="option-title">{{ option.label }}</div>
            <div class="option-description">{{ option.description }}</div>
          </div>
          <div v-if="option.disabled" class="option-badge">
            <el-tag type="warning" size="small">暂不可用</el-tag>
          </div>
        </div>
      </div>
    </FormDialog>

    <!-- 连接状态提示 -->
    <div v-if="isConnected" class="connection-status">
      <div class="status-chip">
        <div class="status-chip__dot" />
        <span>已连接到 {{ getCurrentOptionLabel() }}</span>
      </div>
      <div class="status-meta">资源 ID {{ resourceId }}</div>
      <el-button link type="danger" @click="disconnect" class="disconnect-btn">断开连接</el-button>
    </div>

    <div class="terminal-panel">
      <div v-if="!showTerminalView" class="terminal-empty-state">
        <el-empty :description="hasResource ? '当前未建立连接' : '请先从左侧选择主机'">
          <el-button v-if="hasResource" type="primary" @click="reopenDialog">选择连接方式</el-button>
        </el-empty>
      </div>

      <!-- 终端组件容器 -->
      <div v-else class="terminal-wrapper">
        <finder v-if="selectedOption === 'Web Sftp'" :key="finderViewKey" :resource_id="resourceId" :prefix="prefix" />
        <xterm
          v-else-if="selectedOption === 'Web Shell'"
          :key="xtermViewKey"
          :resource_id="resourceId"
          :prefix="prefix"
        />
        <guacd v-else-if="selectedOption === 'RDP'" :key="guacdViewKey" :resource_id="resourceId" :prefix="prefix" />
        <!-- VNC 组件暂未实现 -->
        <div v-else-if="selectedOption === 'VNC'" class="vnc-placeholder">
          <el-empty description="VNC 功能暂未实现" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { connectApi } from "@/api/cmdb/terminal"
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router"
import { ElMessage } from "element-plus"

// 组件导入
import { FormDialog } from "@/common/components/Dialogs"
import guacd from "./guacd.vue"
import xterm from "./xterm.vue"
import finder from "./file-system.vue"
// import vnc from "./vnc.vue" // VNC 组件暂未实现

// 类型定义
import type { PrefixConfig } from "./utils/prefix-config"
import { getPrefixConfig } from "./utils/prefix-config"
export type { PrefixConfig }

interface ConnectionOption {
  value: string
  label: string
  description: string
  icon: string
  disabled?: boolean
}

// 路由参数
const route = useRoute()
const router = useRouter()
const resourceId = computed(() => route.query.resource_id as string)
const title = computed(() => route.query.title as string)
const connectionType = computed(() => route.query.connection_type as string)
const autoConnect = computed(() => route.query.auto_connect === "1")
const hasResource = computed(() => Boolean(resourceId.value))
const sessionVersion = ref(0)
const showTerminalView = computed(
  () => hasResource.value && isConnected.value && Boolean(selectedOption.value) && Boolean(prefix.value?.wsServer)
)
const terminalViewKey = computed(() => `${sessionVersion.value}:${selectedOption.value}:${resourceId.value || "empty"}`)
const finderViewKey = computed(() => `finder:${terminalViewKey.value}`)
const xtermViewKey = computed(() => `xterm:${terminalViewKey.value}`)
const guacdViewKey = computed(() => `guacd:${terminalViewKey.value}`)

// 状态管理
const dialogVisible = ref<boolean>(true)
const isConnected = ref<boolean>(false)
const loading = ref<boolean>(false)
const selectedOption = ref<string>("")
const prefix = ref<PrefixConfig>()

// 连接选项配置
const connectionOptions: ConnectionOption[] = [
  {
    value: "Web Shell",
    label: "Web Shell",
    description: "基于 Web 的终端连接",
    icon: "Stamp"
  },
  {
    value: "Web Sftp",
    label: "文件管理器",
    description: "SFTP 文件传输和管理",
    icon: "FolderOpened"
  },
  {
    value: "RDP",
    label: "远程桌面",
    description: "Windows 远程桌面连接",
    icon: "Monitor"
  },
  {
    value: "VNC",
    label: "VNC 连接",
    description: "VNC 远程桌面连接",
    icon: "VideoCamera",
    disabled: true // 暂时禁用
  }
]

// 计算属性
const getCurrentOptionLabel = () => {
  const option = connectionOptions.find((opt) => opt.value === selectedOption.value)
  return option?.label || selectedOption.value
}

// 方法
const selectOption = (option: ConnectionOption) => {
  if (option.disabled) {
    ElMessage.warning(`${option.label} 功能暂不可用`)
    return
  }
  selectedOption.value = option.value
}

const handleCancel = () => {
  dialogVisible.value = false
}

const reopenDialog = () => {
  dialogVisible.value = true
}

const connect = async () => {
  if (!selectedOption.value) {
    ElMessage.warning("请选择连接方式")
    return
  }

  if (!resourceId.value) {
    ElMessage.error("缺少资源ID参数")
    return
  }

  loading.value = true

  try {
    await connectApi({
      resource_id: Number(resourceId.value),
      type: selectedOption.value
    })

    prefix.value = getPrefixConfig()
    sessionVersion.value += 1
    isConnected.value = true
    dialogVisible.value = false

    // 更新 URL，保存连接状态
    const nextQuery: LocationQueryRaw = {
      ...route.query,
      connection_type: selectedOption.value
    }
    delete nextQuery.auto_connect

    router.replace({
      query: nextQuery
    })

    ElMessage.success(`成功连接到 ${getCurrentOptionLabel()}`)
  } catch (error: unknown) {
    console.error("连接失败:", error)
  } finally {
    loading.value = false
  }
}

const disconnect = () => {
  isConnected.value = false
  selectedOption.value = ""
  prefix.value = undefined
  dialogVisible.value = true

  // 从 URL 中移除连接类型参数
  const newQuery = { ...route.query }
  delete newQuery.connection_type
  router.replace({
    query: newQuery
  })

  ElMessage.info("已断开连接")
}

const resetConnectionState = () => {
  isConnected.value = false
  selectedOption.value = ""
  prefix.value = undefined
  dialogVisible.value = true
}

// 恢复连接状态（不重新建立连接，只是恢复 UI 状态）
const restoreConnection = () => {
  if (connectionType.value && resourceId.value) {
    // 验证连接类型是否有效
    const option = connectionOptions.find((opt) => opt.value === connectionType.value && !opt.disabled)
    if (option) {
      const shouldRefreshSession =
        !isConnected.value || selectedOption.value !== connectionType.value || !prefix.value?.wsServer

      selectedOption.value = connectionType.value
      prefix.value = getPrefixConfig()
      if (shouldRefreshSession) {
        sessionVersion.value += 1
      }
      isConnected.value = true
      dialogVisible.value = false
      // 不显示成功消息，因为这是恢复状态，不是新连接
      return true
    } else {
      // 无效的连接类型，从 URL 中移除
      const newQuery = { ...route.query }
      delete newQuery.connection_type
      router.replace({ query: newQuery })
      return false
    }
  }
  return false
}

// 页面离开前确认
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // 只有在已连接状态下才提示
  if (isConnected.value) {
    // 现代浏览器需要设置 returnValue 才能显示确认对话框
    // 注意：必须同时设置 preventDefault 和 returnValue
    event.preventDefault()
    // 设置一个非空字符串，虽然浏览器会忽略自定义消息，但必须设置
    event.returnValue = "您确定要离开吗？连接可能会断开。"
    return event.returnValue
  }
}

// 动态管理 beforeunload 事件监听器
watch(
  () => isConnected.value,
  (connected) => {
    if (connected) {
      // 连接时添加事件监听
      window.addEventListener("beforeunload", handleBeforeUnload)
    } else {
      // 断开时移除事件监听
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  },
  { immediate: true }
)

watch(
  () => resourceId.value,
  (next, prev) => {
    if (!next || !prev || next === prev) return

    resetConnectionState()
  }
)

watch(
  () => connectionType.value,
  (value) => {
    if (!resourceId.value) return

    if (value) {
      restoreConnection()
      return
    }

    resetConnectionState()
  }
)

// 生命周期
onMounted(async () => {
  // 检查必要参数
  if (!resourceId.value) {
    dialogVisible.value = false
    return
  }

  // 如果 URL 中有连接类型，恢复连接状态（不重新建立连接）
  // 这样刷新页面时，只是恢复 UI 显示，不会重新调用 connectApi
  // 后端的 WebSocket 连接会由子组件（xterm/guacd/finder）自己管理
  if (connectionType.value && autoConnect.value) {
    const option = connectionOptions.find((opt) => opt.value === connectionType.value && !opt.disabled)
    if (option) {
      selectedOption.value = option.value
      await connect()
      return
    }
  }

  if (connectionType.value) {
    restoreConnection()
  } else {
    // 默认选择第一个可用选项
    const firstAvailable = connectionOptions.find((opt) => !opt.disabled)
    if (firstAvailable) {
      selectedOption.value = firstAvailable.value
    }
  }
})

onUnmounted(() => {
  // 移除页面离开事件监听（确保清理）
  window.removeEventListener("beforeunload", handleBeforeUnload)
})
</script>

<style scoped lang="scss">
.term-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 12px;
  background: transparent;
}

// 连接选项网格布局
.connection-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

// 连接选项卡片样式
.connection-option {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dbe3ee;
  background: white;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #409eff;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    border-color: #bfd7f5;
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);

    &::before {
      transform: scaleX(1);
    }
  }

  &.selected {
    border-color: #409eff;
    background: #f7fbff;
    color: #0f172a;
    box-shadow: 0 12px 24px rgba(64, 158, 255, 0.12);

    &::before {
      background: #409eff;
      transform: scaleX(1);
    }

    .option-title {
      color: #0f172a;
    }

    .option-description {
      color: #475569;
    }
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f5f7fa;

    &:hover {
      transform: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }
}

// 选项图标
.option-icon {
  margin-right: 16px;
  color: #409eff;
  transition: color 0.3s ease;
}

.connection-option.selected .option-icon {
  color: #409eff;
}

// 选项内容
.option-content {
  flex: 1;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.option-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
  transition: color 0.3s ease;
}

// 选项徽章
.option-badge {
  margin-left: 12px;
}

// 连接状态提示
.connection-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 0 4px;
  color: #334155;
  animation: slideDown 0.24s ease-out;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #166534;
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
}

.status-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.status-meta {
  font-size: 13px;
  color: #64748b;
}

.disconnect-btn {
  margin-left: auto;
}

.terminal-empty-state {
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
}

.terminal-panel {
  flex: 1;
  min-height: 0;
  display: flex;
}

// 终端包装器
.terminal-wrapper {
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #dbe3ee;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  background: white;
  display: flex;
}

// 动画
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .connection-options {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .connection-option {
    padding: 16px;
  }

  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .connect-button {
    width: 100%;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .connection-option {
    background: #2c3e50;
    border-color: #34495e;
    color: #ecf0f1;

    &:hover {
      border-color: #667eea;
    }

    &.disabled {
      background: #34495e;
    }
  }

  .option-title {
    color: #ecf0f1;
  }

  .option-description {
    color: #bdc3c7;
  }

  .status-meta {
    color: #cbd5e1;
  }
}
</style>
