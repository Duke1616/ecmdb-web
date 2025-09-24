/**
 * 模板编辑器相关的组合式函数
 */
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import type { CreateTemplateReq } from "@/api/alert/template/types"
import { formatJsonContent } from "../utils"
import {
  getEditorLanguage as getChannelEditorLanguage,
  getPreviewMode as getChannelPreviewMode,
  getDefaultTemplate as getChannelDefaultTemplate,
  isChannelType
} from "../config/channels"

export function useTemplateEditor() {
  // 预览状态
  const showPreview = ref(false)

  // 多渠道数据映射，每个渠道都有独立的内容
  const multiChannelData = ref<Record<string, string>>({})

  // 当前选中的渠道
  const currentChannel = ref<string>("")

  // 计算属性：是否为 JSON 模板
  const isJsonTemplate = computed(() => {
    return (channel: string) => {
      return isChannelType(channel, "json")
    }
  })

  // 计算属性：是否为 HTML 模板
  const isHtmlTemplate = computed(() => {
    return (channel: string) => {
      return isChannelType(channel, "html")
    }
  })

  // 计算属性：是否为 Markdown 模板
  const isMarkdownTemplate = computed(() => {
    return (channel: string) => {
      return isChannelType(channel, "markdown")
    }
  })

  // 计算属性：预览模式
  const previewMode = computed(() => {
    return (channel: string) => {
      return getChannelPreviewMode(channel)
    }
  })

  // 切换预览模式
  const togglePreview = () => {
    showPreview.value = !showPreview.value
  }

  // 清空内容
  const handleClearContent = (channel: string) => {
    multiChannelData.value[channel] = ""
  }

  // 格式化 JSON
  const formatJson = (channel: string) => {
    try {
      multiChannelData.value[channel] = formatJsonContent(multiChannelData.value[channel] || "")
      ElMessage.success("JSON 格式化成功")
    } catch (error) {
      ElMessage.error("JSON 格式错误，无法格式化")
    }
  }

  // 渲染预览内容
  const renderedContent = computed(() => {
    return (content: string) => {
      if (!content) return ""

      // 如果是 JSON 格式，直接返回格式化后的 JSON
      if (content.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(content)
          return `<pre><code>${JSON.stringify(parsed, null, 2)}</code></pre>`
        } catch {
          return `<pre><code>${content}</code></pre>`
        }
      }

      // 检查是否包含 HTML 标签
      if (/<[^>]+>/.test(content)) {
        return content
      }

      // 检查是否包含 Markdown 语法
      if (/#{1,6}\s|^\*\s|^-\s|^\d+\.\s|\[.*\]\(.*\)|!\[.*\]\(.*\)/.test(content)) {
        // 简单的 Markdown 渲染
        return content
          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
          .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/gim, "<em>$1</em>")
          .replace(/^\* (.*$)/gim, "<li>$1</li>")
          .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
          .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
          .replace(/\n\n/gim, "</p><p>")
          .replace(/\n/gim, "<br>")
          .replace(/^(.*)$/gim, "<p>$1</p>")
      }

      // 普通文本，保持换行
      return content.replace(/\n/gim, "<br>")
    }
  })

  // 获取编辑器语言
  const getEditorLanguage = (channel: string) => {
    return getChannelEditorLanguage(channel)
  }

  // 初始化多渠道数据（用于创建模式）
  const initializeMultiChannelData = () => {
    const channels = ["EMAIL", "WECHAT", "FEISHU_CARD"]
    channels.forEach((channel) => {
      if (!multiChannelData.value[channel]) {
        multiChannelData.value[channel] = getChannelDefaultTemplate(channel)
      }
    })
  }

  // 处理渠道切换
  const handleChannelChange = (formData: CreateTemplateReq, newChannel: string) => {
    // 更新当前渠道
    currentChannel.value = newChannel
    formData.channel = newChannel

    // 确保多渠道数据已初始化
    if (Object.keys(multiChannelData.value).length === 0) {
      initializeMultiChannelData()
    }

    // 更新表单数据为当前渠道的内容
    formData.version.content = multiChannelData.value[newChannel] || getChannelDefaultTemplate(newChannel)
  }

  // 更新当前渠道的内容
  const updateCurrentChannelContent = (content: string) => {
    if (currentChannel.value) {
      multiChannelData.value[currentChannel.value] = content
    }
  }

  // 获取当前渠道的内容
  const getCurrentChannelContent = () => {
    return multiChannelData.value[currentChannel.value] || ""
  }

  // 获取指定渠道的内容
  const getChannelContent = (channel: string) => {
    return multiChannelData.value[channel] || getChannelDefaultTemplate(channel)
  }

  // 设置指定渠道的内容
  const setChannelContent = (channel: string, content: string) => {
    multiChannelData.value[channel] = content
  }

  // 清除所有渠道数据
  const clearAllChannelData = () => {
    multiChannelData.value = {}
    currentChannel.value = ""
  }

  return {
    // 状态
    showPreview,
    currentChannel,
    multiChannelData,

    // 计算属性
    isJsonTemplate,
    isHtmlTemplate,
    isMarkdownTemplate,
    previewMode,
    renderedContent,

    // 方法
    togglePreview,
    handleClearContent,
    formatJson,
    getEditorLanguage,
    initializeMultiChannelData,
    handleChannelChange,
    updateCurrentChannelContent,
    getCurrentChannelContent,
    getChannelContent,
    setChannelContent,
    clearAllChannelData
  }
}
