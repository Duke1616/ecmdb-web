import { AuthorizationSubType, type Authorization } from "@/api/iam/permission/type"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

export const SUBJECT_TYPE_LABEL: Record<AuthorizationSubType, string> = {
  [AuthorizationSubType.USER]: "用户",
  [AuthorizationSubType.ROLE]: "角色",
  [AuthorizationSubType.GROUP]: "用户组"
}

export const SUBJECT_TYPE_FULL_LABEL: Record<AuthorizationSubType, string> = {
  [AuthorizationSubType.USER]: "IAM 用户",
  [AuthorizationSubType.ROLE]: "IAM 角色",
  [AuthorizationSubType.GROUP]: "IAM 用户组"
}

export const getSubjectTypeLabel = (type: AuthorizationSubType | string) => {
  return SUBJECT_TYPE_LABEL[type as AuthorizationSubType] || "主体"
}

export const getSubjectTypeFullLabel = (type: AuthorizationSubType | string) => {
  return SUBJECT_TYPE_FULL_LABEL[type as AuthorizationSubType] || "IAM 主体"
}

export const getSubjectDetailCapability = (type: AuthorizationSubType | string) => {
  if (type === AuthorizationSubType.USER) return IAM_CAPABILITIES.User.Detail
  if (type === AuthorizationSubType.ROLE) return IAM_CAPABILITIES.Role.Detail
  if (type === AuthorizationSubType.GROUP) return IAM_CAPABILITIES.Group.Detail
  return undefined
}

export const getSubjectDetailRoute = (row: Pick<Authorization, "sub_type" | "subject">) => {
  if (row.sub_type === AuthorizationSubType.USER) {
    return { name: "UserDetail", query: { username: row.subject } }
  }

  if (row.sub_type === AuthorizationSubType.ROLE) {
    return { name: "RoleDetail", query: { code: row.subject } }
  }

  if (row.sub_type === AuthorizationSubType.GROUP) {
    return { name: "GroupDetail", query: { code: row.subject } }
  }

  return undefined
}
