import { computed, ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { useModelStore } from "@/pinia/stores/model"
import { adminSearchStructureApi, searchStructureApi } from "@/api/cmdb/resource"
import type {
  AdminSearchStructureResult,
  AdminSearchTenantItem,
  SearchModelItem,
  SearchStructureResult
} from "@/api/cmdb/resource/types/resource"
import type { TenantFilterType } from "../types"

/**
 * 阶段一：大盘结构与租户/模型导航状态机
 */
export function useSearchStructure() {
  const userStore = useUserStore()
  const modelStore = useModelStore()

  // 接口加载状态
  const structureLoading = ref(false)
  const currentSearchingKeyword = ref("")
  const adminStructure = ref<AdminSearchStructureResult | null>(null)
  const singleStructure = ref<SearchStructureResult | null>(null)

  // 选中的租户空间与模型
  const activeTenantId = ref<number>(0)
  const activeModelUid = ref<string>("")

  // 租户过滤控件状态
  const tenantFilterType = ref<TenantFilterType>("all")
  const tenantSearchKey = ref("")

  /** 判断是否具备超管权限 / 系统空间访问 */
  const isSuperAdmin = computed(() => {
    return (
      userStore.isAdmin ||
      userStore.permissions?.includes("cmdb:resource:admin_search_structure") ||
      userStore.currentTenantId === 1
    )
  })

  /** 获取租户展示名称 */
  const getTenantDisplayName = (tenantId: number, tenantType: string): string => {
    const match = userStore.tenants.find((t) => t.id === tenantId)
    if (match?.name) return match.name
    return tenantType === "personal" ? `个人空间 (#${tenantId})` : `组织空间 (#${tenantId})`
  }

  /** 获取模型展示名称 */
  const getModelDisplayName = (model: SearchModelItem): string => {
    if (model.model_name) return model.model_name
    const storeName = modelStore.getModelName(model.model_uid)
    return storeName || model.model_uid
  }

  /** 获取所有扁平租户项（根据类型过滤） */
  const flatTenantList = computed<AdminSearchTenantItem[]>(() => {
    if (!adminStructure.value) return []
    const orgs = adminStructure.value.organizations || []
    const pers = adminStructure.value.personals || []
    if (tenantFilterType.value === "organization") return orgs
    if (tenantFilterType.value === "personal") return pers
    return [...orgs, ...pers]
  })

  /** 租户模糊搜索过滤后的列表 */
  const filteredTenantList = computed<AdminSearchTenantItem[]>(() => {
    const list = flatTenantList.value
    if (!tenantSearchKey.value.trim()) return list
    const key = tenantSearchKey.value.trim().toLowerCase()
    return list.filter((item) => {
      const name = getTenantDisplayName(item.tenant_id, item.tenant_type).toLowerCase()
      return name.includes(key) || String(item.tenant_id).includes(key)
    })
  })

  /** 统计总数 */
  const allTenantsTotalCount = computed(() => {
    if (!adminStructure.value) return 0
    return (adminStructure.value.organizations?.length || 0) + (adminStructure.value.personals?.length || 0)
  })

  const orgTenantsTotalCount = computed(() => adminStructure.value?.organizations?.length || 0)
  const personalTenantsTotalCount = computed(() => adminStructure.value?.personals?.length || 0)

  /** 当前是否展示左侧租户侧栏 */
  const showTenantSidebar = computed(() => {
    return isSuperAdmin.value && flatTenantList.value.length > 0
  })

  /** 当前展示的模型 Tab 列表 */
  const currentDisplayModels = computed<SearchModelItem[]>(() => {
    if (showTenantSidebar.value) {
      const currentTenant = flatTenantList.value.find((t) => t.tenant_id === activeTenantId.value)
      return currentTenant?.models || []
    }
    return singleStructure.value?.models || []
  })

  /** 判断全域结果是否为空 */
  const isSearchResultEmpty = computed(() => {
    if (isSuperAdmin.value) {
      return !adminStructure.value || adminStructure.value.total === 0
    }
    return !singleStructure.value || singleStructure.value.total === 0
  })

  /** 顶部副标题统计说明 */
  const headerSubtitle = computed(() => {
    if (structureLoading.value) return "正在聚合全域元数据结构..."
    const total = isSuperAdmin.value ? (adminStructure.value?.total ?? 0) : (singleStructure.value?.total ?? 0)
    const modelCount = currentDisplayModels.value.length
    if (showTenantSidebar.value) {
      return `检索到 ${total} 条相关资产，覆盖 ${allTenantsTotalCount.value} 个租户空间、当前空间包含 ${modelCount} 个匹配模型`
    }
    return `检索到 ${total} 条相关资产，分布在 ${modelCount} 个资产模型`
  })

  /**
   * 执行大盘结构检索（阶段一）
   * @param keyword 搜索关键字
   * @returns 初始选中的租户ID与模型UID
   */
  const executeStructureSearch = async (keyword: string): Promise<{ tenantId: number; modelUid: string } | null> => {
    currentSearchingKeyword.value = keyword
    structureLoading.value = true
    adminStructure.value = null
    singleStructure.value = null
    activeTenantId.value = 0
    activeModelUid.value = ""

    try {
      if (isSuperAdmin.value) {
        const { data } = await adminSearchStructureApi(keyword)
        adminStructure.value = data

        // 提取全部模型 UID 并预热 Store 缓存
        const allUids = [
          ...(data.organizations || []).flatMap((o) => o.models.map((m) => m.model_uid)),
          ...(data.personals || []).flatMap((p) => p.models.map((m) => m.model_uid))
        ]
        modelStore.getByModelUids(allUids)

        // 默认选中第一个租户及其首个模型
        const firstTenant = (data.organizations && data.organizations[0]) || (data.personals && data.personals[0])
        if (firstTenant) {
          activeTenantId.value = firstTenant.tenant_id
          if (firstTenant.models && firstTenant.models.length > 0) {
            activeModelUid.value = firstTenant.models[0].model_uid
          }
        }
      } else {
        const { data } = await searchStructureApi(keyword)
        singleStructure.value = data

        const allUids = (data.models || []).map((m) => m.model_uid)
        modelStore.getByModelUids(allUids)

        if (data.models && data.models.length > 0) {
          activeModelUid.value = data.models[0].model_uid
        }
      }

      return {
        tenantId: activeTenantId.value,
        modelUid: activeModelUid.value
      }
    } catch (error) {
      console.error("阶段一结构检索异常:", error)
      return null
    } finally {
      structureLoading.value = false
    }
  }

  /**
   * 切换选中的租户空间
   * @param tenantId 租户ID
   * @returns 切换后选中的模型UID
   */
  const selectTenant = (tenantId: number): string => {
    if (activeTenantId.value === tenantId) return activeModelUid.value
    activeTenantId.value = tenantId

    const targetTenant = flatTenantList.value.find((t) => t.tenant_id === tenantId)
    if (targetTenant && targetTenant.models && targetTenant.models.length > 0) {
      activeModelUid.value = targetTenant.models[0].model_uid
    } else {
      activeModelUid.value = ""
    }

    return activeModelUid.value
  }

  /**
   * 切换选中的模型 Tab
   * @param modelUid 模型UID
   */
  const selectModel = (modelUid: string) => {
    activeModelUid.value = modelUid
  }

  /** 清空重置结构数据 */
  const resetStructure = () => {
    currentSearchingKeyword.value = ""
    adminStructure.value = null
    singleStructure.value = null
    activeTenantId.value = 0
    activeModelUid.value = ""
  }

  return {
    isSuperAdmin,
    structureLoading,
    currentSearchingKeyword,
    adminStructure,
    singleStructure,
    activeTenantId,
    activeModelUid,
    tenantFilterType,
    tenantSearchKey,
    flatTenantList,
    filteredTenantList,
    allTenantsTotalCount,
    orgTenantsTotalCount,
    personalTenantsTotalCount,
    showTenantSidebar,
    currentDisplayModels,
    isSearchResultEmpty,
    headerSubtitle,
    getTenantDisplayName,
    getModelDisplayName,
    executeStructureSearch,
    selectTenant,
    selectModel,
    resetStructure
  }
}
