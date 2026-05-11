/**
 * 全局权限能力字典 (Identity & Governance Capability Map)
 * 用于前端强类型权限判定，避免硬编码字符串导致的维护困难。
 */
export const Auth = {
  /** 租户治理相关 */
  Tenant: {
    /** 查看我的租户列表 */
    ViewMine: "iam:tenant:view_mine",
    /** 切换租户上下文 */
    Switch: "iam:tenant:switch",
    /** 查看租户成员列表 */
    ViewMembers: "iam:tenant:view_members",
    /** 移除租户成员 */
    RemoveMember: "iam:tenant:remove_member",
    /** 租户分派成员 */
    Assign: "iam:tenant:assign"
  },

  /** 邀请管理相关 */
  Invitation: {
    /** 查看邀请链接列表 */
    View: "iam:policy:view"
  },

  /** 身份策略与授权相关 */
  Policy: {
    /** 查看权限策略 */
    View: "iam:policy:view",
    /** 编辑权限策略 */
    Edit: "iam:policy:edit",
    /** 新增权限策略 */
    Add: "iam:policy:add",
    /** 绑定策略到主体 */
    Attach: "iam:policy:attach",
    /** 删除权限策略 */
    Delete: "iam:policy:delete"
  },

  /** 角色管理相关 */
  Role: {
    /** 查看角色列表 */
    View: "iam:role:view",
    /** 编辑角色 */
    Edit: "iam:role:edit",
    /** 分配角色 */
    Assign: "iam:role:assign"
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
  },

  /** 用户治理相关 */
  User: {
    /** 查看用户列表 */
    View: "iam:user:view",
    /** 编辑用户资料 */
    Edit: "iam:user:edit",
    /** 获取用户详情 */
    Get: "iam:user:get",
    /** 管理外部身份绑定 */
    ManageIdentity: "iam:user:manage_identity"
  }
} as const

/** 权限常量类型定义 */
export type AuthType = typeof Auth
