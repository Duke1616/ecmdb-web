<template>
  <div class="secure-field-view" :class="{ 'is-compact': compact }">
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
        {{ isCopying ? "复制中..." : "复制" }}
      </el-button>
    </div>

    <div v-if="isDisplaying && compact" class="secure-compact-content">
      <span v-if="enableAutoClose" class="compact-countdown">{{ countdown }}s</span>
      <el-tooltip content="复制内容">
        <button class="compact-icon-button" type="button" @click="handleCopyClick">
          <el-icon><CopyDocument /></el-icon>
        </button>
      </el-tooltip>
    </div>

    <!-- 显示内容模式 -->
    <div v-if="isDisplaying && showContent && !compact" class="secure-content" :class="{ 'is-inline': inlineContent }">
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
    <div v-if="isDisplaying && !showContent && !compact" class="secure-actions-only">
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
  /** 内容是否内嵌展示，默认false */
  inlineContent?: boolean
  /** 紧凑展示模式，适合详情卡片内联操作 */
  compact?: boolean
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
  copyOnly: false,
  inlineContent: false,
  compact: false
})

const emits = defineEmits<Emits>()

const countdown = ref(0)
const internalContent = ref("")
const isCopying = ref(false)
let timer: NodeJS.Timeout | null = null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getContentToCopy = () => internalContent.value || props.content || ""

const waitForContent = async (timeout = 1200) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    const content = getContentToCopy()
    if (content) return content
    await sleep(50)
  }

  return getContentToCopy()
}

const copyText = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success("复制成功")
    emits("copy", content)
  } catch (error) {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = content
      textArea.setAttribute("readonly", "readonly")
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      ElMessage.success("复制成功")
      emits("copy", content)
    } catch (fallbackError) {
      ElMessage.error("复制失败")
      console.error("Copy failed:", fallbackError)
    }
  }
}

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
  if (isCopying.value) return

  isCopying.value = true

  try {
    if (props.copyOnly) {
      emits("view-click")
      await sleep(60)
    }

    const contentToCopy = props.copyOnly ? await waitForContent() : getContentToCopy()

    if (!contentToCopy) {
      ElMessage.error("没有可复制的内容")
      return
    }

    await copyText(contentToCopy)
  } finally {
    isCopying.value = false
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

  &.is-compact {
    .secure-button {
      height: 28px;
      padding: 0 10px;
      border-color: #cfd8e6;
      border-radius: 999px;
      background: #ffffff;
      color: #475569;
      font-size: 12px;
      font-weight: 600;

      &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
        color: #2563eb;
      }
    }
  }

  .secure-button {
    border-color: #dbe3ef;
    color: #475569;
    font-size: 11px;
    font-weight: 600;
    padding: 0 8px;
    height: 26px;
    border-radius: 6px;
    transition: all 0.18s ease;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 0;
    background: #ffffff;

    &:hover {
      background-color: #f8fbff;
      border-color: #9bbcf8;
      color: #2563eb;
    }
  }

  .secure-compact-content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .compact-countdown {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
  }

  .compact-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid #dbe3ef;
    border-radius: 999px;
    background: #ffffff;
    color: #64748b;
    cursor: pointer;
    transition:
      border-color 0.18s ease,
      color 0.18s ease,
      background-color 0.18s ease;

    &:hover {
      background: #f8fbff;
      border-color: #9bbcf8;
      color: #2563eb;
    }

    .el-icon {
      font-size: 14px;
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
    min-width: 64px;
    height: 28px;
    padding: 0 9px;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    background: #ffffff;
    border-color: #dbe3ef;
    border-radius: 6px;
    transition: all 0.18s ease;

    :deep(.el-icon) {
      color: #64748b;
      font-size: 14px;
    }

    &:hover:not(:disabled) {
      color: #2563eb;
      background-color: #f8fbff;
      border-color: #9bbcf8;

      :deep(.el-icon) {
        color: #2563eb;
      }
    }

    &:disabled {
      color: #94a3b8;
      cursor: not-allowed;
      background-color: #f8fafc;
      border-color: #e2e8f0;
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

    &.is-inline {
      position: static;
      width: 100%;
      max-width: 100%;
      box-shadow: none;
    }

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
