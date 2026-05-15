import { computed, shallowRef } from "vue"
import { ElMessage, type ButtonProps } from "element-plus"
import { useGovernanceActions } from "./useGovernanceActions"

interface SelectionActionOptions<T, R = unknown> {
  title?: string
  confirmType?: ButtonProps["type"]
  emptyMsg?: string
  successMsg?: string
  getItems?: (rows: T[]) => T[]
  message: (items: T[]) => string
  api: (items: T[]) => Promise<R>
  onSuccess?: (res: R, items: T[]) => void
}

export function useSelectionAction<T>() {
  const selectedRows = shallowRef<T[]>([])
  const selectionCount = computed(() => selectedRows.value.length)
  const { handleConfirmAction } = useGovernanceActions()

  const handleSelectionChange = (rows: T[]) => {
    selectedRows.value = rows
  }

  const clearSelection = () => {
    selectedRows.value = []
  }

  const runSelectionAction = <R = unknown>(options: SelectionActionOptions<T, R>) => {
    const items = options.getItems ? options.getItems(selectedRows.value) : selectedRows.value

    if (items.length === 0) {
      ElMessage.warning(options.emptyMsg || "请先选择要操作的数据")
      return
    }

    handleConfirmAction({
      title: options.title,
      confirmType: options.confirmType,
      message: options.message(items),
      api: () => options.api(items),
      successMsg: options.successMsg,
      onSuccess: (res) => {
        clearSelection()
        options.onSuccess?.(res, items)
      }
    })
  }

  return {
    selectedRows,
    selectionCount,
    handleSelectionChange,
    clearSelection,
    runSelectionAction
  }
}
