import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue"
import {
  findByTemplateIdsApi,
  listFavoriteApi,
  listTemplateApi,
  listTemplateGroupSummaryApi,
  toggleFavoriteApi
} from "@/api/ticket/template"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import { ElMessage } from "element-plus"
import type { TemplateCategoryKey } from "./useTemplateFilter"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

interface UseTemplateDataOptions {
  immediate?: boolean
  canFavorite?: () => boolean
  selectedCategory: Ref<TemplateCategoryKey>
  searchQuery: Ref<string>
}

const shouldUseTemplateListApi = (category: TemplateCategoryKey) => typeof category === "number" || category === "all"

export function useTemplateData(options: UseTemplateDataOptions) {
  const templateGroups = ref<templateGroupSummary[]>([])
  const templatesData = ref<template[]>([])
  const favoriteTemplates = ref<template[]>([])
  const loading = ref(false)
  const groupLoading = ref(false)
  const templateLoading = ref(false)
  const paginationData = reactive({
    total: 0,
    currentPage: 1,
    pageSize: PAGE_SIZE
  })
  let templateRequestId = 0
  let keywordTimer: number | undefined

  const favoriteIds = computed(() => favoriteTemplates.value.map((item) => item.id))
  const totalTemplateCount = computed(() => templateGroups.value.reduce((total, item) => total + item.total, 0))
  const templateResultTotal = computed(() => paginationData.total)
  const hasMoreTemplates = computed(() => templatesData.value.length < paginationData.total)
  const empty = computed(() => !groupLoading.value && totalTemplateCount.value === 0)

  const resetTemplates = () => {
    templatesData.value = []
    paginationData.total = 0
    paginationData.currentPage = 1
  }

  const getTemplateListParams = () => ({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    group_id: typeof options.selectedCategory.value === "number" ? options.selectedCategory.value : undefined,
    keyword: options.searchQuery.value.trim() || undefined
  })

  const listTemplateGroups = async () => {
    groupLoading.value = true
    try {
      const { data } = await listTemplateGroupSummaryApi()
      templateGroups.value = data.template_groups || []

      if (
        typeof options.selectedCategory.value === "number" &&
        !templateGroups.value.some((group) => group.id === options.selectedCategory.value)
      ) {
        options.selectedCategory.value = "all"
      }
    } catch (error) {
      console.error("获取模板分组失败:", error)
      templateGroups.value = []
    } finally {
      groupLoading.value = false
    }
  }

  const fetchTemplates = async (reset = true) => {
    if (!shouldUseTemplateListApi(options.selectedCategory.value)) return

    if (reset) {
      templatesData.value = []
      paginationData.total = 0
      paginationData.currentPage = 1
    }

    const requestId = ++templateRequestId
    templateLoading.value = true
    try {
      const { data } = await listTemplateApi(getTemplateListParams())
      if (requestId !== templateRequestId) return

      paginationData.total = data.total || 0
      templatesData.value = reset ? data.templates || [] : [...templatesData.value, ...(data.templates || [])]
    } catch (error) {
      if (requestId !== templateRequestId) return
      console.error("获取模板数据失败:", error)
      if (reset) resetTemplates()
    } finally {
      if (requestId === templateRequestId) templateLoading.value = false
    }
  }

  const loadMoreTemplates = async () => {
    if (!shouldUseTemplateListApi(options.selectedCategory.value) || templateLoading.value || !hasMoreTemplates.value) {
      return
    }
    paginationData.currentPage += 1
    await fetchTemplates(false)
  }

  const fetchFavoriteList = async () => {
    if (options.canFavorite && !options.canFavorite()) {
      favoriteTemplates.value = []
      return
    }

    try {
      const { data } = await listFavoriteApi()
      favoriteTemplates.value = data?.templates || []
    } catch (error) {
      console.error("同步收藏列表失败:", error)
      favoriteTemplates.value = []
    }
  }

  const findTemplateInCache = (id: number) => {
    return templatesData.value.find((item) => item.id === id) || favoriteTemplates.value.find((item) => item.id === id)
  }

  const resolveTemplateById = async (id: number) => {
    const cachedTemplate = findTemplateInCache(id)
    if (cachedTemplate) return cachedTemplate

    try {
      const { data } = await findByTemplateIdsApi([id])
      return data.templates?.[0] || null
    } catch {
      return null
    }
  }

  const toggleFavorite = async (id: number, event: Event) => {
    event.stopPropagation()
    if (options.canFavorite && !options.canFavorite()) {
      ElMessage.warning("暂无收藏模板权限")
      return
    }

    const isAdding = !favoriteIds.value.includes(id)
    const targetTemplate = isAdding
      ? await resolveTemplateById(id)
      : favoriteTemplates.value.find((item) => item.id === id)

    if (isAdding) {
      favoriteTemplates.value.push(targetTemplate || ({ id, name: "未知模板", icon: "Flag" } as template))
    } else {
      favoriteTemplates.value = favoriteTemplates.value.filter((item) => item.id !== id)
    }

    try {
      await toggleFavoriteApi({ template_id: id })
      ElMessage.success(isAdding ? "已加入收藏" : "已取消收藏")
    } catch {
      if (isAdding) {
        favoriteTemplates.value = favoriteTemplates.value.filter((item) => item.id !== id)
      } else if (targetTemplate) {
        favoriteTemplates.value.push(targetTemplate)
      } else {
        fetchFavoriteList()
      }
      ElMessage.error("收藏操作失败，请重试")
    }
  }

  const refreshData = async () => {
    loading.value = true
    try {
      await Promise.all([listTemplateGroups(), fetchFavoriteList()])
      await fetchTemplates(true)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => options.selectedCategory.value,
    () => {
      if (shouldUseTemplateListApi(options.selectedCategory.value)) {
        fetchTemplates(true)
      }
    }
  )

  watch(
    () => options.searchQuery.value,
    () => {
      window.clearTimeout(keywordTimer)
      keywordTimer = window.setTimeout(() => {
        if (shouldUseTemplateListApi(options.selectedCategory.value)) {
          fetchTemplates(true)
        }
      }, SEARCH_DEBOUNCE_MS)
    }
  )

  onMounted(() => {
    if (options.immediate !== false) refreshData()
  })

  onBeforeUnmount(() => {
    window.clearTimeout(keywordTimer)
  })

  return {
    templateGroupSummaries: templateGroups,
    templatesData,
    favoriteTemplates,
    favoriteIds,
    totalTemplateCount,
    templateResultTotal,
    empty,
    loading,
    groupLoading,
    templateLoading,
    hasMoreTemplates,
    listTemplateGroups,
    fetchTemplates,
    loadMoreTemplates,
    toggleFavorite,
    refreshData
  }
}
