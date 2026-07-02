import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { useTemplateToolsStore } from "@/pinia/stores/template-tools"
import type { Ticket } from "@/api/ticket/manager/types/manager"
import type { TicketFetcher } from "./types"

interface UseTicketListOptions {
  fetcher: TicketFetcher
  mergeFields?: string[]
}

interface SpanRow {
  mergeCell?: string[]
  [key: `rowspan_${string}`]: number | string[] | undefined
  [key: string]: unknown
}

export const useTicketList = ({ fetcher, mergeFields = [] }: UseTicketListOptions) => {
  const templateToolsStore = useTemplateToolsStore()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

  const ticketsData = ref<Ticket[]>([])
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

  const loadTicketsData = async () => {
    loading.value = true

    try {
      const { data } = await fetcher({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      paginationData.total = data.total || 0
      ticketsData.value = data.tasks || []

      if (mergeFields.length > 0) {
        setTableRowSpan(ticketsData.value as SpanRow[], mergeFields)
      }

      const templateIds = ticketsData.value.map((item) => item.template_id).filter(Boolean)
      if (templateIds.length > 0) {
        templateToolsStore.setByTemplateIds(templateIds)
      }
    } catch (error) {
      ticketsData.value = []
      paginationData.total = 0
    } finally {
      loading.value = false
    }
  }

  watch([() => paginationData.currentPage, () => paginationData.pageSize], loadTicketsData, { immediate: true })

  return {
    templateToolsStore,
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    ticketsData,
    loading,
    loadTicketsData
  }
}
