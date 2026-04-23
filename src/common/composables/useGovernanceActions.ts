import { ElMessageBox, ElMessage, type ButtonProps } from "element-plus"

/**
 * 治理平台通用动作管理器
 * 用于统一处理“确认-执行-反馈-刷新”这一标准操作流
 */
export function useGovernanceActions() {
  /**
   * 通用的二次确认执行函数
   * @param options 配置项
   */
  const handleConfirmAction = async <T = void>(options: {
    /** 弹窗标题 */
    title?: string
    /** 确认消息内容 */
    message: string
    /** 执行 API 的函数 (需返回 Promise) */
    api: () => Promise<T>
    /** 操作成功后的回调 (可接收 API 返回结果) */
    onSuccess?: (res: T) => void
    /** 成功后的提示文字 */
    successMsg?: string
    /** 确认按钮的类型 (使用 Element Plus 标准类型) */
    confirmType?: ButtonProps["type"]
  }) => {
    const { title = "危险操作确认", message, api, onSuccess, successMsg = "操作成功", confirmType = "danger" } = options

    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        buttonSize: "default",
        confirmButtonClass: `el-button--${confirmType}`,
        draggable: true
      })

      // 执行 API
      const res = await api()

      // 成功反馈
      ElMessage({
        type: "success",
        message: successMsg,
        customClass: "eiam-message-success"
      })

      // 执行回调
      onSuccess?.(res)
    } catch (err: unknown) {
      // 排除用户取消操作
      if (err === "cancel") return

      console.error("[GovernanceAction Error]:", err)
      const errorMsg = err instanceof Error ? err.message : "操作执行失败，请检查网络或权限"
      ElMessage.error(errorMsg)
    }
  }

  /**
   * 简单的复制文本功能
   */
  const handleCopy = async (text: string, label: string = "内容") => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success(`${label}已复制到剪贴板`)
    } catch (err) {
      ElMessage.error("复制失败，浏览器可能不支持此操作")
    }
  }

  return {
    handleConfirmAction,
    handleCopy
  }
}
