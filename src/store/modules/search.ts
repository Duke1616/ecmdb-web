import { defineStore } from "pinia"
import { ref } from "vue"

export const useSearchStore = defineStore(
  "search",
  () => {
    const historySearchData = ref<string[]>([])

    const addHistorySearch = (data: string) => {
      historySearchData.value.push(data)
    }

    const clearHistorySearch = () => {
      historySearchData.value = []
    }

    return { addHistorySearch, historySearchData, clearHistorySearch }
  },
  {
    persist: true
  }
)
