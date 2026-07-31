import { ref, toValue, watch, type MaybeRefOrGetter } from "vue"
import { useExecutionLogsSSE } from "@/sse/etask/manager"
import { createExecutionLogAccumulator, type ExecutionLogEntry } from "./executionLogAccumulator"

export interface ExecutionLogPage {
  logs: ExecutionLogEntry[]
  maxId?: number
}

interface FetchExecutionLogsParams {
  executionId: number
  cursor: number
  limit: number
}

interface UseExecutionLogStreamOptions {
  executionId: MaybeRefOrGetter<number | null | undefined>
  live?: MaybeRefOrGetter<boolean>
  fetchPage: (params: FetchExecutionLogsParams) => Promise<ExecutionLogPage>
  pageSize?: number
  maxPagesPerSync?: number
  onUpdated?: () => void
}

/**
 * 合并日志快照与实时事件，并隔离执行切换期间返回的过期响应。
 * HTTP 游标和展示游标相互独立，避免 SSE 抢先到达时跳过尚未拉取的历史日志。
 */
export function useExecutionLogStream(options: UseExecutionLogStreamOptions) {
  const pageSize = options.pageSize ?? 1000
  const maxPagesPerSync = options.maxPagesPerSync ?? 10
  const accumulator = createExecutionLogAccumulator()
  const content = ref("")
  const loading = ref(false)
  const hasMore = ref(false)
  const lastSyncTime = ref("")
  const lastFetchedAt = ref(0)
  let generation = 0
  let activeSync: Promise<number> | undefined
  let activeSyncKey = ""

  const publish = () => {
    content.value = accumulator.content
    lastSyncTime.value = new Date().toLocaleTimeString()
    options.onUpdated?.()
  }

  const reset = () => {
    generation += 1
    accumulator.reset()
    content.value = ""
    loading.value = false
    hasMore.value = false
    lastSyncTime.value = ""
    lastFetchedAt.value = 0
  }

  const sync = (silent = false) => {
    const executionId = toValue(options.executionId)
    if (!executionId) return Promise.resolve(0)

    const currentGeneration = generation
    const syncKey = `${executionId}:${currentGeneration}`
    if (activeSync && activeSyncKey === syncKey) return activeSync

    if (!silent) loading.value = true
    activeSyncKey = syncKey
    const request = (async () => {
      let fetchedCount = 0
      for (let page = 0; page < maxPagesPerSync; page += 1) {
        const result = await options.fetchPage({ executionId, cursor: accumulator.fetchedCursor, limit: pageSize })
        if (generation !== currentGeneration || toValue(options.executionId) !== executionId) return fetchedCount

        const logs = result.logs ?? []
        fetchedCount += logs.length
        const changed = accumulator.merge(logs)
        accumulator.confirmFetched(logs, result.maxId)
        if (changed) publish()

        hasMore.value = logs.length === pageSize
        if (!hasMore.value) break
      }
      lastFetchedAt.value = Date.now()
      if (!lastSyncTime.value) lastSyncTime.value = new Date().toLocaleTimeString()
      return fetchedCount
    })().finally(() => {
      if (activeSync === request) {
        activeSync = undefined
        activeSyncKey = ""
        loading.value = false
      }
    })
    activeSync = request
    return request
  }

  watch(
    () => toValue(options.executionId),
    () => reset(),
    { flush: "sync" }
  )

  useExecutionLogsSSE({
    executionId: options.executionId,
    enabled: () => Boolean(toValue(options.executionId)) && toValue(options.live ?? true),
    onMessage: (event) => {
      if (event.execution_id !== toValue(options.executionId)) return
      if (accumulator.merge([event])) publish()
    }
  })

  return { content, loading, hasMore, lastSyncTime, lastFetchedAt, sync, reset }
}
