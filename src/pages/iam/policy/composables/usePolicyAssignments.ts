import { watch, type Ref, toValue } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { listAuthorizationsApi } from "@/api/iam/permission"
import { batchDetachPolicyApi } from "@/api/iam/policy"
import type { Authorization, AuthorizationQueryReq } from "@/api/iam/permission/type"
import { useGovernanceRelationList } from "@/common/composables/useGovernanceRelationList"
import { useGovernanceActions } from "@/common/composables/useGovernanceActions"
import { getSubjectDetailRoute } from "@/pages/iam/authorization/utils/subject"

interface PolicyAssignmentsOptions {
  canDetach?: Ref<boolean> | (() => boolean)
  canBatchDetach?: Ref<boolean> | (() => boolean)
}

/**
 * 策略授权管理逻辑封装
 */
export function usePolicyAssignments(policyCode: Ref<string>, options: PolicyAssignmentsOptions = {}) {
  const router = useRouter()
  const { handleConfirmAction } = useGovernanceActions()

  // 1. 集成治理列表能力
  const relation = useGovernanceRelationList<Authorization, AuthorizationQueryReq>({
    fetchApi: (params) =>
      listAuthorizationsApi({
        ...params,
        keyword: params.keyword || toValue(policyCode)
      }),
    listKey: "authorizations",
    initialQuery: {
      keyword: "",
      sub_type: undefined,
      obj_type: undefined
    }
  })

  // 监听 PolicyCode 变化刷新
  watch(
    () => toValue(policyCode),
    () => relation.refresh(),
    { immediate: true }
  )

  /** 跳转到主体详情 */
  const handleSubjectClick = (row: Authorization) => {
    const route = getSubjectDetailRoute(row)
    if (route) router.push(route)
  }

  const toDetachAssignment = (item: Authorization) => ({
    sub_type: item.sub_type,
    sub_code: item.subject,
    policy_code: item.target
  })

  // 移除单一权限
  const handleRemove = (row: Authorization) => {
    const canDetach = typeof options.canDetach === "function" ? options.canDetach() : toValue(options.canDetach ?? true)
    if (!canDetach) {
      ElMessage.warning("当前账号无权移除授权")
      return
    }

    handleConfirmAction({
      title: "移除授权",
      message: `确定要移除对主体 [${row.subject}] 的授权吗？`,
      api: () =>
        batchDetachPolicyApi({
          assignments: [toDetachAssignment(row)]
        }),
      onSuccess: () => relation.refresh()
    })
  }

  // 批量移除权限
  const handleBatchRemove = () => {
    const count = relation.selectedRows.value.length
    if (count === 0) return
    const canBatchDetach =
      typeof options.canBatchDetach === "function" ? options.canBatchDetach() : toValue(options.canBatchDetach ?? true)
    if (!canBatchDetach) {
      ElMessage.warning("当前账号无权批量移除授权")
      return
    }

    handleConfirmAction({
      title: "批量移除授权",
      message: `确定要批量移除这 ${count} 项授权记录吗？此操作无法撤销。`,
      api: () =>
        batchDetachPolicyApi({
          assignments: relation.selectedRows.value.map(toDetachAssignment)
        }),
      onSuccess: () => relation.refresh()
    })
  }

  return {
    ...relation,
    handleSubjectClick,
    handleRemove,
    handleBatchRemove
  }
}
