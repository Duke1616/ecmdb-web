import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { getTenantDetailApi, deleteTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { useTenantScope } from "@/common/composables/useTenantScope"
import { formatTimestamp } from "@@/utils/day"

export function useTenantDetail() {
  const route = useRoute()
  const router = useRouter()

  // 🌟 锁死本租户详情页生命周期内的租户作用域，消除全局 URL 嗅探的歧义风险！
  useTenantScope(() => {
    const id = route.query.id
    return id ? Number(id) : undefined
  })
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
      onSuccess: () => router.back(),
      successMsg: "租户空间已成功销毁"
    })
  }

  const copyText = (text: string) => {
    handleCopy(text, "租户信息")
  }

  // 使用 immediate: true 替代 onMounted + watch
  watch(
    () => route.query.id,
    () => fetchTenantDetail(),
    { immediate: true }
  )

  return {
    tenantInfo,
    loading,
    handleDelete,
    copyText,
    formatTimestamp,
    fetchTenantDetail
  }
}
