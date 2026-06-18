import { computed, onBeforeUnmount, ref, watch } from "vue"
import { listTemplateApi, listTemplateGroupSummaryApi } from "@/api/ticket/template"
import { findWorkflowByIdsApi } from "@/api/ticket/workflow/workflow"
import { usePagination } from "@/common/composables/usePagination"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import type { TemplateManageGroupKey } from "../types"

const SEARCH_DEBOUNCE_MS = 300

export function useTemplateList() {
  const { hasPermission } = usePermission()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const templatesData = ref<template[]>([])
  const templateGroups = ref<templateGroupSummary[]>([])
  const selectedGroup = ref<TemplateManageGroupKey>("all")
  const keyword = ref("")
  const loading = ref(false)
  const groupLoading = ref(false)
  const workflowMaps = ref(new Map<number, string>())
  const selectedTemplates = ref<template[]>([])
  let templateRequestId = 0

  const canViewTemplate = computed(() => hasPermission(TICKET_CAPABILITIES.Template.View))
  const totalTemplateCount = computed(() => templateGroups.value.reduce((total, group) => total + group.total, 0))

  const getTemplateListParams = () => ({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    group_id: selectedGroup.value === "all" ? undefined : selectedGroup.value,
    keyword: keyword.value.trim() || undefined
  })

  const getMissingWorkflowIds = (templates: template[]) => {
    const ids = new Set<number>()
    templates.forEach((item) => {
      if (item.workflow_id && !workflowMaps.value.has(item.workflow_id)) ids.add(item.workflow_id)
    })
    return Array.from(ids)
  }

  const resetList = () => {
    templatesData.value = []
    paginationData.total = 0
  }

  const listTemplateGroupsData = async () => {
    if (!canViewTemplate.value) {
      templateGroups.value = []
      return false
    }

    groupLoading.value = true
    try {
      const { data } = await listTemplateGroupSummaryApi()
      templateGroups.value = data.template_groups

      if (selectedGroup.value !== "all" && !data.template_groups.some((group) => group.id === selectedGroup.value)) {
        selectedGroup.value = "all"
        return true
      }
    } catch {
      templateGroups.value = []
    } finally {
      groupLoading.value = false
    }

    return false
  }

  const listTemplatesData = async () => {
    if (!canViewTemplate.value) {
      resetList()
      return
    }

    const requestId = ++templateRequestId
    loading.value = true
    try {
      const { data } = await listTemplateApi(getTemplateListParams())
      if (requestId !== templateRequestId) return

      paginationData.total = data.total
      templatesData.value = data.templates
      await loadWorkflowNames(data.templates)
    } catch {
      if (requestId !== templateRequestId) return
      resetList()
    } finally {
      if (requestId === templateRequestId) loading.value = false
    }
  }

  const refreshTemplateManageData = async () => {
    const groupChanged = await listTemplateGroupsData()
    if (groupChanged) return

    if (paginationData.currentPage === 1) {
      await listTemplatesData()
      return
    }
    paginationData.currentPage = 1
  }

  const formatWorkflow = (row: template) => {
    if (!row.workflow_id) return "-"
    return workflowMaps.value.get(row.workflow_id) || `流程 #${row.workflow_id}`
  }

  const loadWorkflowNames = async (templates: template[]) => {
    const ids = getMissingWorkflowIds(templates)
    if (ids.length === 0) return

    const nextMap = new Map(workflowMaps.value)

    try {
      const { data } = await findWorkflowByIdsApi(ids)
      const workflowNameMap = new Map(data.workflows.map((workflow) => [workflow.id, workflow.name]))
      ids.forEach((id) => nextMap.set(id, workflowNameMap.get(id) || `流程 #${id}`))
    } catch {
      ids.forEach((id) => nextMap.set(id, `流程 #${id}`))
    }

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

  let keywordTimer: number | undefined
  watch(keyword, () => {
    selectedTemplates.value = []
    window.clearTimeout(keywordTimer)
    keywordTimer = window.setTimeout(() => {
      if (paginationData.currentPage === 1) {
        listTemplatesData()
        return
      }
      paginationData.currentPage = 1
    }, SEARCH_DEBOUNCE_MS)
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

  onBeforeUnmount(() => {
    window.clearTimeout(keywordTimer)
  })

  return {
    templatesData,
    templateGroups,
    selectedGroup,
    keyword,
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
