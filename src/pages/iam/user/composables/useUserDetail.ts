import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { userDetailApi, deleteUserApi } from "@/api/iam/user"
import type { User, Tenant } from "@/api/iam/user/type"
import dayjs from "dayjs"

export function useUserDetail() {
  const route = useRoute()
  const router = useRouter()

  // 1. 既然日志显示返回的是 User 对象，我们直接以 User 类型存储
  const rawData = ref<User>()
  const loading = ref(true)
  const editVisible = ref(false)

  // 2. 这里的 userInfo 直接指向 rawData 即可
  const userInfo = computed<User | undefined>(() => rawData.value)
  // 3. 租户列表如果接口没返回，暂时默认为空
  const userTenants = ref<Tenant[]>([])

  const loadDetail = async (targetId?: string | number) => {
    const rawId = targetId || route.params.id || route.params.userId

    if (!rawId) {
      loading.value = false
      return
    }

    const id = Number(rawId)
    loading.value = true
    try {
      // 注意：这里强制转换为 any 获取，因为 API 定义里的 UserData 可能已经失效
      const { data }: any = await userDetailApi(id)
      console.log("[useUserDetail] Load success (Flattened):", data)

      // 兼容性处理：如果后端返回的是 { user: {...} } 则取 data.user，否则直接取 data
      rawData.value = data.user ? data.user : data

      // 如果有 tenants 字段也顺便存下来
      if (data.tenants) {
        userTenants.value = data.tenants
      }
    } catch (err: any) {
      console.error("[useUserDetail] Load failed:", err)
      ElMessage.error(err?.message || "获取用户详情失败")
    } finally {
      loading.value = false
    }
  }

  watch(
    () => route.params.id || route.params.userId,
    (newId) => {
      // 确保 newId 是字符串而非 string[]
      const id = Array.isArray(newId) ? newId[0] : newId
      if (id) loadDetail(id)
    }
  )

  const handleDelete = () => {
    const target = userInfo.value
    if (!target) return

    ElMessageBox.confirm(`确定要注销主体 "${target.nickname || target.username}" 吗？`, "治理风险确认", {
      confirmButtonText: "注销",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger"
    }).then(async () => {
      await deleteUserApi(target.id)
      ElMessage.success("主体已注销")
      router.push("/identity/user")
    })
  }

  const handleEdit = () => {
    editVisible.value = true
  }

  const handleEditSuccess = () => {
    editVisible.value = false
    loadDetail()
  }

  const formatTimestamp = (ts: number | string) => {
    if (!ts) return "-"
    return dayjs(Number(ts)).format("YYYY-MM-DD HH:mm:ss")
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    ElMessage.success({ message: "已复制", duration: 800 })
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
