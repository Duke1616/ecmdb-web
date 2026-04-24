import { ref, watch, toValue, type MaybeRefOrGetter } from "vue"
import { ElMessage } from "element-plus"
import { listTenantMembersApi, assignTenantUserApi } from "@/api/iam/tenant"
import type { TenantMember } from "@/api/iam/tenant/type"

export function useTenantGovernance(tenantId: MaybeRefOrGetter<number | undefined>) {
  const activeTab = ref("members")

  // --- 成员治理状态 ---
  const members = ref<TenantMember[]>([])
  const memberTotal = ref(0)
  const memberLoading = ref(false)
  const memberQuery = ref({
    currentPage: 1,
    pageSize: 10,
    keyword: ""
  })

  const fetchMembers = async () => {
    const tid = toValue(tenantId)
    if (!tid) return

    memberLoading.value = true
    try {
      const res = await listTenantMembersApi({
        tenant_id: tid,
        offset: (memberQuery.value.currentPage - 1) * memberQuery.value.pageSize,
        limit: memberQuery.value.pageSize,
        keyword: memberQuery.value.keyword
      })
      members.value = res.data.members || []
      memberTotal.value = res.data.total || 0
    } catch (err: any) {
      // 错误已由全局拦截器处理
    } finally {
      memberLoading.value = false
    }
  }

  const handleMemberPageChange = (page: number) => {
    memberQuery.value.currentPage = page
    fetchMembers()
  }

  const handleMemberSearch = (keyword: string) => {
    memberQuery.value.keyword = keyword
    memberQuery.value.currentPage = 1
    fetchMembers()
  }

  const assignConfirmLoading = ref(false)
  const handleBatchAssignMember = async (userIds: number[]) => {
    const tid = toValue(tenantId)
    if (!tid || userIds.length === 0) return

    assignConfirmLoading.value = true
    try {
      // 当前后端仅支持单次分配，前端模拟批量并行提交
      await Promise.all(
        userIds.map((uid) =>
          assignTenantUserApi({
            tenant_id: tid,
            user_id: uid
          })
        )
      )
      ElMessage.success(`成功分派 ${userIds.length} 位成员`)
      fetchMembers()
      return true
    } catch (err: any) {
      fetchMembers()
      return false
    } finally {
      assignConfirmLoading.value = false
    }
  }

  const handleAssignMember = async (userId: number) => {
    const tid = toValue(tenantId)
    if (!tid) return

    try {
      await assignTenantUserApi({
        tenant_id: tid,
        user_id: userId
      })
      ElMessage.success("成员分配成功")
      fetchMembers()
    } catch (err: any) {
      // 错误已由全局拦截器处理
    }
  }

  // --- 联动逻辑 ---
  watch(
    [() => activeTab.value, () => toValue(tenantId)],
    ([tab, id]) => {
      if (id && tab === "members") {
        fetchMembers()
      }
    },
    { immediate: true }
  )

  return {
    activeTab,
    // 成员
    members,
    memberTotal,
    memberLoading,
    memberQuery,
    assignConfirmLoading,
    handleMemberPageChange,
    handleMemberSearch,
    handleAssignMember,
    handleBatchAssignMember
  }
}
