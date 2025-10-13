import { ref, nextTick, type Ref } from "vue"
import { usePagination } from "@@/composables/usePagination"
import { listWorkspacesByKeywordApi } from "@/api/alert/workspace"
import { listWorkflowsByKeywordApi } from "@/api/workflow/workflow"
import type { Workspace } from "@/api/alert/workspace/types"
import type { workflow } from "@/api/workflow/types/workflow"

// 业务类型枚举（数字ID用于数据库存储，字符串用于API调用）
export enum BUSINESS_TYPES {
  WORKSPACE = 1, // 工作空间
  WORKFLOW = 2 // 工作流
}

// 业务类型字符串映射（用于API调用）
export const BUSINESS_TYPE_STRINGS = {
  [BUSINESS_TYPES.WORKSPACE]: "workspace",
  [BUSINESS_TYPES.WORKFLOW]: "workflow"
} as const

// 通用业务项类型
export interface BusinessItem {
  id: number
  name: string
  description?: string
}

export function useBusinessPicker(businessType: Ref<BUSINESS_TYPES>) {
  // State
  const loading = ref<boolean>(false)
  const keyword = ref<string>("")
  const itemsData = ref<BusinessItem[]>([])
  const showPicker = ref(false)
  const searchKeyword = ref("")
  const selectedItem = ref<BusinessItem | null>(null)
  const selectedItems = ref<BusinessItem[]>([])
  const searchInputRef = ref<HTMLInputElement>()

  // 分页设置
  const init = {
    total: 0,
    currentPage: 1,
    pageSize: 3,
    layout: "prev, pager, next"
  }
  const { paginationData, handleCurrentChange: originalHandleCurrentChange } = usePagination(init)

  // 重写 handleCurrentChange 以重新加载数据
  const handleCurrentChange = (page: number) => {
    originalHandleCurrentChange(page)
    loadItemsData()
  }

  // 加载数据
  const loadData = async (keyword = "") => {
    loading.value = true
    try {
      let response
      if (businessType.value === BUSINESS_TYPES.WORKSPACE) {
        response = await listWorkspacesByKeywordApi({
          keyword,
          offset: (paginationData.currentPage - 1) * paginationData.pageSize,
          limit: paginationData.pageSize
        })
        itemsData.value = response.data.workspaces.map((workspace: Workspace) => ({
          id: workspace.id,
          name: workspace.name,
          description: workspace.enabled ? "已启用" : "已禁用"
        }))
        paginationData.total = response.data.total
      } else if (businessType.value === BUSINESS_TYPES.WORKFLOW) {
        response = await listWorkflowsByKeywordApi({
          keyword,
          offset: (paginationData.currentPage - 1) * paginationData.pageSize,
          limit: paginationData.pageSize
        })
        itemsData.value = response.data.workflows.map((workflow: workflow) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.desc
        }))
        paginationData.total = response.data.total
      }
    } catch (error) {
      console.error(`Failed to load ${businessType.value} data:`, error)
      itemsData.value = []
      paginationData.total = 0
    } finally {
      loading.value = false
    }
  }

  // 加载数据
  const loadItemsData = () => {
    loadData(searchKeyword.value)
  }

  // 切换选择器显示状态
  const togglePicker = () => {
    showPicker.value = !showPicker.value
    if (showPicker.value) {
      paginationData.currentPage = 1
      // 加载初始数据（如果有搜索关键词则搜索，否则加载默认数据）
      if (searchKeyword.value) {
        loadItemsData()
      } else {
        // 如果没有搜索关键词，加载默认数据
        loadData("")
      }
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }

  // 处理搜索
  const handleSearch = () => {
    paginationData.currentPage = 1
    loadItemsData()
  }

  // 选择项目
  const selectItem = (item: BusinessItem, callback?: (item: BusinessItem) => void) => {
    selectedItem.value = item
    showPicker.value = false
    if (callback) {
      callback(item)
    }
  }

  // 关闭选择器
  const closePicker = () => {
    showPicker.value = false
  }

  // 远程搜索方法
  const remoteMethod = (query: string) => {
    searchKeyword.value = query
    handleSearch()
  }

  // 点击外部处理
  const handleClickOutside = (e: Event) => {
    const target = e.target as HTMLElement
    if (!target.closest(".business-picker-container")) {
      showPicker.value = false
    }
  }

  return {
    // State
    loading,
    keyword,
    itemsData,
    showPicker,
    searchKeyword,
    selectedItem,
    selectedItems,
    searchInputRef,
    paginationData,

    // Methods
    loadItemsData,
    togglePicker,
    selectItem,
    handleSearch,
    remoteMethod,
    closePicker,
    handleCurrentChange,
    handleClickOutside
  }
}
