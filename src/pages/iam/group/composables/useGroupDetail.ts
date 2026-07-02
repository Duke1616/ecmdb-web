import { ref, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { deleteGroupApi, groupDetailApi } from "@/api/iam/group"
import type { Group } from "@/api/iam/group/type"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { formatTimestamp } from "@@/utils/day"

export function useGroupDetail() {
  const route = useRoute()
  const router = useRouter()
  const groupInfo = ref<Group>()
  const loading = ref(false)
  const editVisible = ref(false)
  const { handleConfirmAction, handleCopy } = useGovernanceActions()

  const fetchGroupDetail = async () => {
    const code = (route.query.code || route.query.id) as string
    if (!code) return

    loading.value = true
    try {
      const { data } = await groupDetailApi(code)
      groupInfo.value = data
    } catch (err: any) {
      ElMessage.error(err.message || "获取用户组详情失败")
    } finally {
      loading.value = false
    }
  }

  const handleEdit = () => {
    editVisible.value = true
  }

  const handleEditSuccess = () => {
    editVisible.value = false
    fetchGroupDetail()
  }

  const handleDelete = () => {
    if (!groupInfo.value) return

    handleConfirmAction({
      message: `确定要删除用户组 "${groupInfo.value.name}" 吗？此操作不可逆。`,
      api: () => deleteGroupApi(groupInfo.value!.id),
      onSuccess: () => router.back(),
      successMsg: "用户组已成功删除"
    })
  }

  const copyText = (text: string) => {
    handleCopy(text, "用户组信息")
  }

  watch([() => route.query.code, () => route.query.id], () => fetchGroupDetail())

  onMounted(() => {
    fetchGroupDetail()
  })

  return {
    groupInfo,
    loading,
    editVisible,
    fetchGroupDetail,
    handleEdit,
    handleEditSuccess,
    handleDelete,
    copyText,
    formatTimestamp
  }
}
