import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useTenantScope } from "@/common/composables/useTenantScope"

const TAB_NAMES = {
  DESC: "resource-desc",
  LIST: "resource-list",
  GRAPH: "resource-relation"
} as const

type ResourceDetailTab = (typeof TAB_NAMES)[keyof typeof TAB_NAMES]
type ResourceDetailTabItem = {
  name: ResourceDetailTab
  label: string
}

export const useResourceDetail = () => {
  const route = useRoute()
  const router = useRouter()
  const { hasPermission } = usePermission()

  // 跨租户作用域支持：若路由携带特定租户空间 ID，则详情页内的所有请求均自动透传该租户上下文
  useTenantScope(() => {
    const rawTid = route.query.tenant_id
    if (!rawTid) return undefined
    const tid = Number(rawTid)
    return !Number.isNaN(tid) && tid > 0 ? tid : undefined
  })

  const modelUid = computed(() => String(route.query.model_uid || ""))
  const resourceName = computed(() => String(route.query.name || ""))
  const resourceId = computed(() => String(route.query.id || ""))

  const canViewRelationGraph = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.ViewRelationGraph))

  const tabs = computed<ResourceDetailTabItem[]>(() => {
    const items: ResourceDetailTabItem[] = [
      { name: TAB_NAMES.DESC, label: "资源详情" },
      { name: TAB_NAMES.LIST, label: "关系列表" }
    ]

    if (canViewRelationGraph.value) {
      items.push({ name: TAB_NAMES.GRAPH, label: "关联拓扑图" })
    }

    return items
  })

  const activeName = ref<ResourceDetailTab>(TAB_NAMES.DESC)

  const handleTabChange = (tabName: string) => {
    activeName.value = tabName as ResourceDetailTab
  }

  const goBack = () => {
    router.go(-1)
  }

  return {
    TAB_NAMES,
    activeName,
    canViewRelationGraph,
    modelUid,
    resourceId,
    resourceName,
    tabs,
    goBack,
    handleTabChange
  }
}
