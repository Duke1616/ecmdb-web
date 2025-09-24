/**
 * 模板表单管理组合式函数
 * 统一管理表单数据、多渠道内容、编辑器状态等
 */
import { ref, computed } from "vue"
import type { CreateTemplateReq } from "@/api/alert/template/types"
import {
  getEditorLanguage as getChannelEditorLanguage,
  getPreviewMode as getChannelPreviewMode,
  getDefaultTemplate as getChannelDefaultTemplate,
  isChannelType
} from "../config/channels"

export function useTemplateForm() {
  // 表单数据
  const formData = ref<CreateTemplateReq>({
    ownerId: 1,
    name: "",
    description: "",
    channel: "",
    version: {
      name: "",
      content: "",
      remark: ""
    }
  })

  // 多渠道数据映射
  const multiChannelData = ref<Record<string, string>>({})

  // 当前选中的渠道
  const currentChannel = ref<string>("")

  // 预览状态
  const showPreview = ref(false)

  // 计算属性：是否为 JSON 模板
  const isJsonTemplate = computed(() => {
    return isChannelType(formData.value.channel, "json")
  })

  // 计算属性：是否为 HTML 模板
  const isHtmlTemplate = computed(() => {
    return isChannelType(formData.value.channel, "html")
  })

  // 计算属性：是否为 Markdown 模板
  const isMarkdownTemplate = computed(() => {
    return isChannelType(formData.value.channel, "markdown")
  })

  // 计算属性：预览模式
  const previewMode = computed(() => {
    return getChannelPreviewMode(formData.value.channel)
  })

  // 计算属性：编辑器语言
  const editorLanguage = computed(() => {
    return getChannelEditorLanguage(formData.value.channel)
  })

  // 渲染预览内容
  const renderedContent = computed(() => {
    const content = formData.value.version.content
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
  })

  // 初始化多渠道数据
  const initializeMultiChannelData = () => {
    const channels = ["EMAIL", "WECHAT", "FEISHU_CARD"]
    channels.forEach((channel) => {
      if (!multiChannelData.value[channel]) {
        multiChannelData.value[channel] = getChannelDefaultTemplate(channel)
      }
    })
  }

  // 处理渠道切换
  const handleChannelChange = (newChannel: string) => {
    // 保存当前渠道的内容
    if (currentChannel.value && formData.value.version.content) {
      multiChannelData.value[currentChannel.value] = formData.value.version.content
    }

    // 更新当前渠道
    currentChannel.value = newChannel

    // 确保多渠道数据已初始化
    if (Object.keys(multiChannelData.value).length === 0) {
      initializeMultiChannelData()
    }

    // 切换到新渠道的内容
    formData.value.version.content = multiChannelData.value[newChannel] || getChannelDefaultTemplate(newChannel)
  }

  // 处理内容变化
  const handleContentChange = (content: string) => {
    formData.value.version.content = content
    // 同时更新多渠道数据
    if (currentChannel.value) {
      multiChannelData.value[currentChannel.value] = content
    }
  }

  // 切换预览模式
  const togglePreview = () => {
    showPreview.value = !showPreview.value
  }

  // 清空内容
  const handleClearContent = () => {
    formData.value.version.content = ""
    if (currentChannel.value) {
      multiChannelData.value[currentChannel.value] = ""
    }
  }

  // 格式化 JSON
  const formatJson = () => {
    try {
      const content = formData.value.version.content
      const formatted = JSON.stringify(JSON.parse(content), null, 2)
      formData.value.version.content = formatted
      if (currentChannel.value) {
        multiChannelData.value[currentChannel.value] = formatted
      }
    } catch (error) {
      console.error("JSON 格式错误:", error)
    }
  }

  // 重置表单
  const resetForm = () => {
    formData.value = {
      ownerId: 1,
      name: "",
      description: "",
      channel: "",
      version: {
        name: "",
        content: "",
        remark: ""
      }
    }
    multiChannelData.value = {}
    currentChannel.value = ""
    showPreview.value = false
  }

  // 设置表单数据（用于编辑模式）
  const setFormData = (data: CreateTemplateReq) => {
    formData.value = { ...data }
    currentChannel.value = data.channel
    // 为当前渠道设置内容
    if (currentChannel.value) {
      multiChannelData.value[currentChannel.value] = data.version.content
    }
  }

  return {
    // 状态
    formData,
    showPreview,
    currentChannel,
    multiChannelData,

    // 计算属性
    isJsonTemplate,
    isHtmlTemplate,
    isMarkdownTemplate,
    previewMode,
    editorLanguage,
    renderedContent,

    // 方法
    initializeMultiChannelData,
    handleChannelChange,
    handleContentChange,
    togglePreview,
    handleClearContent,
    formatJson,
    resetForm,
    setFormData
  }
}
