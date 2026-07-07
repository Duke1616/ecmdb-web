import { computed, h, markRaw, nextTick, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Delete, Edit, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getModelAttributesWithGroupsApi } from "@/api/cmdb/attribute"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import { deleteResourceApi, findSecureData, listResourceApi } from "@/api/cmdb/resource"
import type { Resource } from "@/api/cmdb/resource/types/resource"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { useDataIO } from "@/common/composables/useDataIO"
import { usePagination } from "@/common/composables/usePagination"
import { usePermission } from "@/common/composables/usePermission"
import { createAttributeListView, type AttributeGroupView } from "@/common/utils/attribute"
import type { Column } from "@@/components/DataTable/types"
import { useResourcePluginActions } from "./useResourcePluginActions"

type ResourceFormExpose = {
  setForm: (resource: Resource) => void
  resetForm: () => void
  handleSubmit: () => void
}

type ResourceOperateItem = {
  name: string
  code: string
  type: "primary" | "warning" | "danger" | "info"
  icon: unknown
  capability?: string
}

const estimateActionLabelWidth = (label: string) => {
  const units = Array.from(label || "").reduce((sum, char) => {
    return sum + (/[\u4e00-\u9fa5]/.test(char) ? 1 : 0.62)
  }, 0)
  return units * 12
}

