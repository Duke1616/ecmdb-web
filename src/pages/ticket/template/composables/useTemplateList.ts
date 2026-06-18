import { computed, ref, watch } from "vue"
import { listTemplateApi, listTemplateGroupSummaryApi } from "@/api/ticket/template"
import { getWorkflowDetailApi } from "@/api/ticket/workflow/workflow"
import { usePagination } from "@/common/composables/usePagination"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import type { TemplateManageGroupKey } from "../types"

export function useTemplateList() {
  const { hasPermission } = usePermission()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const templatesData = ref<template[]>([])
  const templateGroups = ref<templateGroupSummary[]>([])
  const selectedGroup = ref<TemplateManageGroupKey>("all")
  const loading = ref(false)
  const groupLoading = ref(false)
  const workflowMaps = ref(new Map<number, string>())
  const selectedTemplates = ref<template[]>([])

  const canViewTemplate = computed(() => hasPermission(TICKET_CAPABILITIES.Template.View))
  const totalTemplateCount = computed(() => templateGroups.value.reduce((total, group) => total + group.total, 0))

  const resetList = () => {
    templatesData.value = []
    paginationData.total = 0
  }

  const listTemplateGroupsData = async () => {
    if (!canViewTemplate.value) {
      templateGroups.value = []
      return
    }

    groupLoading.value = true
    try {
      const { data } = await listTemplateGroupSummaryApi()
      templateGroups.value = data.template_groups

      if (selectedGroup.value !== "all" && !data.template_groups.some((group) => group.id === selectedGroup.value)) {
        selectedGroup.value = "all"
      }
    } catch {
      templateGroups.value = []
    } finally {
      groupLoading.value = false
    }
  }

  const listTemplatesData = async () => {
    if (!canViewTemplate.value) {
      resetList()
      return
    }

    loading.value = true
    try {
      const groupId = selectedGroup.value === "all" ? undefined : selectedGroup.value
      const { data } = await listTemplateApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize,
        group_id: groupId
      })

      paginationData.total = data.total
      templatesData.value = data.templates
      loadWorkflowNames(data.templates)
    } catch {
      resetList()
    } finally {
      loading.value = false
    }
  }

  const refreshTemplateManageData = async () => {
    await listTemplateGroupsData()
    await listTemplatesData()
  }

  const formatWorkflow = (row: template) => {
    if (!row.workflow_id) return "-"
    return workflowMaps.value.get(row.workflow_id) || `流程 #${row.workflow_id}`
  }

  const loadWorkflowNames = async (templates: template[]) => {
    const ids = templates.reduce<number[]>((nextIds, item) => {
      if (item.workflow_id && !workflowMaps.value.has(item.workflow_id) && !nextIds.includes(item.workflow_id)) {
        nextIds.push(item.workflow_id)
      }
      return nextIds
    }, [])

    if (ids.length === 0) return

    const results = await Promise.allSettled(ids.map((id) => getWorkflowDetailApi(id)))
    const nextMap = new Map(workflowMaps.value)

    results.forEach((result, index) => {
      const id = ids[index]
      if (result.status === "fulfilled") {
        nextMap.set(id, result.value.data.name || `流程 #${id}`)
      } else {
        nextMap.set(id, `流程 #${id}`)
      }
    })

    workflowMaps.value = nextMap
  }

  const handleSelectionChange = (selection: template[]) => {
    selectedTemplates.value = selection
  }

  watch(
    [() => paginationData.currentPage, () => paginationData.pageSize],
    () => {
      listTemplatesData()
    },
    { immediate: true }
  )

  watch(selectedGroup, () => {
    selectedTemplates.value = []
    if (paginationData.currentPage === 1) {
      listTemplatesData()
      return
    }
    paginationData.currentPage = 1
  })

  watch(
    canViewTemplate,
    (allowed) => {
      if (allowed) {
        listTemplateGroupsData()
      } else {
        templateGroups.value = []
        resetList()
      }
    },
    { immediate: true }
  )

  return {
    templatesData,
    templateGroups,
    selectedGroup,
    selectedTemplates,
    totalTemplateCount,
    loading,
    groupLoading,
    paginationData,
    listTemplatesData,
    listTemplateGroupsData,
    refreshTemplateManageData,
    formatWorkflow,
    handleSelectionChange,
    handleCurrentChange,
    handleSizeChange
  }
}
