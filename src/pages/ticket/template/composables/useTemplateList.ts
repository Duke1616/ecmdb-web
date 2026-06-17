import { ref, watch } from "vue"
import { getTemplateGroupsByIdsApi, listTemplateApi } from "@/api/ticket/template"
import { usePagination } from "@/common/composables/usePagination"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { template } from "@/api/ticket/template/types/template"

export function useTemplateList() {
  const { hasPermission } = usePermission()
  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
  const templatesData = ref<template[]>([])
  const loading = ref(false)
  const groupMaps = ref(new Map<number, string>())
  const selectedTemplates = ref<template[]>([])

  const getTemplateGroupsData = async (ids: number[]) => {
    if (ids.length === 0) return

    try {
      const { data } = await getTemplateGroupsByIdsApi(ids)
      const nextMap = new Map(groupMaps.value)
      data.template_groups.forEach((node) => {
        nextMap.set(node.id, node.name)
      })
      groupMaps.value = nextMap
    } catch {
      // 分组名称加载失败时列表仍可展示。
    }
  }

  const listTemplatesData = async () => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.View)) {
      templatesData.value = []
      paginationData.total = 0
      return
    }

    loading.value = true
    try {
      const { data } = await listTemplateApi({
        offset: (paginationData.currentPage - 1) * paginationData.pageSize,
        limit: paginationData.pageSize
      })

      paginationData.total = data.total
      templatesData.value = data.templates

      const uniqueIds = data.templates.reduce<number[]>((ids, item) => {
        if (item.group_id && !ids.includes(item.group_id)) ids.push(item.group_id)
        return ids
      }, [])
      await getTemplateGroupsData(uniqueIds)
    } catch {
      templatesData.value = []
      paginationData.total = 0
    } finally {
      loading.value = false
    }
  }

  const formatGroup = (row: template) => groupMaps.value.get(row.group_id) || "未知组"

  const handleSelectionChange = (selection: template[]) => {
    selectedTemplates.value = selection
  }

  watch([() => paginationData.currentPage, () => paginationData.pageSize], listTemplatesData, { immediate: true })

  return {
    templatesData,
    selectedTemplates,
    loading,
    paginationData,
    listTemplatesData,
    formatGroup,
    handleSelectionChange,
    handleCurrentChange,
    handleSizeChange
  }
}
