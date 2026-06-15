import { computed, h, ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteModelGroupApi } from "@/api/model"
import type { Model, Models } from "@/api/model/types/model"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useModelStore } from "@/pinia/stores/model"
import { getModelStatus, type ModelFilterStatus } from "../utils/modelDisplay"

export const useModelCatalog = () => {
  const router = useRouter()
  const modelStore = useModelStore()
  const { hasPermission } = usePermission()

  const searchInput = ref("")
  const modelStatus = ref<ModelFilterStatus>("all")
  const modelsData = ref<Models[]>([])
  const selectedGroupId = ref<number | null>(null)

  const empty = computed(() => modelsData.value.length === 0)
  const canViewModelDetail = computed(() => hasPermission(CMDB_CAPABILITIES.Model.Detail))
  const canDeleteModelGroup = computed(() => hasPermission(CMDB_CAPABILITIES.Model.GroupDelete))

  const filterData = computed(() => {
    const keyword = searchInput.value.trim().toLowerCase()
    const hasActiveFilter = Boolean(keyword) || modelStatus.value !== "all"

    return modelsData.value
      .map((group) => {
        const models = (group.models || []).filter((model) => {
          const uid = String(model.uid || "").toLowerCase()
          const name = String(model.name || "").toLowerCase()
          const matchesKeyword = !keyword || uid.includes(keyword) || name.includes(keyword)
          const matchesStatus = modelStatus.value === "all" || getModelStatus(model) === modelStatus.value

          return matchesKeyword && matchesStatus
        })

        return { ...group, models }
      })
      .filter((group) => (!hasActiveFilter ? true : group.models.length > 0))
  })

  const selectedGroup = computed(() => {
    if (!selectedGroupId.value) return filterData.value[0] || null
    return filterData.value.find((group) => group.group_id === selectedGroupId.value) || filterData.value[0] || null
  })

  const selectGroup = (groupId: number) => {
    selectedGroupId.value = groupId
  }

  const getModelsData = async () => {
    try {
      const { data } = await modelStore.ListModelsByGroup()
      modelsData.value = data.mgs || []
      selectedGroupId.value = selectedGroup.value?.group_id ?? null
    } catch (error) {
      console.error("获取模型数据失败:", error)
      modelsData.value = []
      selectedGroupId.value = null
    }
  }

  const handleDeleteModelGroup = async (item: Models) => {
    if (!canDeleteModelGroup.value) return

    try {
      await ElMessageBox({
        title: "删除确认",
        message: h("p", null, [
          h("span", null, "正在删除模型分组: "),
          h("i", { style: "color: red" }, `${item.group_name}`),
          h("span", null, " 确认删除？")
        ]),
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })

      await deleteModelGroupApi(item.group_id)
      ElMessage.success("删除成功")

      if (selectedGroupId.value === item.group_id) {
        selectedGroupId.value = null
      }

      await getModelsData()
    } catch (error) {
      if (error !== "cancel" && error !== "close") {
        console.error("删除模型分组失败:", error)
      }
    }
  }

  const handleModelClick = (model: Model) => {
    if (!canViewModelDetail.value) return

    router.push({
      name: "ModelDetail",
      query: { id: String(model.id) }
    })
  }

  return {
    searchInput,
    modelStatus,
    modelsData,
    filterData,
    empty,
    selectedGroup,
    canViewModelDetail,
    canDeleteModelGroup,
    selectGroup,
    getModelsData,
    handleDeleteModelGroup,
    handleModelClick
  }
}
