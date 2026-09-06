import { ref, computed } from "vue"
import { ElMessageBox, ElMessage } from "element-plus"
import {
  listOAuthClientsApi,
  deleteOAuthClientApi,
  resetOAuthClientSecretApi
} from "@/api/iam/idp"
import type { OAuthClient, ListOAuthClientReq } from "@/api/iam/idp/type"
import { useListManager } from "@/common/composables/useListManager"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"

export function useOAuthClientList() {
  // 1. 使用通用列表管理器拉取接入应用
  const {
    list: clients,
    total,
    loading,
    pagination,
    query,
    fetchList: loadData,
    handlePageChange: handleCurrentChange,
    handleSizeChange,
    handleSearch: handleRefresh
  } = useListManager<OAuthClient, ListOAuthClientReq>({
    fetchApi: listOAuthClientsApi,
    listKey: "clients",
    initialQuery: { keyword: "" }
  })

  // 2. 交互管理器
  const { handleConfirmAction } = useGovernanceActions()

  // 3. 表单弹窗状态
  const formVisible = ref(false)
  const currentEditId = ref<number | null>(null)

  // 4. 密钥明文展示弹窗状态（新建成功或重置密钥后触发）
  const secretDialogVisible = ref(false)
  const currentSecretInfo = ref<{
    clientName: string
    clientId: string
    clientSecret: string
  }>({
    clientName: "",
    clientId: "",
    clientSecret: ""
  })

  const handleCreate = () => {
    currentEditId.value = null
    formVisible.value = true
  }

  const handleEdit = (row: OAuthClient) => {
    currentEditId.value = row.id
    formVisible.value = true
  }

  const handleDelete = (row: OAuthClient) => {
    handleConfirmAction({
      title: "删除接入应用",
      message: `确定要注销接入应用 "${row.name} (${row.client_id})" 吗？注销后该系统将无法通过 EIAM 进行单点登录。`,
      api: () => deleteOAuthClientApi(row.id),
      onSuccess: loadData,
      successMsg: "接入应用已成功注销"
    })
  }

  /**
   * 重置客户端密钥 (Client Secret)
   */
  const handleResetSecret = (row: OAuthClient) => {
    ElMessageBox.confirm(
      `重置密钥后，原有的 Client Secret 将立即失效，可能导致接入系统（如 ${row.name}）单点登录中断，确定继续吗？`,
      "高危操作：重置客户端密钥",
      {
        confirmButtonText: "确认重置",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger"
      }
    ).then(async () => {
      try {
        const res = await resetOAuthClientSecretApi(row.id)
        currentSecretInfo.value = {
          clientName: row.name,
          clientId: row.client_id,
          clientSecret: res.data.client_secret
        }
        secretDialogVisible.value = true
        ElMessage.success("密钥重置成功")
      } catch (err: any) {
        ElMessage.error(err.message || "重置密钥失败")
      }
    }).catch(() => {})
  }

  /**
   * 表单提交成功回调
   */
  const handleFormSuccess = (createdClient?: OAuthClient) => {
    formVisible.value = false
    loadData()
    // 若创建返回了初始密钥，立即弹窗向管理员呈现明文
    if (createdClient?.client_secret) {
      currentSecretInfo.value = {
        clientName: createdClient.name,
        clientId: createdClient.client_id,
        clientSecret: createdClient.client_secret
      }
      secretDialogVisible.value = true
    }
  }

  return {
    clients,
    total,
    currentPage: computed(() => pagination.currentPage),
    pageSize: computed(() => pagination.pageSize),
    query,
    loading,
    formVisible,
    currentEditId,
    secretDialogVisible,
    currentSecretInfo,
    loadData,
    handleRefresh,
    handleCreate,
    handleEdit,
    handleDelete,
    handleResetSecret,
    handleFormSuccess,
    handleSizeChange,
    handleCurrentChange
  }
}
