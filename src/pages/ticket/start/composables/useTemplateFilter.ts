import { ref } from "vue"

export type TemplateCategoryKey = number | "all" | "favorites" | "recent"

export function useTemplateFilter() {
  const selectedCategory = ref<TemplateCategoryKey>("all")
  const searchQuery = ref("")

  return {
    selectedCategory,
    searchQuery
  }
}
