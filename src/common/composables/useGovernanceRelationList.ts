import { watch, type Ref, toValue } from "vue"
import { useListManager } from "./useListManager"
import { useSelectionAction } from "./useSelectionAction"

interface GovernanceRelationOptions<Q extends object> {
  /** 获取列表数据的接口 */
  fetchApi: (params: Q) => Promise<any>
  /** 返回数据中列表对应的 key */
  listKey: string
  /** 当前激活的 Tab 名称 (用于懒加载) */
  activeTab?: Ref<string>
  /** 该列表所属的 Tab 名称 */
  tabName?: string
  /** 是否启用加载逻辑 (例如根据权限判定) */
  enabled?: Ref<boolean> | (() => boolean)
  /** 初始查询参数 */
  initialQuery?: Partial<Q>
  /** 变更后的回调 (如刷新父组件) */
  afterMutate?: () => void
}

/**
 * 治理详情页关联列表通用逻辑抽象
 * 集成了：列表分页管理、批量勾选、Tab 联动懒加载、刷新机制
 */
export function useGovernanceRelationList<T, Q extends object>(options: GovernanceRelationOptions<Q>) {
  const { fetchApi, listKey, activeTab, tabName, enabled, initialQuery, afterMutate } = options

  // 1. 核心列表管理 (分页、搜索、加载状态)
  const listManager = useListManager<T, Q>({
    fetchApi,
    listKey,
    initialQuery,
    immediate: false // 关联列表统一通过 Watch 联动触发，避免初始化时的冗余请求
  })

  // 2. 勾选动作管理 (selectedRows, handleSelectionChange, runSelectionAction)
  const selectionAction = useSelectionAction<T>()

  // 3. 联动懒加载逻辑
  const checkAndLoad = () => {
    const isEnabled = typeof enabled === "function" ? enabled() : toValue(enabled ?? true)
    if (!isEnabled) return

    // 如果未传入 tabName，则视为普通列表，立即加载
    if (!tabName || !activeTab) {
      listManager.fetchList()
      return
    }

    // 仅在当前 Tab 激活且数据为空时触发
    if (toValue(activeTab) === tabName && listManager.list.value.length === 0) {
      listManager.fetchList()
    }
  }

  // 监听 Tab 切换或外部依赖变化
  watch([() => toValue(activeTab), () => toValue(enabled)], () => checkAndLoad(), { immediate: true })

  // 4. 重定义刷新逻辑：刷新前清空选择
  const refresh = () => {
    selectionAction.selectedRows.value = []
    listManager.fetchList()
    afterMutate?.()
  }

  return {
    ...listManager,
    ...selectionAction,
    refresh
  }
}
