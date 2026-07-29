import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSearchStore } from "./search"
import { useUserStore } from "./user"

vi.mock("./user", async () => {
  const { reactive } = await import("vue")
  const userStore = reactive({ currentTenantId: 0 })

  return { useUserStore: () => userStore }
})

describe("search store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useUserStore().currentTenantId = 0
  })

  it("按租户隔离搜索历史", () => {
    const userStore = useUserStore()
    const searchStore = useSearchStore()

    userStore.currentTenantId = 2
    searchStore.addHistorySearch("tenant-2-resource")

    userStore.currentTenantId = 3
    expect(searchStore.historySearchData).toEqual([])
    searchStore.addHistorySearch("tenant-3-resource")

    userStore.currentTenantId = 2
    expect(searchStore.historySearchData).toEqual(["tenant-2-resource"])

    userStore.currentTenantId = 3
    expect(searchStore.historySearchData).toEqual(["tenant-3-resource"])
  })

  it("只清除当前租户的搜索历史", () => {
    const userStore = useUserStore()
    const searchStore = useSearchStore()

    userStore.currentTenantId = 2
    searchStore.addHistorySearch("tenant-2-resource")
    userStore.currentTenantId = 3
    searchStore.addHistorySearch("tenant-3-resource")
    searchStore.clearHistorySearch()

    expect(searchStore.historySearchData).toEqual([])
    userStore.currentTenantId = 2
    expect(searchStore.historySearchData).toEqual(["tenant-2-resource"])
  })
})
