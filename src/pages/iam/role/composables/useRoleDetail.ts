import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { roleDetailApi, deleteRoleApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import dayjs from "dayjs"

export function useRoleDetail() {
  const route = useRoute()
  const roleInfo = ref<Role>()
  const loading = ref(false)
  const { handleConfirmAction, handleCopy } = useGovernanceActions()

  const fetchRoleDetail = async () => {
    const code = (route.query.id || route.query.code) as string
    if (!code) return

    loading.value = true
    try {
      const res = await roleDetailApi(code)
      roleInfo.value = res.data
    } catch (err: any) {
      ElMessage.error(err.message || "获取角色详情失败")
    } finally {
      loading.value = false
    }
  }

  const handleDelete = () => {
    if (!roleInfo.value) return
    handleConfirmAction({
      message: `确定要注销角色 "${roleInfo.value.name}" 吗？此操作不可逆。`,
      api: () => deleteRoleApi(roleInfo.value!.id),
      onSuccess: () => window.history.back(),
      successMsg: "角色已成功注销"
    })
  }

  const copyText = (text: string) => {
    handleCopy(text, "角色信息")
  }

  const formatTimestamp = (ts: string | number) => {
    if (!ts) return "-"
    return dayjs(Number(ts)).format("YYYY-MM-DD HH:mm:ss")
  }

  watch(
    () => [route.query.id, route.query.code],
    () => fetchRoleDetail()
  )

  onMounted(() => {
    fetchRoleDetail()
  })

  return {
    roleInfo,
    loading,
    handleDelete,
    copyText,
    formatTimestamp
  }
}
