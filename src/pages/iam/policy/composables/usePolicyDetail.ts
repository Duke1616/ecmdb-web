import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { ElMessage } from "element-plus"
import { getPolicyDetailApi } from "@/api/iam/policy"
import type { Policy, ServiceSummary } from "@/api/iam/policy/type"

export function usePolicyDetail() {
  const route = useRoute()
  const policy = ref<Policy | null>(null)
  const services = ref<ServiceSummary[]>([])
  const loading = ref(false)

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
    navigator.clipboard.writeText(text)
    ElMessage.success("内容已复制到剪贴板")
  }

  onMounted(() => {
    fetchDetail()
  })

  return {
    policy,
    services,
    loading,
    copyText
  }
}
