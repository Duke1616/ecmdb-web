import { ref } from "vue"
import { runner, Kind } from "@/api/task/runner/types/runner"
import {
  listRunnerApi,
  listRunnerByCodebookIdApi,
  listRunnerExcludeCodebookIdApi,
  deleteRunnerApi
} from "@/api/task/runner"
import { ElMessage, ElMessageBox } from "element-plus"

export function useRunner() {
  const allRunners = ref<runner[]>([])
  const allRunnersTotal = ref<number>(0)

  const codebookRunners = ref<runner[]>([])
  const codebookRunnersTotal = ref<number>(0)

  const loading = ref(false)

  const fetchRunners = async () => {
    try {
      const { data } = await listRunnerApi({ offset: 0, limit: 1000 })
      // Notice: not used much now, kept for broader runner list if needed
      allRunners.value = data.runners || []
      allRunnersTotal.value = data.total || 0
    } catch (error) {
      console.error("Failed to fetch runners:", error)
      allRunners.value = []
      allRunnersTotal.value = 0
    }
  }

  const fetchCodebookRunners = async (
    codebookId: number,
    offset: number = 0,
    limit: number = 20,
    keyword?: string,
    kind?: Kind,
    isAppend: boolean = false
  ) => {
    if (!isAppend) loading.value = true
    try {
      const { data } = await listRunnerByCodebookIdApi({
        codebook_id: codebookId,
        offset,
        limit,
        keyword,
        kind
      })

      if (isAppend) {
        codebookRunners.value = [...codebookRunners.value, ...(data.runners || [])]
      } else {
        codebookRunners.value = data.runners || []
      }
      codebookRunnersTotal.value = data.total || 0
    } catch (error) {
      console.error("Failed to fetch codebook runners:", error)
      if (!isAppend) codebookRunners.value = []
    } finally {
      loading.value = false
    }
  }

  const forkableRunners = ref<runner[]>([])
  const forkableRunnersTotal = ref<number>(0)

  const fetchExcludeCodebookRunners = async (
    codebookId: number,
    offset: number = 0,
    limit: number = 20,
    keyword?: string,
    kind?: Kind,
    isAppend: boolean = false
  ) => {
    if (!isAppend) loading.value = true
    try {
      const { data } = await listRunnerExcludeCodebookIdApi({
        codebook_id: codebookId,
        offset,
        limit,
        keyword,
        kind
      })

      if (isAppend) {
        forkableRunners.value = [...forkableRunners.value, ...(data.runners || [])]
      } else {
        forkableRunners.value = data.runners || []
      }
      forkableRunnersTotal.value = data.total || 0
    } catch (error) {
      console.error("Failed to fetch exclude codebook runners:", error)
      if (!isAppend) forkableRunners.value = []
    } finally {
      loading.value = false
    }
  }

  const deleteRunner = async (row: runner, onSuccess?: () => void) => {
    try {
      await ElMessageBox.confirm(`确认要删除执行单元 [${row.name}] 吗？`, "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
      await deleteRunnerApi(row.id)
      ElMessage.success("删除成功")
      if (onSuccess) onSuccess()
    } catch (e) {
      // 忽略取消操作
    }
  }

  return {
    allRunners,
    allRunnersTotal,
    codebookRunners,
    codebookRunnersTotal,
    forkableRunners,
    forkableRunnersTotal,
    loading,
    fetchRunners,
    fetchCodebookRunners,
    fetchExcludeCodebookRunners,
    deleteRunner
  }
}
