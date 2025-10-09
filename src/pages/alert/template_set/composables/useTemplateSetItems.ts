/**
 * 模板集合条目管理组合式函数
 */

import { ref, computed } from "vue"
import { ElMessageBox } from "element-plus"
import { useRoute } from "vue-router"
import { usePagination } from "@/common/composables/usePagination"
import { listItemsApi, addItemApi, addItemsApi, deleteItemsApi, getTemplateSetApi } from "@/api/alert/template_set"
import { listTemplatesByChannelApi } from "@/api/alert/template"
import type { TemplateSetItem, AddItemReq } from "@/api/alert/template_set/types"
import type { ChannelTemplate } from "@/api/alert/template/types"
import { getChannelOptions } from "../../template/config/channels"
import { validateTemplateSetItems } from "../utils"

export function useTemplateSetItems() {
  const route = useRoute()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  // 响应式数据
  const templateSet = ref<any>(null)
  const items = ref<TemplateSetItem[]>([])
  const selectedItems = ref<TemplateSetItem[]>([])
  const loading = ref(false)
  const templatesLoading = ref(false)
  const availableTemplates = ref<ChannelTemplate[]>([])

  // 批量添加相关
  const batchItems = ref<AddItemReq[]>([])
  const batchTemplates = ref<Record<number, ChannelTemplate[]>>({})

  // 计算属性
  const setId = computed(() => Number(route.params.id))
  const channelOptions = computed(() => getChannelOptions())

  // 加载模板集合信息
  const loadTemplateSet = async () => {
    if (!setId.value) return

    const response = await getTemplateSetApi({ id: setId.value })
    templateSet.value = response.data.template_set
  }

  // 加载条目数据
  const loadItems = async () => {
    if (!setId.value) return

    loading.value = true
    try {
      const response = await listItemsApi({ set_id: setId.value })
      items.value = response.data.items || []
      paginationData.total = items.value.length
    } finally {
      loading.value = false
    }
  }

  // 按渠道加载模板
  const loadTemplatesByChannel = async (channel: string) => {
    if (!channel) {
      availableTemplates.value = []
      return
    }

    templatesLoading.value = true
    try {
      const response = await listTemplatesByChannelApi({
        channel,
        offset: 0,
        limit: 1000
      })
      availableTemplates.value = response.data.templates || []
    } finally {
      templatesLoading.value = false
    }
  }

  // 添加单个条目
  const addItem = async (data: AddItemReq) => {
    await addItemApi(data)
    await loadItems()
    return true
  }

  // 批量添加条目
  const addItems = async (items: AddItemReq[]) => {
    await addItemsApi({
      set_id: setId.value,
      items
    })
    await loadItems()
    return true
  }

  // 删除指定条目
  const deleteItems = async (itemIds: number[]) => {
    await ElMessageBox.confirm(`确定要删除选中的 ${itemIds.length} 个条目吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteItemsApi({
      set_id: setId.value,
      item_ids: itemIds
    })

    await loadItems()
    return true
  }

  // 删除单个条目
  const deleteItem = async (item: TemplateSetItem) => {
    return await deleteItems([item.id])
  }

  // 批量添加相关方法
  const addBatchItem = () => {
    const index = batchItems.value.length
    batchItems.value.push({
      set_id: setId.value,
      channel: "",
      template_id: undefined
    })
    batchTemplates.value[index] = []
  }

  const removeBatchItem = (index: number) => {
    batchItems.value.splice(index, 1)
    delete batchTemplates.value[index]
    // 重新索引模板列表
    const newBatchTemplates: Record<number, ChannelTemplate[]> = {}
    Object.keys(batchTemplates.value).forEach((key, newIndex) => {
      newBatchTemplates[newIndex] = batchTemplates.value[Number(key)]
    })
    batchTemplates.value = newBatchTemplates
  }

  const handleBatchChannelChange = async (index: number, channel: string) => {
    batchItems.value[index].template_id = undefined

    try {
      const response = await listTemplatesByChannelApi({
        channel,
        offset: 0,
        limit: 1000
      })
      batchTemplates.value[index] = response.data.templates || []
    } catch {
      batchTemplates.value[index] = []
    }
  }

  const submitBatchAdd = async () => {
    const validation = validateTemplateSetItems(batchItems.value)
    if (!validation.valid) {
      throw new Error(validation.message || "数据验证失败")
    }

    return await addItems(
      batchItems.value.map((item) => ({
        ...item,
        template_id: item.template_id!
      }))
    )
  }

  const clearBatchData = () => {
    batchItems.value = []
    batchTemplates.value = {}
  }

  return {
    // 数据
    templateSet,
    items,
    selectedItems,
    loading,
    templatesLoading,
    availableTemplates,
    batchItems,
    batchTemplates,
    paginationData,
    channelOptions,
    setId,

    // 方法
    loadTemplateSet,
    loadItems,
    loadTemplatesByChannel,
    addItem,
    addItems,
    deleteItems,
    deleteItem,
    addBatchItem,
    removeBatchItem,
    handleBatchChannelChange,
    submitBatchAdd,
    clearBatchData,
    handleCurrentChange,
    handleSizeChange
  }
}
