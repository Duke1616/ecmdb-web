/**
 * 全局权限能力字典 (Identity & Governance Capability Map)
 * 用于前端强类型权限判定，避免硬编码字符串导致的维护困难。
 */
export const IAM_CAPABILITIES = {
  /** 租户治理相关 */
  Tenant: {
    /** 查看我的租户列表 */
    ViewMine: "iam:tenant:view_mine",
    /** 切换租户上下文 */
    Switch: "iam:tenant:switch",
    /** 查看租户详情 */
    Detail: "iam:tenant:get",
    /** 新增租户空间 */
    Add: "iam:tenant:add",
    /** 编辑租户资料 */
    Edit: "iam:tenant:edit",
    /** 销毁租户空间 */
    Delete: "iam:tenant:delete",
    /** 批量销毁租户空间 */
    BatchDelete: "iam:tenant:batch_delete",
    /** 查看租户成员列表 */
    ViewMembers: "iam:tenant:view_members",
    /** 租户分派成员 */
    Assign: "iam:tenant:assign",
    /** 批量分派租户 */
    BatchAssign: "iam:tenant:batch_assign",
    /** 移除租户分配 (单条) */
    Unassign: "iam:tenant:unassign",
    /** 批量移除租户分配 */
    BatchUnassign: "iam:tenant:batch_unassign"
  },

  /** 邀请管理相关 */
  Invitation: {
    /** 查看邀请链接列表 */
    View: "iam:invitation:view",
    /** 查看待审批申请列表 */
    ViewRequests: "iam:invitation:view_requests",
    /** 处理加入申请 (审批/拒绝) */
    Handle: "iam:invitation:handle_request",
    /** 创建邀请链接/凭证 */
    Add: "iam:invitation:add",
    /** 撤回/销毁邀请链接 */
    Revoke: "iam:invitation:delete",
    /** 批量撤回邀请链接 */
    BatchRevoke: "iam:invitation:batch_delete"
  },

  Permission: {
    /** 查看授权关系列表 */
    ViewAuthorizations: "iam:permission:view_authorizations"
  },

  /** 身份策略与授权相关 */
  Policy: {
    /** 查看权限策略 */
    View: "iam:policy:view",
    /** 查看策略详情 */
    Detail: "iam:policy:get",
    /** 编辑权限策略 */
    Edit: "iam:policy:edit",
    /** 新增权限策略 */
    Add: "iam:policy:add",
    /** 绑定策略到主体 (单条) */
    Attach: "iam:policy:attach",
    /** 批量绑定策略 */
    BatchAttach: "iam:policy:batch_attach",
    /** 解除策略关联 (单条) */
    Detach: "iam:policy:detach",
    /** 批量解除策略关联 */
    BatchDetach: "iam:policy:batch_detach",
    /** 删除权限策略定义 */
    Delete: "iam:policy:delete",
    /** 批量删除权限策略定义 */
    BatchDelete: "iam:policy:batch_delete"
  },

  /** 角色管理相关 */
  Role: {
    /** 查看角色列表 */
    View: "iam:role:view",
    /** 编辑角色 */
    Edit: "iam:role:edit",
    /** 获取角色详情 */
    Detail: "iam:role:get",
    /** 分配角色到用户 (单条) */
    Assign: "iam:role:assign",
    /** 批量分配角色 */
    BatchAssign: "iam:role:batch_assign",
    /** 移除用户角色关联 (单条) */
    Unassign: "iam:role:unassign",
    /** 内联角色分析 */
    InlineAnalysis: "iam:role:analysis",
    /** 批量移除用户角色 */
    BatchUnassign: "iam:role:batch_unassign",
    /** 添加父角色 */
    AddParent: "iam:role:add_parent",
    /** 移除父角色 */
    RemoveParent: "iam:role:remove_parent",
    /** 获取父角色 */
    ViewParents: "iam:role:view_parents",
    /** 查看角色成员 */
    ViewRoleMembers: "iam:role:view_role_members",
    /** 查看角色策略 */
    ViewRolePolicies: "iam:role:view_role_policies",
    /** 删除角色 */
    Delete: "iam:role:delete",
    /** 批量删除角色 */
    BatchDelete: "iam:role:batch_delete",
    /** 新增角色 */
    Add: "iam:role:add"
  },

  /** 用户治理相关 */
  User: {
    /** 查看用户列表 */
    View: "iam:user:view",
    /** 新增用户 */
    Add: "iam:user:add",
    /** 编辑用户资料 */
    Edit: "iam:user:edit",
    /** 获取用户详情 */
    Detail: "iam:user:get",
    /** 注销/删除用户 */
    Delete: "iam:user:delete",
    /** 批量删除用户 */
    BatchDelete: "iam:user:batch_delete",
    /** 重置密码 */
    ResetPassword: "iam:user:reset_password",
    /** 查询用户角色 */
    ViewUserRoles: "iam:user:view_user_roles",
    /** 查询用户策略 */
    ViewUserPolicies: "iam:user:view_user_policies",
    /** 查询用户租户 */
    ViewUserTenants: "iam:user:view_user_tenants",
    /** 管理外部身份绑定 */
    ManageIdentity: "iam:user:manage_identity",
    /** 解绑外部身份 */
    UnbindIdentity: "iam:user:unbind_identity"
  },

  /** 身份源管理相关 */
  IdentitySource: {
    /** 查看身份源 */
    View: "iam:identity_source:view",
    /** 保存/编辑身份源 */
    Save: "iam:identity_source:save",
    /** 删除身份源 */
    Delete: "iam:identity_source:delete",
    /** 启用/禁用身份源 */
    Toggle: "iam:identity_source:toggle"
  }
} as const

/** 权限常量类型定义 */
export type AuthType = typeof IAM_CAPABILITIES
