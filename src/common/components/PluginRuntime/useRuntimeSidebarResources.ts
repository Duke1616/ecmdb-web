import { computed, ref, watch, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { detailResourceApi, listResourceApi } from "@/api/cmdb/resource"
import type { Resource } from "@/api/cmdb/resource/types/resource"
import type {
  PluginRuntimePresentation,
  PluginRuntimeSidebar,
  PluginRuntimeSidebarResource
} from "@/api/cmdb/plugin/types/plugin"

export function useRuntimeSidebarResources(presentation: Ref<PluginRuntimePresentation | null | undefined>) {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const keyword = ref("")
  const resources = ref<Resource[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const sidebarCollapsed = ref(false)
  const requestVersion = ref(0)

  const resourceId = computed(() => String(route.query.resource_id || ""))
  const sidebar = computed<PluginRuntimeSidebar | null>(() => presentation.value?.sidebar || null)
  const resourceConfig = computed<PluginRuntimeSidebarResource | null>(() => sidebar.value?.resource || null)
  const sidebarEnabled = computed(() => {
    if (!sidebar.value || !resourceConfig.value?.model_uid) return false
    return sidebar.value.enabled === true
  })
  const sidebarTitle = computed(() => sidebar.value?.title || presentation.value?.title || "资源列表")
  const sidebarSearchPlaceholder = computed(() => sidebar.value?.search_placeholder ?? "搜索资源名称或 ID")
  const sidebarEmptyText = computed(() => sidebar.value?.empty_text ?? "暂无资源数据")
  const sidebarCollapsible = computed(() => sidebar.value?.collapsible ?? true)
  const sidebarLimit = computed(() => resourceConfig.value?.limit ?? 20)
  const showPagination = computed(() => !sidebarCollapsed.value && sidebarEnabled.value && total.value > sidebarLimit.value)

  const getNestedValue = (value: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], value)
  }

  const getFieldValue = (resource: Resource, field?: string) => {
    if (!field) return undefined
    if (field.includes(".")) return getNestedValue(resource, field)

    if (field in resource) {
      return (resource as Record<string, any>)[field]
    }
    return resource.data?.[field]
  }

  const getTitle = (resource: Resource) => {
    const configuredValue = getFieldValue(resource, resourceConfig.value?.title_field)
    if (configuredValue !== undefined && configuredValue !== null && configuredValue !== "") {
      return String(configuredValue)
    }
    return resource.name || `资源 ${resource.id}`
  }

  const getSubtitle = (resource: Resource) => {
    const configuredField = resourceConfig.value?.subtitle_field
    const configuredValue = getFieldValue(resource, configuredField)
    if (configuredValue !== undefined && configuredValue !== null && configuredValue !== "") {
      return String(configuredValue)
    }
    return `ID ${resource.id}`
  }

  const searchFields = computed(() => {
    const configuredFields = resourceConfig.value?.search_fields || []
    const fields = [...configuredFields]

    if (resourceConfig.value?.title_field) fields.push(resourceConfig.value.title_field)
    if (resourceConfig.value?.subtitle_field) fields.push(resourceConfig.value.subtitle_field)
    fields.push("name", "id")

    return [...new Set(fields.filter(Boolean))]
  })

  const filteredResources = computed(() => {
    const text = keyword.value.trim().toLowerCase()
    if (!text) return resources.value

    return resources.value.filter((item) => {
      return searchFields.value.some((field) => {
        const value = getFieldValue(item, field)
        if (value === undefined || value === null) return false
        return String(value).toLowerCase().includes(text)
      })
    })
  })

  const ensureSelectedResource = async () => {
    if (!sidebarEnabled.value || !resourceConfig.value?.model_uid) return

    const id = Number(resourceId.value)
    if (!Number.isFinite(id) || id <= 0) return

    const exists = resources.value.some((item) => item.id === id)
    if (exists) return

    try {
      const { data } = await detailResourceApi({
        id,
        model_uid: resourceConfig.value.model_uid
      })

      if (!data) return
      resources.value = [data, ...resources.value.filter((item) => item.id !== data.id)]
    } catch (error) {
      console.error("补充插件当前资源失败:", error)
    }
  }

  const fetchResources = async () => {
    if (!sidebarEnabled.value || !resourceConfig.value?.model_uid) {
      resources.value = []
      total.value = 0
      return
    }

    const version = requestVersion.value + 1
    requestVersion.value = version
    loading.value = true

    try {
      const { data } = await listResourceApi({
        model_uid: resourceConfig.value.model_uid,
        offset: (currentPage.value - 1) * sidebarLimit.value,
        limit: sidebarLimit.value
      })

      if (requestVersion.value !== version) return
      resources.value = data.resources || []
      total.value = data.total || resources.value.length
      await ensureSelectedResource()
    } catch (error) {
      if (requestVersion.value !== version) return
      console.error("获取插件侧边栏资源失败:", error)
      resources.value = []
      total.value = 0
    } finally {
      if (requestVersion.value === version) {
        loading.value = false
      }
    }
  }

  const handleResourceSelect = (resource: Resource) => {
    if (String(resource.id) === resourceId.value) return

    router.replace({
      path: route.path,
      query: {
        ...route.query,
        resource_id: String(resource.id)
      }
    })
  }

  const toggleSidebar = () => {
    if (!sidebarCollapsible.value) return
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  watch(
    () => [sidebarEnabled.value, resourceConfig.value?.model_uid, sidebarLimit.value],
    () => {
      keyword.value = ""
      total.value = 0
      currentPage.value = 1
    },
    { immediate: true }
  )

  watch(
    () => [currentPage.value, sidebarEnabled.value, resourceConfig.value?.model_uid, sidebarLimit.value],
    () => {
      void fetchResources()
    },
    { immediate: true }
  )

  watch(
    () => [resourceId.value, resourceConfig.value?.model_uid, sidebarEnabled.value],
    () => {
      void ensureSelectedResource()
    }
  )

  return {
    loading,
    keyword,
    filteredResources,
    total,
    currentPage,
    sidebarCollapsed,
    sidebarEnabled,
    sidebarTitle,
    sidebarSearchPlaceholder,
    sidebarEmptyText,
    sidebarCollapsible,
    sidebarLimit,
    showPagination,
    resourceId,
    getTitle,
    getSubtitle,
    handleResourceSelect,
    toggleSidebar
  }
}