export const useResourceList = () => {
  const route = useRoute()
  const router = useRouter()
  const { hasPermission } = usePermission()
  const { exporting, exportTemplate } = useDataIO()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const { getPluginOperateItems, loadResourcePluginActions, isPluginActionCode, handlePluginAction } =
    useResourcePluginActions()

  const modelUid = computed(() => String(route.query.uid || ""))
  const modelName = computed(() => String(route.query.name || modelUid.value || "未命名模型"))
  const pageSubtitle = computed(() => `管理 ${modelName.value} 模型下的资产数据`)

  const attributeFiledsData = ref<Attribute[]>([])
  const attributeGroupsData = ref<AttributeGroupView[]>([])
  const displayFileds = ref<Attribute[]>([])
  const resourcesData = ref<Resource[]>([])
  const selectedResources = ref<Resource[]>([])

  const drawerVisible = ref(false)
  const importDialogVisible = ref(false)
  const exportDialogVisible = ref(false)
  const title = ref("")
  const apiRef = ref<ResourceFormExpose>()
  const tableLoading = ref(false)
  const attributesLoaded = ref(false)
  const initializing = ref(false)

  const canDeleteResource = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.Delete))
  const canGetSecure = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.GetSecure))
  const canEditCustomField = computed(() => hasPermission(CMDB_CAPABILITIES.Resource.EditCustomField))

  const exportFields = computed(() => {
    return attributeFiledsData.value
      .filter((attr) => attr.field_type !== "file")
      .map((attr) => ({
        id: attr.field_uid,
        name: attr.field_name,
        type: attr.field_type,
        options: attr.option
      }))
  })

  const selectedResourceIds = computed(() => selectedResources.value.map((resource) => resource.id))
  const currentResourceIds = computed(() => resourcesData.value.map((resource) => resource.id))
  const customCellFields = computed(() => {
    return displayFileds.value.filter((item) => item.secure || item.link || item.field_type === "file")
  })

  const tableColumns = computed<Column[]>(() => {
    return displayFileds.value.map((item) => {
      const useCustomCell = item.secure || item.link || item.field_type === "file"

      return {
        prop: `data.${item.field_uid}`,
        label: item.field_name,
        minWidth: 140,
        align: "center",
        showOverflowTooltip: !useCustomCell,
        slot: useCustomCell ? `data.${item.field_uid}` : undefined,
        formatter: (_row, _column, value) => {
          if (value === undefined || value === null || value === "") return "-"
          return String(value)
        }
      }
    })
  })

  const baseOperateBtnItems = computed<ResourceOperateItem[]>(() => {
    return [
      {
        name: "详情",
        code: "detail",
        type: "primary",
        icon: markRaw(View),
        capability: CMDB_CAPABILITIES.Resource.Detail
      },
      {
        name: "修改",
        code: "edit",
        type: "warning",
        icon: markRaw(Edit),
        capability: CMDB_CAPABILITIES.Resource.Edit
      },
      {
        name: "删除",
        code: "delete",
        type: "danger",
        icon: markRaw(Delete),
        capability: CMDB_CAPABILITIES.Resource.Delete
      }
    ]
  })

  const getOperateBtnItems = (row: Resource): ResourceOperateItem[] => {
    return [...getPluginOperateItems(row.id), ...baseOperateBtnItems.value]
  }

  const actionColumnWidth = computed(() => {
    const width = resourcesData.value.reduce((maxWidth, row) => {
      const visibleItems = getOperateBtnItems(row).slice(0, 2)
      if (visibleItems.length === 0) return maxWidth

      const buttonsWidth = visibleItems.reduce((sum, item) => {
        const iconWidth = item.icon ? 16 : 0
        const labelWidth = estimateActionLabelWidth(item.name)
        const horizontalPadding = 14
        return sum + iconWidth + labelWidth + horizontalPadding
      }, 0)

      const gapWidth = Math.max(visibleItems.length - 1, 0) * 10
      const moreButtonWidth = getOperateBtnItems(row).length > 2 ? 34 : 0
      const columnPadding = 24

      return Math.max(maxWidth, Math.ceil(buttonsWidth + gapWidth + moreButtonWidth + columnPadding))
    }, 180)

    return Math.min(Math.max(width, 180), 280)
  })

  const fetchAttributeFields = async () => {
    if (!modelUid.value) return null

    try {
      const { data } = await getModelAttributesWithGroupsApi(modelUid.value)
      return createAttributeListView(data)
    } catch (error) {
      console.error("获取资产字段失败:", error)
      return null
    }
  }

  const fetchResourceByModelUid = async () => {
    if (!modelUid.value) return { resources: [], total: 0 }

    try {
      const { data } = await listResourceApi({
        model_uid: modelUid.value,
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })
      return {
        resources: data.resources || [],
        total: data.total || 0
      }
    } catch (error) {
      console.error("获取资产列表失败:", error)
      return { resources: [], total: 0 }
    }
  }

  const applyAttributeView = (attributeView: Awaited<ReturnType<typeof fetchAttributeFields>>) => {
    if (!attributeView) {
      attributeFiledsData.value = []
      attributeGroupsData.value = []
      displayFileds.value = []
      attributesLoaded.value = false
      return
    }

    attributeFiledsData.value = attributeView.fields
    attributeGroupsData.value = attributeView.groups
    displayFileds.value = attributeView.displayFields
    attributesLoaded.value = true
  }

  const applyResourceData = async (data: Awaited<ReturnType<typeof fetchResourceByModelUid>>) => {
    resourcesData.value = data.resources
    paginationData.total = data.total
    await loadResourcePluginActions(data.resources)
  }

  const refreshPage = async () => {
    if (!modelUid.value) return

    tableLoading.value = true
    initializing.value = true

    try {
      const [schema, resources] = await Promise.all([fetchAttributeFields(), fetchResourceByModelUid()])
      applyAttributeView(schema)
      await applyResourceData(resources)
    } finally {
      tableLoading.value = false
      initializing.value = false
    }
  }

  const listResourceByModelUid = async () => {
    if (!modelUid.value) return

    tableLoading.value = true

    try {
      const resources = await fetchResourceByModelUid()
      await applyResourceData(resources)
    } finally {
      tableLoading.value = false
    }
  }

  const handleSelectionChange = (selection: Resource[]) => {
    selectedResources.value = selection
  }

  const handleExportTemplate = async () => {
    if (!modelUid.value) return
    if (!hasPermission(CMDB_CAPABILITIES.DataIO.ExportTemplate)) return
    await exportTemplate(modelUid.value, modelName.value)
  }

  const handleShowImportDialog = () => {
    if (!hasPermission(CMDB_CAPABILITIES.DataIO.Import)) return
    importDialogVisible.value = true
  }

  const handleShowExportDialog = () => {
    if (!hasPermission(CMDB_CAPABILITIES.DataIO.Export)) return
    exportDialogVisible.value = true
  }

  const handleImportSuccess = () => {
    listResourceByModelUid()
  }

  const openNewPage = (url: string) => {
    if (!url) return
    window.open(url, "_blank")
  }

  const handleDetailClick = (resource: Resource) => {
    if (!hasPermission(CMDB_CAPABILITIES.Resource.Detail)) return

    router.push({
      name: "AssetDetail",
      query: { model_uid: modelUid.value, id: resource.id, name: resource.name }
    })
  }

  const handleDelete = (row: Resource) => {
    if (!canDeleteResource.value) return

    ElMessageBox({
      title: "删除确认",
      message: h("p", null, [
        h("span", null, "正在删除名称: "),
        h("i", { style: "color: #ef4444" }, `${row.name}`),
        h("span", null, " 确认删除？")
      ]),
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(() => {
      deleteResourceApi(row.id).then(() => {
        ElMessage.success("删除成功")
        listResourceByModelUid()
      })
    })
  }

  const handleSecureClick = (row: Resource, item: Attribute) => {
    if (!canGetSecure.value) {
      ElMessage.warning("暂无查看加密字段权限")
      return
    }

    findSecureData({
      id: row.id,
      field_uid: item.field_uid
    }).then(({ data }) => {
      row.data[item.field_uid] = data
    })
  }

  const handleSecureDisplayChange = (row: Resource, item: Attribute, isDisplaying: boolean) => {
    row.data[`${item.field_uid}_secure_display`] = isDisplaying
  }

  const copySecureContent = async (content: string) => {
    if (!content) {
      ElMessage.warning("暂无可复制内容")
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      ElMessage.success("复制成功")
    } catch {
      ElMessage.error("复制失败")
    }
  }

  const handleUploadSuccess = () => {
    ElMessage.success("文件上传成功")
  }

  const handleUploadError = () => {
    ElMessage.error("上传失败")
  }

  const handleRemoveSuccess = () => {
    ElMessage.success("文件删除成功")
  }

  const handleRemoveError = () => {
    ElMessage.error("删除失败")
  }

  const handlePreview = () => undefined

  const handlerCreate = () => {
    if (!hasPermission(CMDB_CAPABILITIES.Resource.Add)) return

    title.value = "新增资产"
    drawerVisible.value = true
  }

  const handleUpdate = (row: Resource) => {
    if (!hasPermission(CMDB_CAPABILITIES.Resource.Edit)) return

    title.value = "修改资产"
    drawerVisible.value = true
    nextTick(() => {
      apiRef.value?.setForm(row)
    })
  }

  const handleOperateEvent = (row: Resource, action: string) => {
    if (isPluginActionCode(action)) {
      handlePluginAction(row, action)
      return
    }

    if (action === "detail") {
      handleDetailClick(row)
      return
    }

    if (action === "edit") {
      handleUpdate(row)
      return
    }

    if (action === "delete") {
      handleDelete(row)
    }
  }

  const onClosed = () => {
    apiRef.value?.resetForm()
    drawerVisible.value = false
  }

  const handleCreate = () => {
    apiRef.value?.handleSubmit()
  }

  const goBack = () => {
    router.back()
  }

  watch(
    () => modelUid.value,
    () => {
      if (initializing.value) return
      paginationData.currentPage = 1
      selectedResources.value = []
      attributesLoaded.value = false
      refreshPage()
    },
    { immediate: true }
  )

  watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
    if (attributesLoaded.value) listResourceByModelUid()
  })

  return {
    CMDB_CAPABILITIES,
    modelUid,
    modelName,
    pageSubtitle,
    attributeFiledsData,
    attributeGroupsData,
    displayFileds,
    resourcesData,
    drawerVisible,
    importDialogVisible,
    exportDialogVisible,
    title,
    apiRef,
    tableLoading,
    exporting,
    exportFields,
    customCellFields,
    selectedResources,
    selectedResourceIds,
    currentResourceIds,
    paginationData,
    tableColumns,
    actionColumnWidth,
    getOperateBtnItems,
    canDeleteResource,
    canEditCustomField,
    handleCurrentChange,
    handleSizeChange,
    refreshPage,
    listResourceByModelUid,
    handleSelectionChange,
    handleExportTemplate,
    handleShowImportDialog,
    handleShowExportDialog,
    handleImportSuccess,
    openNewPage,
    handleSecureClick,
    handleSecureDisplayChange,
    copySecureContent,
    handleUploadSuccess,
    handleUploadError,
    handleRemoveSuccess,
    handleRemoveError,
    handlePreview,
    handlerCreate,
    handleOperateEvent,
    onClosed,
    handleCreate,
    goBack
  }
}
