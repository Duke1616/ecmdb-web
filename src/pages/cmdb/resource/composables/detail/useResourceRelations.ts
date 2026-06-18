import { computed, h, nextTick, onMounted, reactive, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ListAttributeFieldApi } from "@/api/cmdb/attribute"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import {
  ListModelRelationApi,
  ListRelatedAssetsApi,
  ListRelationTypeApi,
  deleteResourceRelationApi
} from "@/api/cmdb/relation"
import type { ListRelationTypeData, ModelRelation, relatedAssetsData } from "@/api/cmdb/relation/types/relation"
import { findSecureData, listResourceByIdsApi } from "@/api/cmdb/resource"
import type { Resource } from "@/api/cmdb/resource/types/resource"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { useModelStore } from "@/pinia/stores/model"
import type { Column } from "@@/components/DataTable/types"

type UseResourceRelationsOptions = {
  modelUid: string
  resourceId: string
}

const sameIds = (a: number[], b: number[]) => {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((id, index) => id === b[index])
}

export const useResourceRelations = (options: UseResourceRelationsOptions) => {
  const modelStore = useModelStore()
  const { hasPermission } = usePermission()

  const dialogVisible = ref(false)
  const relationTypeData = ref<ListRelationTypeData[]>([])
  const modelRelationData = ref<ModelRelation[]>([])
  const assetsData = ref<relatedAssetsData[]>([])
  const activeRelationName = ref("")
  const attributeFieldsData = ref<Attribute[]>([])
  const deletingRelationIds = ref<Set<number>>(new Set())
  const secureDisplay = reactive(new Map<number, boolean>())
  const displayMap = reactive(new Map<string, string>())

  const canAddRelation = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.RelationAdd))
  const canDeleteRelation = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.RelationDelete))
  const canGetSecure = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.GetSecure))

  const displayFields = computed(() => {
    return attributeFieldsData.value
      .filter((field) => field.display === true)
      .sort((a, b) => (a.index || 100) - (b.index || 100))
  })

  const activeRelationData = computed(() => {
    return assetsData.value?.find((item) => item.relation_name === activeRelationName.value)
  })

  const relatedResourceIds = computed(() => {
    return activeRelationData.value?.resources?.map((resource: Resource) => resource.id) || []
  })

  const getRelatedModelUidByRelationName = (relationName: string) => {
    const relation = modelRelationData.value.find((item) => item.relation_name === relationName)
    if (relation) {
      return relation.source_model_uid === options.modelUid ? relation.target_model_uid : relation.source_model_uid
    }

    const [sourceModelUid, , targetModelUid] = relationName.split("_")
    return sourceModelUid === options.modelUid ? targetModelUid : sourceModelUid
  }

  const buildCompleteAssetsData = (data: relatedAssetsData[]) => {
    const assetsMap = new Map(data.map((item) => [item.relation_name, item]))

    return modelRelationData.value.map((relation) => {
      const existing = assetsMap.get(relation.relation_name)
      if (existing) {
        return existing
      }

      return {
        relation_name: relation.relation_name,
        model_uid: getRelatedModelUidByRelationName(relation.relation_name),
        total: 0,
        resource_ids: [],
        resources: [],
        display_field: []
      }
    })
  }

  const openAddDialog = () => {
    if (!canAddRelation.value) return
    dialogVisible.value = true
  }

  const closeDialog = () => {
    dialogVisible.value = false
  }

  const handleRelationCreated = () => {
    listRelatedAssetsData()
  }

  const listRelationTypes = () => {
    ListRelationTypeApi({ offset: 0, limit: 100 })
      .then(({ data }) => {
        relationTypeData.value = data.relation_types
      })
      .catch(() => {
        relationTypeData.value = []
      })
  }

  const listModelRelations = () => {
    ListModelRelationApi({
      offset: 0,
      limit: 100,
      model_uid: options.modelUid
    })
      .then(({ data }) => {
        modelRelationData.value = data.model_relations

        nextTick(() => {
          modelStore.getByModelUids([
            ...new Set(modelRelationData.value.flatMap((item) => [item.source_model_uid, item.target_model_uid]))
          ])
          listRelationTypes()
        })
      })
      .catch(() => {
        modelRelationData.value = []
      })
  }

  const setDisplayMap = (model: ModelRelation) => {
    if (!model.display_label) return

    const separatorIndex = model.display_label.indexOf("-")
    const prefix = separatorIndex !== -1 ? model.display_label.substring(0, separatorIndex) : model.display_label
    const suffix = separatorIndex !== -1 ? model.display_label.substring(separatorIndex + 1) : ""
    const resolvedSuffix = suffix ? modelStore.getModelName(suffix) || suffix : ""
    displayMap.set(model.relation_name, resolvedSuffix ? `${prefix}-${resolvedSuffix}` : prefix)
  }

  const rebuildRelationLabels = () => {
    displayMap.clear()
    if (!modelRelationData.value.length) return

    modelRelationData.value.forEach((model) => {
      const relationInfo = relationTypeData.value.find((item) =>
        model.relation_type_uid.toLowerCase().includes(item.uid)
      )
      if (!relationInfo) return

      const sourceModelUid = model.relation_name.split("_")[0]
      model.display_label =
        sourceModelUid === options.modelUid
          ? `${relationInfo.target_describe}-${model.target_model_uid}`
          : `${relationInfo.source_describe}-${model.source_model_uid}`

      setDisplayMap(model)
    })
  }

  const mergeRelatedAssets = (existingData: relatedAssetsData[], newData: relatedAssetsData[]) => {
    const mergedData: relatedAssetsData[] = []
    const changedData: relatedAssetsData[] = []
    const newRelationNames = new Set(newData.map((item) => item.relation_name))

    existingData.forEach((existingItem) => {
      const newItem = newData.find((item) => item.relation_name === existingItem.relation_name)
      if (!newItem) {
        changedData.push({ ...existingItem })
        return
      }

      if (!sameIds(existingItem.resource_ids, newItem.resource_ids)) {
        changedData.push(newItem)
      }
      mergedData.push({ ...existingItem, ...newItem })
    })

    newData.forEach((newItem) => {
      if (!existingData.some((item) => item.relation_name === newItem.relation_name)) {
        mergedData.push(newItem)
        changedData.push(newItem)
      }
    })

    return {
      mergedData: mergedData.filter((item) => newRelationNames.has(item.relation_name)),
      changedData
    }
  }

  const updateActivePanelData = async (changedAssetsData: relatedAssetsData[]) => {
    if (!activeRelationName.value) return

    const activeItem = changedAssetsData.find((item) => item.relation_name === activeRelationName.value)
    if (activeItem) {
      await listResourceByIds(activeItem.relation_name, activeItem.model_uid, activeItem.resource_ids)
    }
  }

  const listRelatedAssetsData = async () => {
    await ListRelatedAssetsApi({
      model_uid: options.modelUid,
      resource_id: parseInt(options.resourceId, 10)
    })
      .then(async ({ data }) => {
        const nextAssets = buildCompleteAssetsData(data)
        let changedAssets: relatedAssetsData[] = nextAssets

        if (assetsData.value.length) {
          const { mergedData, changedData } = mergeRelatedAssets(assetsData.value, nextAssets)
          assetsData.value = mergedData
          changedAssets = changedData
        } else {
          assetsData.value = nextAssets
        }

        if (changedAssets.length > 0) {
          await updateActivePanelData(changedAssets)
        }

        if (!activeRelationName.value && assetsData.value.length) {
          selectRelation(assetsData.value[0].relation_name)
        }
      })
      .catch(() => {
        assetsData.value = []
      })
  }

  const listResourceByIds = async (relationName: string, modelUid: string, resourceIds: number[]) => {
    if (!resourceIds.length) {
      assetsData.value?.forEach((item) => {
        if (item.relation_name === relationName) {
          item.resources = []
        }
      })
      return
    }

    await listResourceByIdsApi(modelUid, resourceIds)
      .then(({ data }) => {
        assetsData.value?.forEach((item) => {
          if (item.relation_name === relationName) {
            item.resources = data.resources
          }
        })
      })
      .catch(() => {
        ElMessage.error("获取关联资产失败")
      })
  }

  const listAttributeFields = async (modelUid: string) => {
    await ListAttributeFieldApi(modelUid)
      .then(({ data }) => {
        attributeFieldsData.value = data.attribute_fields
      })
      .catch(() => {
        attributeFieldsData.value = []
      })
  }

  const selectRelation = (relationName: string) => {
    activeRelationName.value = relationName

    const relationItem = assetsData.value?.find((item) => item.relation_name === relationName)
    if (!relationItem) return

    listAttributeFields(relationItem.model_uid)
    listResourceByIds(relationItem.relation_name, relationItem.model_uid, relationItem.resource_ids)
  }

  const parseFieldValue = (field: Attribute, value: any) => {
    if (!value) return "暂无数据"
    if (field.secure || field.link) return value

    switch (field.field_type) {
      case "relation":
      case "foreign_key":
        return modelStore.getModelName(value) || value
      case "select":
      case "list":
        if (Array.isArray(field.option)) {
          const option = field.option.find((opt: any) => opt.value === value || opt.id === value)
          return option ? option.label || option.name || option.value : value
        }
        return value
      default:
        return value
    }
  }

  const resourceTableColumns = computed<Column[]>(() => {
    return displayFields.value.map((field) => ({
      prop: `data.${field.field_uid}`,
      label: field.field_name,
      align: "center",
      slot: field.secure || field.link ? field.field_uid : undefined,
      showOverflowTooltip: true,
      formatter: (row: Resource) => parseFieldValue(field, row.data[field.field_uid])
    }))
  })

  const resourceTableActions = computed(() => {
    if (!canDeleteRelation.value) return []

    return [
      {
        key: "delete",
        label: "取消关联",
        type: "danger" as const,
        size: "small" as const,
        loading: (row: Resource) => deletingRelationIds.value.has(row.id),
        disabled: (row: Resource) => deletingRelationIds.value.has(row.id)
      }
    ]
  })

  const deleteRelation = (relationName: string, row: Resource) => {
    if (!canDeleteRelation.value) return
    if (deletingRelationIds.value.has(row.id)) return

    ElMessageBox({
      title: "取消关联",
      message: h("p", null, [
        h("span", null, "正在删除关联数据名称: "),
        h("i", { style: "color: red" }, `${row.name}`),
        h("span", null, " 确认取消？")
      ]),
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(() => {
      const modelUid = row.model_uid || activeRelationData.value?.model_uid
      if (!modelUid) {
        ElMessage.error("无法确定关联模型，取消关联失败")
        return
      }

      deletingRelationIds.value.add(row.id)

      deleteResourceRelationApi({
        resource_id: row.id,
        relation_name: relationName,
        model_uid: modelUid
      })
        .then(() => {
          ElMessage.success("删除成功")
          listRelatedAssetsData()
        })
        .finally(() => {
          deletingRelationIds.value.delete(row.id)
        })
    })
  }

  const handleResourceTableAction = (key: string, row: Resource) => {
    if (key === "delete") {
      deleteRelation(activeRelationName.value, row)
    }
  }

  const handleSecureClick = (row: Resource, item: Attribute) => {
    if (!canGetSecure.value) {
      ElMessage.warning("暂无查看加密字段权限")
      return
    }

    findSecureData({
      id: row.id,
      field_uid: item.field_uid
    }).then((data) => {
      row.data[item.field_uid] = data.data
      secureDisplay.set(row.id, true)
    })
  }

  const openNewPage = (url: string) => {
    if (url) window.open(url, "_blank")
  }

  onMounted(listModelRelations)

  watch([modelRelationData, relationTypeData], ([newModelRelations, newRelationTypes]) => {
    if (newModelRelations.length > 0 && newRelationTypes.length > 0) {
      rebuildRelationLabels()
      listRelatedAssetsData()
    }
  })

  return {
    activeRelationData,
    activeRelationName,
    assetsData,
    canAddRelation,
    dialogVisible,
    displayFields,
    displayMap,
    modelRelationData,
    relatedResourceIds,
    relationTypeData,
    resourceTableActions,
    resourceTableColumns,
    secureDisplay,
    closeDialog,
    handleRelationCreated,
    handleResourceTableAction,
    handleSecureClick,
    listRelatedAssetsData,
    openAddDialog,
    openNewPage,
    parseFieldValue,
    selectRelation
  }
}
