import { ref } from "vue"
import { ElMessageBox } from "element-plus"
import "./close-dialog.scss"

// 定义页面类型
export type PageType = "info" | "lf" | "setting"

// 定义表单数据接口
export interface FormData {
  [key: string]: any
}

// 定义事件发射器接口
export interface FormEmits {
  (event: "next"): void
  (event: "previous"): void
  (event: "close"): void
  (event: "save"): void
  (event: "update:formData", data: FormData): void
}

// 定义页面配置
const PAGE_CONFIGS = {
  info: {
    title: "确认取消",
    content: "确定要取消当前操作吗？已填写的基本信息将不会保存。",
    confirmText: "确定取消",
    cancelText: "继续填写",
    icon: "📝"
  },
  lf: {
    title: "确认取消", 
    content: "确定要取消当前操作吗？已设计的流程将不会保存。",
    confirmText: "确定取消",
    cancelText: "继续编辑",
    icon: "🔧"
  },
  setting: {
    title: "确认取消",
    content: "确定要取消当前操作吗？已配置的设置将不会保存。",
    confirmText: "确定取消", 
    cancelText: "继续配置",
    icon: "⚙️"
  }
}

export function useFormHandler(
  formData: any,
  emits: any,
  pageType: PageType
) {
  // 本地表单数据
  const localFormData = ref({ ...formData })

  // 更新表单数据
  const updateFormData = () => {
    emits("update:formData", localFormData.value)
  }

  // 下一步
  const next = () => {
    updateFormData()
    emits("next")
  }

  // 上一步
  const previous = () => {
    updateFormData()
    emits("previous")
  }

  // 保存
  const save = () => {
    updateFormData()
    emits("save")
  }

  // 关闭确认对话框
  const close = () => {
    const config = PAGE_CONFIGS[pageType]
    
    ElMessageBox.confirm(config.content, config.title, {
      confirmButtonText: config.confirmText,
      cancelButtonText: config.cancelText,
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
          <div class="confirm-icon">${config.icon}</div>
          <div class="confirm-text">${config.content}</div>
        </div>
      `
    })
      .then(() => {
        emits("close")
      })
      .catch(() => {
        // 用户选择继续操作，不做任何操作
      })
  }

  // 设置表单数据
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
