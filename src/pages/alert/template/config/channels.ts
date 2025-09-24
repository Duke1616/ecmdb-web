/**
 * 通知渠道配置管理
 */

export interface ChannelConfig {
  /** 渠道代码 */
  code: string
  /** 渠道显示名称 */
  label: string
  /** 编辑器语言 */
  language: string
  /** 文件扩展名 */
  extension: string
  /** 预览模式 */
  previewMode: "split" | "fullscreen"
  /** 默认模板内容 */
  defaultTemplate: string
  /** 渠道描述 */
  description: string
}

/**
 * 所有支持的渠道配置
 */
export const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  EMAIL: {
    code: "EMAIL",
    label: "邮件",
    language: "html",
    extension: "html",
    previewMode: "fullscreen",
    description: "通过邮件发送告警通知",
    defaultTemplate: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>告警通知</title>
</head>
<body>
    <h2>告警通知</h2>
    <p><strong>告警名称</strong>: {{$alert.Title}}</p>
    <p><strong>告警级别</strong>: {{$alert.Severity}}</p>
    <p><strong>告警时间</strong>: {{$alert.Time}}</p>
    <p><strong>告警描述</strong>: {{$alert.Description}}</p>
    <p>请及时处理此告警。</p>
</body>
</html>`
  },
  WECHAT: {
    code: "WECHAT",
    label: "企业微信",
    language: "markdown",
    extension: "md",
    previewMode: "split",
    description: "通过企业微信发送告警通知",
    defaultTemplate: `# 告警通知

**告警名称**: {{$alert.Title}}
**告警级别**: {{$alert.Severity}}
**告警时间**: {{$alert.Time}}
**告警描述**: {{$alert.Description}}

请及时处理此告警。`
  },
  FEISHU_CARD: {
    code: "FEISHU_CARD",
    label: "飞书卡片",
    language: "json",
    extension: "json",
    previewMode: "split",
    description: "通过飞书卡片发送告警通知",
    defaultTemplate: `{
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
  }
}

/**
 * 获取渠道配置
 */
export const getChannelConfig = (channelCode: string): ChannelConfig | null => {
  return CHANNEL_CONFIGS[channelCode] || null
}

/**
 * 获取所有渠道配置
 */
export const getAllChannelConfigs = (): ChannelConfig[] => {
  return Object.values(CHANNEL_CONFIGS)
}

/**
 * 获取渠道选项（用于表单选择）
 */
export const getChannelOptions = () => {
  return getAllChannelConfigs().map((config) => ({
    label: config.label,
    value: config.code,
    description: config.description
  }))
}

/**
 * 获取渠道标签
 */
export const getChannelLabel = (channelCode: string): string => {
  const config = getChannelConfig(channelCode)
  return config?.label || channelCode
}

/**
 * 获取编辑器语言
 */
export const getEditorLanguage = (channelCode: string): string => {
  const config = getChannelConfig(channelCode)
  return config?.language || "text"
}

/**
 * 获取预览模式
 */
export const getPreviewMode = (channelCode: string): "split" | "fullscreen" => {
  const config = getChannelConfig(channelCode)
  return config?.previewMode || "split"
}

/**
 * 获取默认模板内容
 */
export const getDefaultTemplate = (channelCode: string): string => {
  const config = getChannelConfig(channelCode)
  return config?.defaultTemplate || ""
}

/**
 * 获取渠道类型标签类型
 */
export const getChannelType = (channelCode: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const types: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    EMAIL: "primary",
    WECHAT: "success",
    FEISHU_CARD: "warning"
  }
  return types[channelCode] || "info"
}

/**
 * 检查是否为特定类型的模板
 */
export const isChannelType = (channelCode: string, type: "html" | "markdown" | "json"): boolean => {
  const config = getChannelConfig(channelCode)
  return config?.language === type
}
