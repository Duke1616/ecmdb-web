import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { getPolicyDetailApi } from "@/api/iam/policy"
import type { Policy, ServiceSummary } from "@/api/iam/policy/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

export function usePolicyDetail() {
  const route = useRoute()
  const policy = ref<Policy | null>(null)
  const services = ref<ServiceSummary[]>([])
  const loading = ref(false)
  const { handleConfirmAction, handleCopy } = useGovernanceActions()

  const fetchDetail = async () => {
    const code = route.query.code as string
    if (!code) return

    loading.value = true
    try {
      const res = await getPolicyDetailApi(code)
      policy.value = res.data.policy
      services.value = res.data.services
    } catch (err: any) {
      ElMessage.error(err.message || "获取策略详情失败")
    } finally {
      loading.value = false
    }
  }

  const copyText = (text: string) => {
    handleCopy(text, "策略信息")
  }

  const handleDelete = () => {
    if (!policy.value) return
    handleConfirmAction({
      message: `确定要永久删除策略 "${policy.value.name}" 吗？此操作不可逆。`,
      api: () => Promise.resolve(true), // TODO: 接入真实删除 API
      onSuccess: () => window.history.back(),
      successMsg: "策略已成功移除"
    })
  }

  onMounted(() => {
    fetchDetail()
  })

  return {
    policy,
    services,
    loading,
    copyText,
    handleDelete
  }
}
