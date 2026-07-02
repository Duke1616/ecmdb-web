import { computed, type Ref } from "vue"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import type { TemplateCategoryKey } from "./useTemplateFilter"

interface TemplateCatalogViewOptions {
  selectedCategory: Ref<TemplateCategoryKey>
  searchQuery: Ref<string>
  displayTemplates: Ref<template[]>
  recentTemplates: Ref<template[]>
  groups: Ref<templateGroupSummary[]>
  totalTemplateCount: Ref<number>
  templateResultTotal: Ref<number>
}

const filterByKeyword = (templates: template[], keyword: string) => {
  const query = keyword.trim().toLowerCase()
  if (!query) return templates
  return templates.filter((item) => item.name?.toLowerCase().includes(query))
}

export function useTemplateCatalogView(options: TemplateCatalogViewOptions) {
  const selectedCategoryName = computed(() => {
    if (options.selectedCategory.value === "favorites") return "我的收藏"
    if (options.selectedCategory.value === "recent") return "最近使用"
    if (options.selectedCategory.value === "all") return "全部工单模板"
    return options.groups.value.find((item) => item.id === options.selectedCategory.value)?.name || ""
  })

  const selectedCategorySubtitle = computed(() => {
    if (options.selectedCategory.value === "favorites") return "快速启动您常用的工单"
    if (options.selectedCategory.value === "recent") return "回到最近发起过的服务模板"
    if (options.searchQuery.value) return "根据关键字筛选可发起的工单模板"
    return "选择配置好的模板快速创建工单"
  })

  const emptyDescription = computed(() => {
    if (options.selectedCategory.value === "favorites" && !options.searchQuery.value) return "您还未收藏任何模板"
    if (options.selectedCategory.value === "recent" && !options.searchQuery.value) return "暂无最近使用的工单模板"
    return "没有找到匹配的工单模板"
  })

  const displayTemplates = computed(() => {
    if (options.selectedCategory.value === "favorites") {
      return filterByKeyword(options.displayTemplates.value, options.searchQuery.value)
    }

    if (options.selectedCategory.value === "recent") {
      return filterByKeyword(options.recentTemplates.value, options.searchQuery.value)
    }

    return options.displayTemplates.value
  })

  const visibleTemplateCount = computed(() => {
    if (options.selectedCategory.value === "all" && !options.searchQuery.value) return options.totalTemplateCount.value
    if (typeof options.selectedCategory.value === "number" || options.selectedCategory.value === "all") {
      return options.templateResultTotal.value
    }
    return displayTemplates.value.length
  })

  return {
    selectedCategoryName,
    selectedCategorySubtitle,
    emptyDescription,
    displayTemplates,
    visibleTemplateCount
  }
}
