/**
 * 模板编辑器相关的组合式函数
 */
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import type { CreateTemplateReq } from "@/api/alert/template/types"
import { formatJsonContent } from "../utils"

export function useTemplateEditor() {
  // 预览状态
  const showPreview = ref(false)

  // 计算属性：是否为 JSON 模板
  const isJsonTemplate = computed(() => {
    return (formData: CreateTemplateReq) => {
      return (
        formData.channel === "FEISHU_CARD" ||
        (formData.version.content && formData.version.content.trim().startsWith("{"))
      )
    }
  })

  // 切换预览模式
  const togglePreview = () => {
    showPreview.value = !showPreview.value
  }

  // 清空内容
  const handleClearContent = (formData: CreateTemplateReq) => {
    formData.version.content = ""
  }

  // 格式化 JSON
  const formatJson = (formData: CreateTemplateReq) => {
    try {
      formData.version.content = formatJsonContent(formData.version.content)
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
      if (/#{1,6}\s|^\*\s|^\-\s|^\d+\.\s|\[.*\]\(.*\)|!\[.*\]\(.*\)/.test(content)) {
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
  const getEditorLanguage = (formData: CreateTemplateReq) => {
    return isJsonTemplate.value(formData) ? "json" : "text"
  }

  // 设置默认内容（用于创建模式）
  const setDefaultContent = (formData: CreateTemplateReq) => {
    if (formData.channel === "FEISHU_CARD") {
      formData.version.content = `{
  "schema": "2.0",
  "config": {
    "wide_screen_mode": true
  },
  "header": {
    "template": "red",
    "title": {
      "tag": "plain_text",
      "content": "告警通知"
    }
  },
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**告警名称**: {{$alert.Title}}\\n**告警级别**: {{$alert.Severity}}\\n**告警时间**: {{$alert.Time}}"
      }
    }
  ]
}`
    } else if (formData.channel === "EMAIL") {
      formData.version.content = `告警通知

告警名称: {{$alert.Title}}
告警级别: {{$alert.Severity}}
告警时间: {{$alert.Time}}
告警描述: {{$alert.Description}}

请及时处理此告警。`
    } else {
      formData.version.content = `告警通知: {{$alert.Title}}`
    }
  }

  return {
    // 状态
    showPreview,
    
    // 计算属性
    isJsonTemplate,
    renderedContent,
    
    // 方法
    togglePreview,
    handleClearContent,
    formatJson,
    getEditorLanguage,
    setDefaultContent
  }
}
