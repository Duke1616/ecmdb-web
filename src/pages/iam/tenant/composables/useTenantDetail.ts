import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { getTenantDetailApi, deleteTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import dayjs from "dayjs"

export function useTenantDetail() {
  const route = useRoute()
  const tenantInfo = ref<Tenant>()
  const loading = ref(false)
  const { handleConfirmAction, handleCopy } = useGovernanceActions()

  const fetchTenantDetail = async () => {
    const id = Number(route.query.id)
    if (!id) return

    loading.value = true
    try {
      const res = await getTenantDetailApi(id)
      tenantInfo.value = res.data
    } catch (err: any) {
      ElMessage.error(err.message || "获取租户详情失败")
    } finally {
      loading.value = false
    }
  }

  const handleDelete = () => {
    if (!tenantInfo.value) return
    handleConfirmAction({
      message: `确定要永久删除租户 "${tenantInfo.value.name}" 吗？此操作不可逆。`,
      api: () => deleteTenantApi(tenantInfo.value!.id),
      onSuccess: () => window.history.back(),
      successMsg: "租户空间已成功销毁"
    })
  }

  const copyText = (text: string) => {
    handleCopy(text, "租户信息")
  }

  const formatTimestamp = (ts: string | number) => {
    if (!ts) return "-"
    return dayjs(Number(ts)).format("YYYY-MM-DD HH:mm:ss")
  }

  watch(
    () => route.query.id,
    () => fetchTenantDetail()
  )

  onMounted(() => {
    fetchTenantDetail()
  })

  return {
    tenantInfo,
    loading,
    handleDelete,
    copyText,
    formatTimestamp
  }
}
