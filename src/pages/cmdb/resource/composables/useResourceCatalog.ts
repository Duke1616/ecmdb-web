import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import type { Model } from "@/api/model/types/model"
import type { ModelGroupView } from "@/common/utils/model"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useModelStore } from "@/pinia/stores/model"

export type ResourceAssetState = "all" | "hasData" | "empty"

export const useResourceCatalog = () => {
  const router = useRouter()
  const modelStore = useModelStore()
  const { hasPermission } = usePermission()

  const searchInput = ref("")
  const assetState = ref<ResourceAssetState>("all")
  const groupModelsData = ref<ModelGroupView[]>([])
  const selectedGroupId = ref<number | null>(null)

  const empty = computed(() => groupModelsData.value.length === 0)
  const canViewResources = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.View))

  const filterData = computed(() => {
    const keyword = searchInput.value.trim().toLowerCase()
    const hasActiveFilter = Boolean(keyword) || assetState.value !== "all"

    return groupModelsData.value
      .map((group) => {
        const models = (group.models || []).filter((model) => {
          const uid = String(model.uid || "").toLowerCase()
          const name = String(model.name || "").toLowerCase()
          const total = Number(model.resource_count || 0)
          const matchesKeyword = !keyword || uid.includes(keyword) || name.includes(keyword)
          const matchesAssetState =
            assetState.value === "all" ||
            (assetState.value === "hasData" && total > 0) ||
            (assetState.value === "empty" && total === 0)

          return matchesKeyword && matchesAssetState
        })

        return { ...group, models }
      })
      .filter((group) => (!hasActiveFilter ? true : group.models.length > 0))
  })

  const selectedGroup = computed(() => {
    if (!selectedGroupId.value) return filterData.value[0] || null
    return filterData.value.find((group) => group.group_id === selectedGroupId.value) || filterData.value[0] || null
  })

  const totalResources = computed(() =>
    groupModelsData.value.reduce((sum, group) => {
      return sum + (group.models || []).reduce((modelSum, model) => modelSum + Number(model.resource_count || 0), 0)
    }, 0)
  )

  const selectGroup = (groupId: number) => {
    selectedGroupId.value = groupId
  }

  const getResourceModelsData = async () => {
    try {
      const { groups } = await modelStore.ListModelsByGroup()
      groupModelsData.value = groups
      selectedGroupId.value = selectedGroup.value?.group_id ?? null
    } catch (error) {
      console.error("获取资产模型数据失败:", error)
      groupModelsData.value = []
      selectedGroupId.value = null
    }
  }

  const handleModelClick = (model: Model) => {
    if (!canViewResources.value) return

    router.push({
      path: "/cmdb/resource/list",
      query: { uid: model.uid, name: model.name }
    })
  }

  return {
    searchInput,
    assetState,
    groupModelsData,
    filterData,
    empty,
    selectedGroup,
    totalResources,
    canViewResources,
    selectGroup,
    getResourceModelsData,
    handleModelClick
  }
}
