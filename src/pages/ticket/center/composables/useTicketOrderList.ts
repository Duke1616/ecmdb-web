import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import type { order } from "@/api/ticket/order/types/order"
import type { TicketOrderFetcher } from "./types"

interface UseTicketOrderListOptions {
  fetcher: TicketOrderFetcher
  mergeFields?: string[]
}

interface SpanRow {
  mergeCell?: string[]
  [key: `rowspan_${string}`]: number | string[] | undefined
  [key: string]: unknown
}

export const useTicketOrderList = ({ fetcher, mergeFields = [] }: UseTicketOrderListOptions) => {
  const templateToolsStore = useTemplateToolsStore()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  const ordersData = ref<order[]>([])
  const loading = ref(false)

  const setTableRowSpan = (tableData: SpanRow[], colFields: string[]) => {
    colFields.forEach((field, index) => {
      let lastItem: SpanRow | undefined

      tableData.forEach((item) => {
        item.mergeCell = colFields
        const rowSpan = `rowspan_${field}` as const

        if (lastItem && colFields.slice(0, index + 1).every((key) => lastItem?.[key] === item[key])) {
          item[rowSpan] = 0
          lastItem[rowSpan] = Number(lastItem[rowSpan] || 0) + 1
        } else {
          item[rowSpan] = 1
          lastItem = item
        }
      })
    })
  }

  const loadOrdersData = async () => {
    loading.value = true

    try {
      const { data } = await fetcher({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      paginationData.total = data.total || 0
      ordersData.value = data.tasks || []

      if (mergeFields.length > 0) {
        setTableRowSpan(ordersData.value as SpanRow[], mergeFields)
      }

      const templateIds = ordersData.value.map((item) => item.template_id).filter(Boolean)
      if (templateIds.length > 0) {
        templateToolsStore.setByTemplateIds(templateIds)
      }
    } catch (error) {
      ordersData.value = []
      paginationData.total = 0
    } finally {
      loading.value = false
    }
  }

  watch([() => paginationData.currentPage, () => paginationData.pageSize], loadOrdersData, { immediate: true })

  return {
    templateToolsStore,
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    ordersData,
    loading,
    loadOrdersData
  }
}
