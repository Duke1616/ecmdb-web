import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

/**
 * 统一 Tab 状态与 URL 参数同步逻辑
 * 适用于详情页切换标签时，刷新页面仍能保持在当前 Tab
 *
 * @param defaultTab 默认选中的标签页
 * @param queryKey URL 参数名，默认为 'tab'
 */
export function useTabRouter(defaultTab: string, queryKey: string = "tab") {
  const route = useRoute()
  const router = useRouter()

  // 1. 初始化状态：优先从 URL 获取，否则使用默认值
  const activeTab = ref((route.query[queryKey] as string) || defaultTab)

  // 2. 监听状态变化，同步到 URL
  watch(activeTab, (newTab) => {
    // 只有当 URL 参数确实变化时才进行 replace，避免不必要的 history push
    if (route.query[queryKey] !== newTab) {
      router.replace({
        query: { ...route.query, [queryKey]: newTab }
      })
    }
  })

  // 3. 监听路由变化，同步回状态 (处理浏览器前进后退)
  watch(
    () => route.query[queryKey],
    (newVal) => {
      if (newVal && newVal !== activeTab.value) {
        activeTab.value = newVal as string
      }
    }
  )

  return {
    activeTab
  }
}
