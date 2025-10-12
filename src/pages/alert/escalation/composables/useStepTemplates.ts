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

  const templates = ref<StepTemplateVO[]>([])
  const loading = ref(false)

  // 加载模板数据
  const loadTemplates = async () => {
    loading.value = true
    try {
      const response = await listStepTemplatesApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      templates.value = response.data.templates || []
      paginationData.total = response.data.total || 0
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
  const updateTemplate = async (id: number, data: Partial<CreateStepTemplateReq>) => {
    await updateStepTemplateApi({
      id,
      name: data.name || "",
      description: data.description || "",
      channels: data.channels || [],
      receivers: data.receivers || []
    })
    await loadTemplates()
    return true
  }

  // 删除模板
  const deleteTemplate = async (template: StepTemplateVO) => {
    await ElMessageBox.confirm(`确定要删除模板 "${template.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteStepTemplateApi(template.id)
    await loadTemplates()
    return true
  }

  return {
    templates,
    loading,
    paginationData,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    handleCurrentChange,
    handleSizeChange
  }
}
