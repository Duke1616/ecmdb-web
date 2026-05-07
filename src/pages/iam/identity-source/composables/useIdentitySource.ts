import { ref, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  listIdentitySourcesApi,
  deleteIdentitySourceApi,
  toggleIdentitySourceApi,
  getIdentitySourceDetailApi
} from "@/api/iam/identity-source"
import type { IdentitySourceVO } from "@/api/iam/identity-source/type"

/**
 * 认证管理逻辑封装
 */
export function useIdentitySource() {
  const loading = ref(false)
  const sources = ref<IdentitySourceVO[]>([])

  // 弹窗控制
  const formVisible = ref(false)
  const currentEditId = ref<number | string | null>(null)
  const editData = ref<IdentitySourceVO | null>(null)

  // 同步弹窗控制
  const syncVisible = ref(false)

  /**
   * 加载身份源列表
   */
  const handleRefresh = async () => {
    loading.value = true
    try {
      const res = await listIdentitySourcesApi()
      sources.value = res.data || []
    } catch (error) {
      console.error("加载身份源失败:", error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换启用状态
   */
  const handleToggleStatus = async (row: IdentitySourceVO) => {
    const nextStatus = !row.enabled
    const actionText = nextStatus ? "启用" : "禁用"

    try {
      await ElMessageBox.confirm(`确定要${actionText}身份源「${row.name}」吗？`, "状态切换", {
        confirmButtonText: `确定${actionText}`,
        cancelButtonText: "取消",
        type: nextStatus ? "success" : "warning"
      })

      loading.value = true
      // 使用专门的切换接口，无需构造完整对象
      await toggleIdentitySourceApi(row.id)
      ElMessage.success(`${actionText}成功`)
      handleRefresh()
    } catch (error) {
      if (error !== "cancel") {
        console.error("切换状态失败:", error)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 同步 LDAP 用户
   */
  const handleSyncUsers = () => {
    syncVisible.value = true
  }

  /**
   * 新增身份源
   */
  const handleCreate = () => {
    currentEditId.value = null
    editData.value = null
    formVisible.value = true
  }

  /**
   * 编辑身份源
   * @param row 身份源数据
   */
  const handleEdit = async (row: IdentitySourceVO) => {
    loading.value = true
    try {
      const res = await getIdentitySourceDetailApi(row.id)
      currentEditId.value = row.id
      editData.value = res.data
      formVisible.value = true
    } catch (error) {
      console.error("获取身份源详情失败:", error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除身份源
   * @param row 身份源数据
   */
  const handleDelete = async (row: IdentitySourceVO) => {
    try {
      await ElMessageBox.confirm(`确定要删除身份源「${row.name}」吗？删除后将无法使用该渠道登录。`, "风险提示", {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger"
      })

      await deleteIdentitySourceApi(row.id)
      ElMessage.success("删除成功")
      handleRefresh()
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除身份源失败:", error)
      }
    }
  }

  /**
   * 表单提交成功回调
   */
  const handleFormSuccess = () => {
    formVisible.value = false
    handleRefresh()
  }

  onMounted(() => {
    handleRefresh()
  })

  return {
    loading,
    sources,
    formVisible,
    syncVisible,
    currentEditId,
    editData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleSyncUsers,
    handleFormSuccess
  }
}
