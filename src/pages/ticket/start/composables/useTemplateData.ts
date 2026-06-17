import { ref, computed, onMounted } from "vue"
import { pipelineGroupApi, listFavoriteApi, toggleFavoriteApi } from "@/api/ticket/template"
import type { templateCombination, template } from "@/api/ticket/template/types/template"
import { ElMessage } from "element-plus"

export function useTemplateData(options: { immediate?: boolean; canFavorite?: () => boolean } = {}) {
  const templateCombinations = ref<templateCombination[]>([])
  const favoriteTemplates = ref<template[]>([])
  const favoriteIds = computed(() => favoriteTemplates.value.map((t) => t.id))
  const empty = ref<boolean>(false)
  const loading = ref<boolean>(false)

  const listTemplateCombinations = async () => {
    loading.value = true
    try {
      const { data } = await pipelineGroupApi()
      templateCombinations.value = data.template_combinations || []
      empty.value = templateCombinations.value.length === 0
    } catch (error) {
      console.error("获取模板数据失败:", error)
      templateCombinations.value = []
      empty.value = true
    } finally {
      loading.value = false
    }
  }

  const fetchFavoriteList = async () => {
    try {
      const { data } = await listFavoriteApi()
      favoriteTemplates.value = data?.templates || []
    } catch (error) {
      console.error("同步收藏列表失败:", error)
      favoriteTemplates.value = []
    }
  }

  const toggleFavorite = async (id: number, e: Event) => {
    e.stopPropagation()
    if (options.canFavorite && !options.canFavorite()) {
      ElMessage.warning("暂无收藏模板权限")
      return
    }

    const isAdding = !favoriteIds.value.includes(id)
    let targetTemplate: template | null = null

    // 乐观更新
    if (isAdding) {
      // 可以在缓存的数据组合中查找该模板的完整数据并塞进去
      for (const group of templateCombinations.value) {
        const found = group.templates?.find((t) => t.id === id)
        if (found) {
          targetTemplate = found
          break
        }
      }
      if (targetTemplate) {
        favoriteTemplates.value.push(targetTemplate)
      } else {
        // 如果极少情况下找不到，就至少构造一个包含必要字段的临时对象
        targetTemplate = { id, name: "未知模板", icon: "Flag" } as template
        favoriteTemplates.value.push(targetTemplate)
      }
    } else {
      const favIndex = favoriteTemplates.value.findIndex((t) => t.id === id)
      if (favIndex !== -1) {
        targetTemplate = favoriteTemplates.value[favIndex]
        favoriteTemplates.value.splice(favIndex, 1)
      }
    }

    try {
      await toggleFavoriteApi({ template_id: id })
      ElMessage.success(isAdding ? "已加入收藏" : "已取消收藏")
    } catch (error) {
      // 失败回滚
      if (isAdding) {
        const rollbackIndex = favoriteTemplates.value.findIndex((t) => t.id === id)
        if (rollbackIndex !== -1) favoriteTemplates.value.splice(rollbackIndex, 1)
      } else {
        if (targetTemplate) {
          favoriteTemplates.value.push(targetTemplate)
        } else {
          fetchFavoriteList()
        }
      }
      ElMessage.error("收藏操作失败，请重试")
    }
  }

  const getTotalTemplateCount = () => {
    return templateCombinations.value.reduce((total, item) => total + item.templates.length, 0)
  }

  const refreshData = async () => {
    loading.value = true
    try {
      const tasks = [listTemplateCombinations()]
      if (!options.canFavorite || options.canFavorite()) {
        tasks.push(fetchFavoriteList())
      } else {
        favoriteTemplates.value = []
      }
      await Promise.all(tasks)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (options.immediate !== false) refreshData()
  })

  return {
    templateCombinations,
    favoriteTemplates,
    favoriteIds,
    empty,
    loading,
    listTemplateCombinations,
    toggleFavorite,
    getTotalTemplateCount,
    refreshData
  }
}
