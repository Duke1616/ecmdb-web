import { ref, watch } from "vue"
import { listWorkflowApi } from "@/api/ticket/workflow/workflow"
import type { Workflow } from "@/api/ticket/workflow/types/workflow"
import { usePagination } from "@/common/composables/usePagination"
import { useUserStore } from "@/pinia/stores/user"

export const useWorkflowList = () => {
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const userStore = useUserStore()

  const workflowsData = ref<Workflow[]>([])
  const loading = ref(false)
  const userMaps = ref(new Map<string, string>())

  const loadOwnerNames = async (workflows: Workflow[]) => {
    const owners = Array.from(new Set(workflows.map((item) => item.owner).filter(Boolean)))
    if (owners.length === 0) return

    await Promise.all(
      owners.map(async (username) => {
        try {
          const user = await userStore.getUserByUsername(username)
          if (user) {
            userMaps.value.set(username, user.nickname || user.username)
          }
        } catch (error) {
          console.error(`ticket workflow getUsernamesData failed for ${username}:`, error)
        }
      })
    )
  }

  const listWorkflowsData = async () => {
    loading.value = true
    try {
      const { data } = await listWorkflowApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      paginationData.total = data.total
      workflowsData.value = data.workflows || []
      await loadOwnerNames(workflowsData.value)
    } catch (error) {
      workflowsData.value = []
      paginationData.total = 0
    } finally {
      loading.value = false
    }
  }

  const formatOwner = (row: Workflow) => {
    return userMaps.value.get(row.owner) || "未知用户"
  }

  watch([() => paginationData.currentPage, () => paginationData.pageSize], listWorkflowsData, { immediate: true })

  return {
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    workflowsData,
    loading,
    listWorkflowsData,
    formatOwner
  }
}
