/**
 * 升级步骤模板管理组合式函数
 */

import { ref } from "vue"
import { ElMessageBox } from "element-plus"
import { usePagination } from "@/common/composables/usePagination"
import {
  listStepTemplatesApi,
  createStepTemplateApi,
  updateStepTemplateApi,
  deleteStepTemplateApi
} from "@/api/alert/escalation"
import type { StepTemplateVO, CreateStepTemplateReq } from "@/api/alert/escalation/types"

export function useStepTemplates() {
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  // 响应式数据
  const templates = ref<StepTemplateVO[]>([])
  const loading = ref(false)

  // 加载模板数据
  const loadTemplates = async () => {
    loading.value = true
    try {
      const { data } = await listStepTemplatesApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })
      templates.value = data.templates || []
      paginationData.total = data.total || 0
    } finally {
      loading.value = false
    }
  }

  // 创建模板
  const createTemplate = async (data: CreateStepTemplateReq) => {
    await createStepTemplateApi(data)
    await loadTemplates()
    return true
  }

  // 更新模板
  const updateTemplate = async (data: CreateStepTemplateReq & { id: number }) => {
    await updateStepTemplateApi(data)
    await loadTemplates()
    return true
  }

  // 删除模板
  const deleteTemplate = async (template: StepTemplateVO) => {
    await ElMessageBox.confirm(`确定删除模板 "${template.name}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteStepTemplateApi(template.id)
    await loadTemplates()
    return true
  }

  return {
    // 数据
    templates,
    loading,
    paginationData,

    // 方法
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    handleCurrentChange,
    handleSizeChange
  }
}
