import { computed, onMounted, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Delete, Edit } from "@element-plus/icons-vue"
import { ListRelationTypeApi, ListModelRelationApi, DeleteModelRelationApi } from "@/api/cmdb/relation"
import type { ListRelationTypeData, ModelRelation } from "@/api/cmdb/relation/types/relation"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePagination } from "@/common/composables/usePagination"
import { useModelStore } from "@/pinia/stores/model"
import type { Column } from "@@/components/DataTable/types"

export const useModelRelations = (modelUid: string) => {
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const modelStore = useModelStore()

  const drawerVisible = ref(false)
  const activeRelation = ref<ModelRelation | null>(null)
  const relationTypeData = ref<ListRelationTypeData[]>([])
  const modelRelationData = ref<ModelRelation[]>([])

  const tableColumns: Column[] = [
    { prop: "relation_name", label: "唯一标识", align: "center", slot: "relation_name" },
    { prop: "source_model_uid", label: "源模型", align: "center", slot: "source_model_uid" },
    { prop: "target_model_uid", label: "目标模型", align: "center", slot: "target_model_uid" },
    { prop: "relation_type_uid", label: "关联类型", align: "center", slot: "relation_type_uid" },
    { prop: "mapping", label: "源→目标约束", align: "center", slot: "mapping" }
  ]

  const operateBtnItems = [
    { name: "修改", code: "edit", type: "primary", icon: Edit, capability: CMDB_CAPABILITIES.Model.RelationEdit },
    { name: "删除", code: "delete", type: "danger", icon: Delete, capability: CMDB_CAPABILITIES.Model.RelationDelete }
  ]

  const modelNameMap = computed(() => {
    const map = new Map<string, string>()
    modelStore.modelsData.forEach((group) => {
      ;(group.models || []).forEach((model) => {
        map.set(model.uid, model.name)
      })
    })
    return map
  })

  const getModelName = (uid: string) => modelNameMap.value.get(uid) || uid || "-"

  const fetchRelationTypes = async () => {
    try {
      const { data } = await ListRelationTypeApi({ offset: 0, limit: 100 })
      relationTypeData.value = Array.isArray(data.relation_types) ? data.relation_types : []
    } catch (error) {
      console.error("获取关联类型失败:", error)
      relationTypeData.value = []
    }
  }

  const fetchRelations = async () => {
    if (!modelUid) return

    try {
      const { data } = await ListModelRelationApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize,
        model_uid: modelUid
      })
      paginationData.total = data.total || 0
      modelRelationData.value = Array.isArray(data.model_relations) ? data.model_relations : []
    } catch (error) {
      console.error("获取模型关联失败:", error)
      modelRelationData.value = []
    }
  }

  const openCreateDrawer = () => {
    activeRelation.value = null
    drawerVisible.value = true
  }

  const openEditDrawer = (row: ModelRelation) => {
    activeRelation.value = row
    drawerVisible.value = true
  }

  const closeDrawer = () => {
    drawerVisible.value = false
    activeRelation.value = null
  }

  const handleDelete = async (row: ModelRelation) => {
    await ElMessageBox.confirm(`正在删除关联：${row.relation_name}，确认删除？`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await DeleteModelRelationApi(row.id)
    ElMessage.success("删除成功")
    await fetchRelations()
  }

  const handleOperateEvent = (row: ModelRelation, action: string) => {
    if (action === "edit") openEditDrawer(row)
    if (action === "delete") handleDelete(row)
  }

  watch([() => paginationData.currentPage, () => paginationData.pageSize], fetchRelations, { immediate: true })

  onMounted(fetchRelationTypes)

  return {
    paginationData,
    handleCurrentChange,
    handleSizeChange,
    drawerVisible,
    activeRelation,
    relationTypeData,
    modelRelationData,
    tableColumns,
    operateBtnItems,
    getModelName,
    fetchRelations,
    openCreateDrawer,
    closeDrawer,
    handleOperateEvent
  }
}
