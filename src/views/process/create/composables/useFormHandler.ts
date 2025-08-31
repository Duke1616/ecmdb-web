import { ref } from "vue"
import { ElMessageBox } from "element-plus"

export function useFormHandler(initialData: any, emits: any, context: "form" | "workflow" = "form") {
  // 如果传入的是ref，直接使用；否则创建新的ref
  const localFormData = initialData?.value !== undefined ? initialData : ref({ ...initialData })

  const updateFormData = () => {
    emits("update:formData", localFormData.value)
  }

  const next = () => {
    updateFormData()
    emits("next")
  }

  const previous = () => {
    updateFormData()
    emits("previous")
  }

  const save = () => {
    updateFormData()
    emits("save")
  }

  const close = () => {
    const messages = {
      form: {
        title: "确认取消",
        content: "确定要取消当前操作吗？已填写的信息将不会保存。",
        confirmText: "确定取消",
        cancelText: "继续填写",
        icon: "⚠️"
      },
      workflow: {
        title: "确认取消",
        content: "确定要取消当前操作吗？已设计的流程将不会保存。",
        confirmText: "确定取消",
        cancelText: "继续编辑",
        icon: "⚠️"
      }
    }

    const message = messages[context]

    // 创建自定义样式
    const style = document.createElement("style")
    style.textContent = `
      .custom-confirm-dialog {
        border-radius: 20px !important;
        overflow: hidden !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1) !important;
      }
      .custom-confirm-dialog .el-message-box__header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        padding: 24px 24px 20px !important;
        border-bottom: none !important;
      }
      .custom-confirm-dialog .el-message-box__title {
        color: white !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        text-align: center !important;
        letter-spacing: 0.5px !important;
      }
      .custom-confirm-dialog .el-message-box__content {
        padding: 32px 24px 48px !important;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
      }
      .custom-confirm-dialog .el-message-box__btns {
        padding: 14px 20px 8px 20px !important;
        background: white !important;
        border-top: 1px solid #e5e7eb !important;
        display: flex !important;
        justify-content: space-between !important;
        gap: 0 !important;
      }
      .custom-confirm-dialog .el-button {
        min-width: 100px !important;
        height: 40px !important;
        border-radius: 20px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        border: 2px solid transparent !important;
        position: relative !important;
        overflow: hidden !important;
        letter-spacing: 0.3px !important;
      }
      .custom-confirm-dialog .el-button--default {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        border-color: #e2e8f0 !important;
        color: #64748b !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      }
      .custom-confirm-dialog .el-button--default:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
        border-color: #667eea !important;
        color: #475569 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2) !important;
      }
      .custom-confirm-dialog .el-button--danger {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        border-color: #ef4444 !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2) !important;
      }
      .custom-confirm-dialog .el-button--danger:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
        border-color: #dc2626 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3) !important;
      }
      .custom-confirm-dialog .el-button:active {
        transform: translateY(0) !important;
      }
      .custom-confirm-dialog .el-button::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: -100% !important;
        width: 100% !important;
        height: 100% !important;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent) !important;
        transition: left 0.5s !important;
      }
      .custom-confirm-dialog .el-button:hover::before {
        left: 100% !important;
      }
      .custom-confirm-dialog .el-overlay {
        backdrop-filter: blur(8px) !important;
        background: rgba(0, 0, 0, 0.4) !important;
      }
      .custom-confirm-dialog .el-message-box {
        animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `
    document.head.appendChild(style)

    ElMessageBox.confirm(message.content, message.title, {
      confirmButtonText: message.confirmText,
      cancelButtonText: message.cancelText,
      type: "warning",
      confirmButtonClass: "el-button--danger",
      cancelButtonClass: "el-button--default",
      customClass: "custom-confirm-dialog",
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      center: true,
      roundButton: true,
      dangerouslyUseHTMLString: true,
      message: `
        <div class="custom-confirm-content">
          <div class="confirm-icon">${message.icon}</div>
          <div class="confirm-text">${message.content}</div>
        </div>
      `
    })
      .then(() => {
        emits("close")
        // 清理样式
        document.head.removeChild(style)
      })
      .catch(() => {
        // 用户选择继续操作，不做任何操作
        // 清理样式
        document.head.removeChild(style)
      })
  }

  const setFormData = (newData: any) => {
    localFormData.value = { ...newData }
  }

  return {
    localFormData,
    updateFormData,
    next,
    previous,
    save,
    close,
    setFormData
  }
}
