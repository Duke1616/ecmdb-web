import { ref, computed } from "vue"
import type { templateCombination, template } from "@/api/ticket/template/types/template"
import type { Ref } from "vue"

export type TemplateCategoryKey = number | "all" | "favorites" | "recent"

export function useTemplateFilter(
  templateCombinations: Ref<templateCombination[]>,
  favoriteTemplates: Ref<template[]>
) {
  const selectedCategory = ref<TemplateCategoryKey>("all")
  const searchQuery = ref("")

  /** 拉平后的全量模板，用于“全部工单”和搜索 */
  const allTemplates = computed(() => {
    return templateCombinations.value.flatMap((item) => item.templates || [])
  })

  const getSelectedCategoryName = () => {
    if (selectedCategory.value === "favorites") return "我的收藏"
    if (selectedCategory.value === "recent") return "最近使用"
    if (selectedCategory.value === "all") return "全部工单模板"
    const category = templateCombinations.value.find((item) => item.id === selectedCategory.value)
    return category ? category.name : ""
  }

  const filteredTemplates = computed(() => {
    let source: template[] = []

    // 1. 获取基础数据源（全部/收藏/特定分类）
    if (selectedCategory.value === "all") {
      source = allTemplates.value
    } else if (selectedCategory.value === "favorites") {
      source = favoriteTemplates.value
    } else if (selectedCategory.value === "recent") {
      source = []
    } else {
      // 通过 ID 查找特定分类下的模板
      const category = templateCombinations.value.find((item) => item.id === selectedCategory.value)
      source = category?.templates || []
    }

    // 2. 按搜索关键字过滤
    const query = searchQuery.value.trim().toLowerCase()
    if (query) {
      return source.filter((t) => t.name?.toLowerCase().includes(query))
    }

    return source
  })

  return {
    selectedCategory,
    searchQuery,
    getSelectedCategoryName,
    filteredTemplates,
    allTemplates
  }
}
