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
      <el-alert
        :title="`已连接到 ${getCurrentOptionLabel()}`"
        type="success"
        :closable="false"
        show-icon
        class="status-alert"
      >
        <template #default>
          <div class="status-content">
            <span>资源ID: {{ resourceId }}</span>
            <el-button type="text" @click="disconnect" class="disconnect-btn"> 断开连接 </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 终端组件容器 -->
    <div v-if="isConnected" class="terminal-wrapper">
      <finder v-if="selectedOption === 'Web Sftp'" :resource_id="resourceId" :prefix="prefix" />
      <xterm v-else-if="selectedOption === 'Web Shell'" :resource_id="resourceId" :prefix="prefix" />
      <guacd v-else-if="selectedOption === 'RDP'" :resource_id="resourceId" :prefix="prefix" />
      <!-- VNC 组件暂未实现 -->
      <div v-else-if="selectedOption === 'VNC'" class="vnc-placeholder">
        <el-empty description="VNC 功能暂未实现" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { connectApi } from "@/api/term"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"

// 组件导入
import { FormDialog } from "@/common/components/Dialogs"
import guacd from "./guacd.vue"
import xterm from "./xterm.vue"
import finder from "./file-system.vue"
// import vnc from "./vnc.vue" // VNC 组件暂未实现

// 类型定义
export interface PrefixConfig {
  wsServer: string
  prefix: string
}

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
    isConnected.value = true
    dialogVisible.value = false

    ElMessage.success(`成功连接到 ${getCurrentOptionLabel()}`)
  } catch (error: any) {
    console.error("连接失败:", error)

    const errorMessage = error?.msg || error?.message || "连接失败"
    ElMessage.error(`连接失败: ${errorMessage}`)
  } finally {
    loading.value = false
  }
}

const disconnect = () => {
  isConnected.value = false
  selectedOption.value = ""
  prefix.value = undefined
  dialogVisible.value = true

  ElMessage.info("已断开连接")
}

const getPrefixConfig = (): PrefixConfig => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = window.location.host

  return {
    wsServer: `${protocol}//${host}`,
    prefix: `${window.location.protocol}//${window.location.host}`
  }
}

// 生命周期
onMounted(() => {
  // 检查必要参数
  if (!resourceId.value) {
    ElMessage.error("缺少必要的资源ID参数")
    router.back()
    return
  }

  // 默认选择第一个可用选项
  const firstAvailable = connectionOptions.find((opt) => !opt.disabled)
  if (firstAvailable) {
    selectedOption.value = firstAvailable.value
  }
})

onUnmounted(() => {
  // 组件卸载时清理资源
  if (isConnected.value) {
    disconnect()
  }
})
</script>

<style scoped lang="scss">
.term-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  border-radius: 12px;
  border: 2px solid #e4e7ed;
  background: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);

    &::before {
      transform: scaleX(1);
    }
  }

  &.selected {
    border-color: #67c23a;
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(103, 194, 58, 0.3);

    &::before {
      background: rgba(255, 255, 255, 0.3);
      transform: scaleX(1);
    }

    .option-title {
      color: white;
    }

    .option-description {
      color: rgba(255, 255, 255, 0.9);
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
  color: #667eea;
  transition: color 0.3s ease;
}

.connection-option.selected .option-icon {
  color: white;
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
  margin: 16px;
  animation: slideDown 0.3s ease-out;
}

.status-alert {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.disconnect-btn {
  color: #f56c6c;
  font-weight: 500;

  &:hover {
    color: #f78989;
  }
}

// 终端包装器
.terminal-wrapper {
  flex: 1;
  margin: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: white;
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
  .term-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

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
}
</style>
