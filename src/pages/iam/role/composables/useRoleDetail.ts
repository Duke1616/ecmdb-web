import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import dayjs from "dayjs"
import { roleDetailApi, deleteRoleApi } from "@/api/iam/role"
import type { Role } from "@/api/iam/role/type"

export function useRoleDetail() {
  const route = useRoute()
  const roleInfo = ref<Role>()
  const loading = ref(false)

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
    ElMessageBox.confirm(`确定要注销角色 "${roleInfo.value.name}" 吗？此操作不可逆。`, "危险操作", {
      confirmButtonText: "确定注销",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger"
    }).then(async () => {
      try {
        await deleteRoleApi(roleInfo.value!.id)
        ElMessage.success("角色注销成功")
        window.history.back()
      } catch (err: any) {
        ElMessage.error(err.message || "操作失败")
      }
    })
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    ElMessage.success("内容已复制到剪贴板")
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
