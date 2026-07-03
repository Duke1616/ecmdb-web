import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { userDetailApi, deleteUserApi } from "@/api/iam/user"
import type { User, Tenant } from "@/api/iam/user/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { formatTimestamp } from "@@/utils/day"

export function useUserDetail() {
  const route = useRoute()
  const router = useRouter()
  const { handleConfirmAction, handleCopy } = useGovernanceActions()

  // 1. 既然日志显示返回的是 User 对象，我们直接以 User 类型存储
  const rawData = ref<User>()
  const loading = ref(true)
  const editVisible = ref(false)

  // 2. 这里的 userInfo 直接指向 rawData 即可
  const userInfo = computed<User | undefined>(() => rawData.value)
  // 3. 租户列表如果接口没返回，暂时默认为空
  const userTenants = ref<Tenant[]>([])

  const loadDetail = async (targetId?: string | number) => {
    const rawId = targetId || route.query.id || route.query.username || route.query.userId

    if (!rawId) {
      loading.value = false
      return
    }

    const isNumeric = !isNaN(Number(rawId))
    const params = isNumeric ? { id: Number(rawId) } : { username: String(rawId) }

    loading.value = true
    try {
      const { data } = await userDetailApi(params)
      rawData.value = data.user
      userTenants.value = data.tenants ?? []
    } catch (err: any) {
      console.error("[useUserDetail] Load failed:", err)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => route.query.id || route.query.username || route.query.userId,
    (newId) => {
      // 确保 newId 是字符串而非 string[]
      const id = Array.isArray(newId) ? newId[0] : newId
      if (id) loadDetail(id)
    }
  )

  const handleDelete = () => {
    const target = userInfo.value
    if (!target) return

    handleConfirmAction({
      message: `确定要注销主体 "${target.nickname || target.username}" 吗？此操作将移除该主体所有关联权限。`,
      api: () => deleteUserApi(target.id),
      onSuccess: () => router.back(),
      successMsg: "主体已成功注销"
    })
  }

  const handleEdit = () => {
    editVisible.value = true
  }

  const handleEditSuccess = () => {
    editVisible.value = false
    loadDetail()
  }

  const copyText = (text: string) => {
    handleCopy(text, "标识信息")
  }

  onMounted(() => {
    loadDetail()
  })

  return {
    userInfo,
    userTenants,
    loading,
    editVisible,
    loadDetail,
    handleDelete,
    handleEdit,
    handleEditSuccess,
    formatTimestamp,
    copyText
  }
}
