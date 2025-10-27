<template>
  <div class="secure-field-view">
    <!-- 查看按钮 -->
    <el-button
      v-if="!isDisplaying && !copyOnly"
      type="primary"
      size="small"
      plain
      :icon="View"
      @click="handleViewClick"
      class="secure-button"
    >
      查看
    </el-button>

    <!-- 只显示复制按钮模式 -->
    <div v-if="copyOnly" class="copy-only-container">
      <el-button
        type="primary"
        size="small"
        plain
        :icon="CopyDocument"
        :loading="isCopying"
        :disabled="isCopying"
        @click="handleCopyClick"
        class="copy-only-button"
        title="点击复制安全内容到剪贴板"
      >
        {{ isCopying ? "获取中..." : "复制内容" }}
      </el-button>
    </div>

    <!-- 显示内容模式 -->
    <div v-if="isDisplaying && showContent" class="secure-content">
      <div class="secure-text">{{ content }}</div>
      <div class="secure-actions">
        <span class="auto-close-tip">{{ countdown }}秒后自动关闭</span>
        <el-button
          type="text"
          size="small"
          :icon="CopyDocument"
          @click="handleCopyClick"
          class="copy-button"
          title="复制内容"
        />
      </div>
    </div>

    <!-- 不显示内容但显示复制按钮模式 -->
    <div v-if="isDisplaying && !showContent" class="secure-actions-only">
      <span class="auto-close-tip">{{ countdown }}秒后自动关闭</span>
      <el-button
        type="primary"
        size="small"
        plain
        :icon="CopyDocument"
        @click="handleCopyClick"
        class="copy-button"
        title="复制内容"
      >
        复制
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, watch } from "vue"
import { View, CopyDocument } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

interface Props {
  /** 安全内容 */
  content?: string
  /** 是否正在显示内容 */
  isDisplaying?: boolean
  /** 自动关闭时间（秒），默认3秒 */
  autoCloseTime?: number
  /** 是否启用自动关闭，默认true */
  enableAutoClose?: boolean
  /** 是否显示敏感内容，默认true */
  showContent?: boolean
  /** 是否只显示复制按钮，默认false */
  copyOnly?: boolean
}

interface Emits {
  /** 点击查看按钮 */
  (e: "view-click"): void
  /** 内容显示状态变化 */
  (e: "display-change", isDisplaying: boolean): void
  /** 复制内容 */
  (e: "copy", content: string): void
}

const props = withDefaults(defineProps<Props>(), {
  content: "",
  isDisplaying: false,
  autoCloseTime: 3,
  enableAutoClose: true,
  showContent: true,
  copyOnly: false
})

const emits = defineEmits<Emits>()

const countdown = ref(0)
const internalContent = ref("")
const isCopying = ref(false)
let timer: NodeJS.Timeout | null = null

// 监听 content 变化，更新内部内容
watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      internalContent.value = newContent
    }
  },
  { immediate: true }
)

const handleViewClick = () => {
  emits("view-click")

  if (props.enableAutoClose && !props.copyOnly) {
    startCountdown()
  }
}

const startCountdown = () => {
  // 清除之前的定时器
  if (timer) {
    clearInterval(timer)
  }

  countdown.value = props.autoCloseTime

  timer = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
      emits("display-change", false)
    }
  }, 1000)
}

const handleCopyClick = async () => {
  // 如果是 copy-only 模式，直接触发 view-click 获取数据并复制
  if (props.copyOnly) {
    emits("view-click")
    // 等待一下让父组件处理数据获取
    await new Promise((resolve) => setTimeout(resolve, 200))

    const contentToCopy = internalContent.value || props.content

    if (!contentToCopy) {
      ElMessage.error("没有可复制的内容")
      return
    }

    try {
      await navigator.clipboard.writeText(contentToCopy)
      ElMessage.success("复制成功")
      emits("copy", contentToCopy)
    } catch (error) {
      // 降级处理
      try {
        const textArea = document.createElement("textarea")
        textArea.value = contentToCopy
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        ElMessage.success("复制成功")
        emits("copy", contentToCopy)
      } catch (fallbackError) {
        ElMessage.error("复制失败")
        console.error("Copy failed:", fallbackError)
      }
    }
    return
  }

  // 非 copy-only 模式的正常复制逻辑
  const contentToCopy = internalContent.value || props.content

  if (!contentToCopy) {
    ElMessage.error("没有可复制的内容")
    return
  }

  try {
    await navigator.clipboard.writeText(contentToCopy)
    ElMessage.success("复制成功")
    emits("copy", contentToCopy)
  } catch (error) {
    // 降级处理
    try {
      const textArea = document.createElement("textarea")
      textArea.value = contentToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      ElMessage.success("复制成功")
      emits("copy", contentToCopy)
    } catch (fallbackError) {
      ElMessage.error("复制失败")
      console.error("Copy failed:", fallbackError)
    }
  }
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.secure-field-view {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-width: 0;
  position: relative;

  .secure-button {
    border-color: #409eff;
    color: #409eff;
    font-size: 11px;
    padding: 3px 6px;
    height: 22px;
    border-radius: 4px;
    transition: all 0.3s ease;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 0;

    &:hover {
      background-color: #409eff;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
    }
  }

  .copy-only-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
  }

  .copy-only-button {
    border-color: #67c23a;
    color: #67c23a;
    font-size: 11px;
    padding: 3px 6px;
    height: 22px;
    border-radius: 4px;
    transition: all 0.3s ease;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background-color: #67c23a;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .secure-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    width: 100%;

    word-wrap: break-word;
    overflow-wrap: break-word;

    .secure-text {
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #495057;
      word-break: break-all;
      white-space: pre-wrap;
      background: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .secure-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;

      .auto-close-tip {
        font-size: 11px;
        color: #6c757d;
        font-style: italic;
        font-weight: 500;
        transition: color 0.3s ease;

        &:hover {
          color: #495057;
        }
      }

      .copy-button {
        padding: 2px 4px;
        font-size: 12px;
        color: #6c757d;
        transition: all 0.2s ease;

        &:hover {
          color: #409eff;
          background-color: rgba(64, 158, 255, 0.1);
        }
      }
    }
  }

  .secure-actions-only {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .auto-close-tip {
      font-size: 11px;
      color: #6c757d;
      font-style: italic;
      font-weight: 500;
      transition: color 0.3s ease;

      &:hover {
        color: #495057;
      }
    }

    .copy-button {
      border-color: #67c23a;
      color: #67c23a;
      font-size: 12px;
      padding: 4px 8px;
      height: 24px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background-color: #67c23a;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
      }
    }
  }
}
</style>
