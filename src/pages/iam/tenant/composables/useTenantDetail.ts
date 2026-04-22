import { ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import dayjs from "dayjs"
import { getTenantDetailApi, deleteTenantApi } from "@/api/iam/tenant"
import type { Tenant } from "@/api/iam/tenant/type"

export function useTenantDetail() {
  const route = useRoute()
  const tenantInfo = ref<Tenant>()
  const loading = ref(false)

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
    ElMessageBox.confirm(`确定要删除租户 "${tenantInfo.value.name}" 吗？此操作不可逆。`, "危险操作", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger"
    }).then(async () => {
      try {
        await deleteTenantApi(tenantInfo.value!.id)
        ElMessage.success("租户删除成功")
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
