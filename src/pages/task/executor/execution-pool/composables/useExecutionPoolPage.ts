import { computed, onMounted, reactive, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@/common/composables/usePagination"
import { useUserStore } from "@/pinia/stores/user"
import { isSystemTenant } from "@/pages/alert/template/utils"
import { listTenantsApi, listTenantsByIdsApi } from "@/api/iam/tenant"
import {
  bindExecutionPoolAdminApi,
  disableExecutionPoolBindingAdminApi,
  enableExecutionPoolBindingAdminApi,
  listExecutionPoolBindingsAdminApi,
  listExecutionPoolsAdminApi,
  unbindExecutionPoolAdminApi
} from "@/api/task/pool"
import {
  ExecutionPoolBindingStatus,
  ExecutionPoolKind,
  type ExecutionPool,
  type ExecutionPoolBinding,
  type ListPoolsReq
} from "@/api/task/pool/type"
import type { Tenant } from "@/api/iam/user/type"
import type { BindForm, BindingFilters, PoolFilters, PoolHandler } from "../types"
import { normalizeTenantId } from "../utils"

const DEFAULT_HANDLER = "*"

export function useExecutionPoolPage() {
  const userStore = useUserStore()
  const poolLoading = ref(false)
  const bindingLoading = ref(false)
  const submitLoading = ref(false)
  const bindDialogBindingLoading = ref(false)
  const bindDialogVisible = ref(false)
  const pools = ref<ExecutionPool[]>([])
  const bindings = ref<ExecutionPoolBinding[]>([])
  const bindDialogBindings = ref<ExecutionPoolBinding[]>([])
  const bindDialogBindingError = ref(false)
  const tenantCache = ref(new Map<number, Tenant>())
  const selectedPoolName = ref("")
  const bootstrapped = ref(false)
  let poolRequestId = 0
  let bindingRequestId = 0
  let bindDialogBindingRequestId = 0
  const { paginationData: poolPagination } = usePagination()

  const poolFilters = reactive<PoolFilters>({
    kind: ExecutionPoolKind.Executor,
    dispatch_mode: "",
    status: ""
  })

  const bindingFilters = reactive<BindingFilters>({
    tenant_id: undefined,
    status: ""
  })

  const bindForm = reactive<BindForm>({
    tenant_id: undefined,
    pool_name: "",
    handler_names: [DEFAULT_HANDLER],
    desc: ""
  })

  const currentTenant = computed(() =>
    userStore.tenants.find((tenant) => Number(tenant.id) === Number(userStore.currentTenantId))
  )

  const currentTenantName = computed(() => {
    const tenant = currentTenant.value
    if (!tenant) return `租户 ${userStore.currentTenantId || "-"}`
    return `${tenant.name || tenant.code || "未命名空间"}（ID ${tenant.id}）`
  })

  const isSystemSpace = computed(() => isSystemTenant(userStore.currentTenantId, currentTenant.value))

  const systemTenant = computed(() => userStore.tenants.find((tenant) => isSystemTenant(tenant.id, tenant)))

  const tenantOptions = computed(() => {
    const tenantMap = new Map<number, Tenant>()
    userStore.tenants.forEach((tenant) => tenantMap.set(Number(tenant.id), tenant))
    tenantCache.value.forEach((tenant, id) => tenantMap.set(id, tenant))
    return Array.from(tenantMap.values())
  })

  const pageSubtitle = computed(() =>
    isSystemSpace.value ? "系统租户空间中的任务执行能力目录与租户授权" : "执行资源池是系统空间配置项"
  )

  const selectedPool = computed(() => pools.value.find((pool) => pool.name === selectedPoolName.value) || null)

  const selectedHandlers = computed(() => (selectedPool.value ? getPoolHandlers(selectedPool.value) : []))

  const buildPoolParams = (): ListPoolsReq => ({
    offset: (poolPagination.currentPage - 1) * poolPagination.pageSize,
    limit: poolPagination.pageSize,
    ...poolFilters
  })

  const getTenantName = (tenantId: number) => {
    const tenant = tenantOptions.value.find((item) => Number(item.id) === Number(tenantId))
    return tenant?.name || tenant?.code || `租户 ${tenantId}`
  }

  const getPoolHandlers = (pool: ExecutionPool): PoolHandler[] => {
    const raw = pool.metadata?.supported_handlers
    if (!raw) return []
    try {
      return JSON.parse(raw) as PoolHandler[]
    } catch {
      return []
    }
  }

  const cacheTenants = (tenants: Tenant[]) => {
    if (!tenants.length) return
    const nextCache = new Map(tenantCache.value)
    tenants.forEach((tenant) => nextCache.set(Number(tenant.id), tenant))
    tenantCache.value = nextCache
  }

  const resolveTenantsByIDs = async (tenantIds: Array<number | undefined>) => {
    const ids = Array.from(new Set(tenantIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)))
    const missingIds = ids.filter(
      (id) => !tenantCache.value.has(id) && !userStore.tenants.some((tenant) => Number(tenant.id) === Number(id))
    )
    if (!missingIds.length) return

    const { data } = await listTenantsByIdsApi({ ids: missingIds })
    const tenants = data.tenants || []
    cacheTenants(tenants)
  }

  const searchTenants = async (params: { keyword: string; offset: number; limit: number }) => {
    const { data } = await listTenantsApi(params)
    const tenants = data.tenants || []
    cacheTenants(tenants)
    return {
      total: data.total || 0,
      data: tenants
    }
  }

  const resolveTenant = async (tenantId: number) => {
    const localTenant = tenantOptions.value.find((tenant) => Number(tenant.id) === Number(tenantId))
    if (localTenant) return localTenant

    const { data } = await listTenantsByIdsApi({ ids: [tenantId] })
    const tenant = data.tenants?.[0] || null
    if (tenant) cacheTenants([tenant])
    return tenant
  }

  const loadBindings = async () => {
    const requestId = ++bindingRequestId
    if (!isSystemSpace.value || !selectedPoolName.value) {
      bindings.value = []
      bindingLoading.value = false
      return
    }

    const params = {
      tenant_id: normalizeTenantId(bindingFilters.tenant_id),
      pool_name: selectedPoolName.value,
      status: bindingFilters.status
    }
    bindingLoading.value = true
    try {
      const { data } = await listExecutionPoolBindingsAdminApi(params)
      if (requestId !== bindingRequestId || !isSystemSpace.value) return

      const nextBindings = data.bindings || []
      bindings.value = nextBindings
      await resolveTenantsByIDs(nextBindings.map((binding) => binding.tenant_id))
    } finally {
      if (requestId === bindingRequestId) {
        bindingLoading.value = false
      }
    }
  }

  const loadBindDialogBindings = async () => {
    const requestId = ++bindDialogBindingRequestId
    if (!isSystemSpace.value || !bindForm.pool_name) {
      bindDialogBindings.value = []
      bindDialogBindingError.value = false
      bindDialogBindingLoading.value = false
      return
    }

    bindDialogBindingError.value = false
    bindDialogBindingLoading.value = true
    try {
      const { data } = await listExecutionPoolBindingsAdminApi({
        pool_name: bindForm.pool_name
      })
      if (requestId === bindDialogBindingRequestId) {
        bindDialogBindings.value = data.bindings || []
        await resolveTenantsByIDs(bindDialogBindings.value.map((binding) => binding.tenant_id))
      }
    } catch {
      if (requestId === bindDialogBindingRequestId) {
        bindDialogBindings.value = []
        bindDialogBindingError.value = true
      }
    } finally {
      if (requestId === bindDialogBindingRequestId) {
        bindDialogBindingLoading.value = false
      }
    }
  }

  const loadPools = async () => {
    const requestId = ++poolRequestId
    if (!isSystemSpace.value) {
      poolLoading.value = false
      return
    }

    const params = buildPoolParams()
    poolLoading.value = true
    try {
      const { data } = await listExecutionPoolsAdminApi(params)
      if (requestId !== poolRequestId || !isSystemSpace.value) return

      pools.value = data.pools || []
      poolPagination.total = data.total || 0

      if (!pools.value.some((pool) => pool.name === selectedPoolName.value)) {
        selectedPoolName.value = pools.value[0]?.name || ""
      }

      await loadBindings()
    } finally {
      if (requestId === poolRequestId) {
        poolLoading.value = false
      }
    }
  }

  const reloadPools = () => {
    if (poolPagination.currentPage === 1) {
      loadPools()
      return
    }
    poolPagination.currentPage = 1
  }

  const handleRefresh = async () => {
    if (!isSystemSpace.value) return
    await loadPools()
  }

  const selectPool = (pool: ExecutionPool) => {
    if (selectedPoolName.value === pool.name) return
    selectedPoolName.value = pool.name
    loadBindings()
  }

  const openBindDialog = async () => {
    if (!selectedPool.value) return
    bindForm.tenant_id = bindingFilters.tenant_id
    bindForm.pool_name = selectedPool.value.name
    bindForm.handler_names = [DEFAULT_HANDLER]
    bindForm.desc = ""
    bindDialogVisible.value = true
  }

  const submitBind = async () => {
    if (bindDialogBindingError.value) {
      ElMessage.warning("授权数据加载失败，请重试后再保存")
      return
    }

    const tenantId = normalizeTenantId(bindForm.tenant_id)
    const handlerNames = normalizeHandlerNames(bindForm.handler_names)
    if (!tenantId || !bindForm.pool_name) {
      ElMessage.warning("请选择租户并确认资源池")
      return
    }
    if (!handlerNames.length) {
      ElMessage.warning("请选择 Handler")
      return
    }

    submitLoading.value = true
    try {
      await bindExecutionPoolAdminApi({
        tenant_id: tenantId,
        pool_name: bindForm.pool_name,
        handler_names: handlerNames,
        desc: bindForm.desc
      })
      ElMessage.success(handlerNames.length > 1 ? `已授权 ${handlerNames.length} 个 Handler` : "授权成功")
      bindDialogVisible.value = false
      loadBindings()
    } finally {
      submitLoading.value = false
    }
  }

  const normalizeHandlerNames = (handlerNames: string[]) => {
    const names = handlerNames.map((name) => name.trim()).filter(Boolean)
    if (!names.length) return []
    if (names.includes(DEFAULT_HANDLER)) return [DEFAULT_HANDLER]
    return Array.from(new Set(names))
  }

  const toggleBinding = async (row: ExecutionPoolBinding) => {
    const payload = {
      tenant_id: row.tenant_id,
      pool_name: row.pool_name,
      handler_name: row.handler_name || DEFAULT_HANDLER
    }

    if (row.status === ExecutionPoolBindingStatus.Enabled) {
      await disableExecutionPoolBindingAdminApi(payload)
    } else {
      await enableExecutionPoolBindingAdminApi(payload)
    }
    ElMessage.success("操作成功")
    loadBindings()
  }

  const unbind = async (row: ExecutionPoolBinding) => {
    await ElMessageBox.confirm(`确认解绑 ${row.pool_name} / ${row.handler_name || DEFAULT_HANDLER}？`, "解绑确认", {
      type: "warning"
    })
    await unbindExecutionPoolAdminApi({
      tenant_id: row.tenant_id,
      pool_name: row.pool_name,
      handler_name: row.handler_name || DEFAULT_HANDLER
    })
    ElMessage.success("解绑成功")
    loadBindings()
  }

  const switchToSystemTenant = () => {
    if (systemTenant.value) {
      userStore.switchTenant(systemTenant.value)
    }
  }

  watch(
    () => [poolPagination.currentPage, poolPagination.pageSize],
    () => {
      if (bootstrapped.value && isSystemSpace.value) loadPools()
    }
  )

  watch(isSystemSpace, async (value) => {
    if (!bootstrapped.value) return
    if (value) {
      await loadPools()
    } else {
      poolRequestId++
      bindingRequestId++
      bindDialogBindingRequestId++
      tenantCache.value = new Map()
      pools.value = []
      bindings.value = []
      bindDialogBindings.value = []
      bindDialogBindingError.value = false
      poolLoading.value = false
      bindingLoading.value = false
      bindDialogBindingLoading.value = false
      selectedPoolName.value = ""
    }
  })

  watch(
    () => [bindDialogVisible.value, bindForm.pool_name] as const,
    ([visible]) => {
      if (visible) {
        void loadBindDialogBindings()
      } else {
        bindDialogBindingRequestId++
        bindDialogBindings.value = []
        bindDialogBindingError.value = false
        bindDialogBindingLoading.value = false
      }
    }
  )

  onMounted(async () => {
    bootstrapped.value = true
    if (isSystemSpace.value) {
      await loadPools()
    }
  })

  return {
    poolLoading,
    bindingLoading,
    submitLoading,
    bindDialogBindingLoading,
    bindDialogBindingError,
    bindDialogVisible,
    pools,
    bindings,
    bindDialogBindings,
    selectedPoolName,
    poolPagination,
    poolFilters,
    bindingFilters,
    bindForm,
    currentTenantName,
    isSystemSpace,
    systemTenant,
    tenantOptions,
    pageSubtitle,
    selectedPool,
    selectedHandlers,
    searchTenants,
    resolveTenant,
    loadBindDialogBindings,
    getTenantName,
    getPoolHandlers,
    loadBindings,
    reloadPools,
    handleRefresh,
    selectPool,
    openBindDialog,
    submitBind,
    toggleBinding,
    unbind,
    switchToSystemTenant
  }
}
