/**
 * 模板集合管理组合式函数
 */

import { ref } from "vue"
import { ElMessageBox } from "element-plus"
import { useRouter } from "vue-router"
import { usePagination } from "@/common/composables/usePagination"
import {
  listTemplateSetsApi,
  createTemplateSetApi,
  updateTemplateSetApi,
  deleteTemplateSetApi,
  getTemplateSetApi
} from "@/api/alert/template_set"
import type { TemplateSet, CreateTemplateSetReq } from "@/api/alert/template_set/types"

export function useTemplateSet() {
  const router = useRouter()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  // 响应式数据
  const templateSets = ref<TemplateSet[]>([])
  const loading = ref(false)

  // 加载模板集合数据
  const loadTemplateSets = async () => {
    loading.value = true
    try {
      const response = await listTemplateSetsApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      templateSets.value = response.data.template_sets || []
      paginationData.total = response.data.total || 0
    } finally {
      loading.value = false
    }
  }

  // 创建模板集合
  const createTemplateSet = async (data: CreateTemplateSetReq) => {
    await createTemplateSetApi(data)
    await loadTemplateSets()
    return true
  }

  // 更新模板集合
  const updateTemplateSet = async (id: number, data: Partial<CreateTemplateSetReq>) => {
    await updateTemplateSetApi({
      id,
      name: data.name || "",
      description: data.description || ""
    })
    await loadTemplateSets()
    return true
  }

  // 删除模板集合
  const deleteTemplateSet = async (templateSet: TemplateSet) => {
    await ElMessageBox.confirm(`确定要删除模板集合 "${templateSet.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteTemplateSetApi({ id: templateSet.id })
    await loadTemplateSets()
    return true
  }

  // 获取模板集合详情
  const getTemplateSet = async (id: number) => {
    const response = await getTemplateSetApi({ id })
    return response.data.template_set
  }

  // 导航到条目管理页面
  const navigateToItems = (templateSet: TemplateSet) => {
    router.push(`/alert/notify/template-set/items/${templateSet.id}`)
  }

  return {
    // 数据
    templateSets,
    loading,
    paginationData,

    // 方法
    loadTemplateSets,
    createTemplateSet,
    updateTemplateSet,
    deleteTemplateSet,
    getTemplateSet,
    navigateToItems,
    handleCurrentChange,
    handleSizeChange
  }
}
