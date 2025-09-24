/**
 * 如何添加新的通知渠道 - 示例文件
 *
 * 只需要在 channels.ts 的 CHANNEL_CONFIGS 中添加新的配置即可
 */

// 示例：添加钉钉通知渠道
export const DINGTALK_EXAMPLE = {
  code: "DINGTALK",
  label: "钉钉",
  language: "markdown",
  extension: "md",
  previewMode: "split" as const,
  description: "通过钉钉发送告警通知",
  defaultTemplate: `# 告警通知

**告警名称**: {{$alert.Title}}
**告警级别**: {{$alert.Severity}}
**告警时间**: {{$alert.Time}}
**告警描述**: {{$alert.Description}}

请及时处理此告警。`
}

// 示例：添加 Slack 通知渠道
export const SLACK_EXAMPLE = {
  code: "SLACK",
  label: "Slack",
  language: "json",
  extension: "json",
  previewMode: "split" as const,
  description: "通过 Slack 发送告警通知",
  defaultTemplate: `{
  "text": "告警通知",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "告警名称",
          "value": "{{$alert.Title}}",
          "short": true
        },
        {
          "title": "告警级别",
          "value": "{{$alert.Severity}}",
          "short": true
        },
        {
          "title": "告警时间",
          "value": "{{$alert.Time}}",
          "short": false
        },
        {
          "title": "告警描述",
          "value": "{{$alert.Description}}",
          "short": false
        }
      ]
    }
  ]
}`
}

/**
 * 添加步骤：
 * 1. 在 channels.ts 的 CHANNEL_CONFIGS 中添加新配置
 * 2. 确保 language 对应 CodeMirror 支持的语言（html, markdown, json, text）
 * 3. 设置合适的 previewMode（split 或 fullscreen）
 * 4. 提供有意义的 defaultTemplate
 * 5. 重新启动开发服务器
 *
 * 所有其他地方的渠道选择、编辑器语言、预览模式等都会自动更新！
 */
