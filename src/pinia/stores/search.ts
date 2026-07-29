import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"

export const useSearchStore = defineStore(
  "search",
  () => {
    const userStore = useUserStore()
    const historySearchDataByTenant = ref<Record<string, string[]>>({})
    const tenantKey = computed(() => String(userStore.currentTenantId))
    const historySearchData = computed(() => historySearchDataByTenant.value[tenantKey.value] ?? [])

    const addHistorySearch = (data: string) => {
      const tenantHistory = historySearchDataByTenant.value[tenantKey.value] ?? []
      if (!tenantHistory.includes(data)) {
        historySearchDataByTenant.value[tenantKey.value] = [...tenantHistory, data]
      }
    }

    const clearHistorySearch = () => {
      delete historySearchDataByTenant.value[tenantKey.value]
    }

    return { addHistorySearch, historySearchData, historySearchDataByTenant, clearHistorySearch }
  },
  {
    persist: true
  }
)
