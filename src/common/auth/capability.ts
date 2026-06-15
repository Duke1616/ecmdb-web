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

  /** 用户组治理相关 */
  Group: {
    /** 查看用户组列表 */
    View: "iam:group:view",
    /** 新增用户组 */
    Add: "iam:group:add",
    /** 编辑用户组 */
    Edit: "iam:group:edit",
    /** 获取用户组详情 */
    Detail: "iam:group:get",
    /** 删除用户组 */
    Delete: "iam:group:delete",
    /** 批量删除用户组 */
    BatchDelete: "iam:group:batch_delete",
    /** 查看用户组成员 */
    ViewMembers: "iam:group:view_members",
    /** 分配用户组成员 */
    AssignMembers: "iam:group:assign_members",
    /** 移除用户组成员 */
    RemoveMembers: "iam:group:remove_members",
    /** 查看用户组角色 */
    ViewRoles: "iam:group:view_roles",
    /** 绑定用户组角色 */
    AssignRole: "iam:group:assign_role",
    /** 解绑用户组角色 */
    RemoveRole: "iam:group:remove_role"
  },

  /** 部门管理相关 */
  Department: {
    /** 查看部门列表 */
    View: "iam:department:view",
    /** 新增部门 */
    Add: "iam:department:add",
    /** 编辑部门 */
    Edit: "iam:department:edit",
    /** 获取部门详情 */
    Detail: "iam:department:get",
    /** 删除部门 */
    Delete: "iam:department:delete",
    /** 分配成员 */
    Assign: "iam:department:assign",
    /** 移除成员 */
    Remove: "iam:department:remove",
    /** 查看部门成员 */
    ViewMembers: "iam:department:members"
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

export const CMDB_CAPABILITIES = {
  /** 模型管理相关 */
  Model: {
    /** 查看模型列表 */
    View: "cmdb:model:view",
    /** 模型详情 */
    Detail: "cmdb:model:get",
    /** 新增模型 (兼容旧有引用) */
    Create: "cmdb:model:add",
    /** 创建模型 */
    Add: "cmdb:model:add",
    /** 删除模型 */
    Delete: "cmdb:model:delete",
    /** 模型关联列表 */
    RelationView: "cmdb:model:relation_view",
    /** 模型拓扑图 */
    RelationGraph: "cmdb:model:relation_graph",
    /** 更新模型关联关系 */
    RelationEdit: "cmdb:model:relation_edit",
    /** 删除模型关联关系 */
    RelationDelete: "cmdb:model:relation_delete",
    /** 创建模型关联关系 */
    RelationAdd: "cmdb:model:relation_add",
    /** 分组列表 */
    GroupView: "cmdb:model:group_view",
    /** 创建分组 */
    GroupAdd: "cmdb:model:group_add",
    /** 新增分组 (兼容旧有引用) */
    GroupCreate: "cmdb:model:group_add",
    /** 删除分组 */
    GroupDelete: "cmdb:model:group_delete",
    /** 重命名分组 */
    GroupRename: "cmdb:model:group_rename"
  },

  /** 属性管理相关 */
  Attribute: {
    /** 属性列表 */
    View: "cmdb:attribute:view",
    /** 创建属性 */
    Add: "cmdb:attribute:add",
    /** 更新属性 */
    Edit: "cmdb:attribute:edit",
    /** 删除属性 */
    Delete: "cmdb:attribute:delete",
    /** 自定义列展示 */
    ViewCustomFields: "cmdb:attribute:view_custom_fields",
    /** 属性字段 */
    ViewFields: "cmdb:attribute:view_fields",
    /** 分组列表 */
    GroupList: "cmdb:attribute:group_list",
    /** 创建分组 */
    GroupAdd: "cmdb:attribute:group_add",
    /** 删除分组 */
    GroupDelete: "cmdb:attribute:group_delete",
    /** 重命名分组 */
    GroupRename: "cmdb:attribute:group_rename",
    /** 属性排序 */
    Sort: "cmdb:attribute:sort",
    /** 分组排序 */
    GroupSort: "cmdb:attribute:group_sort"
  },

  /** 资产仓库相关 */
  Resource: {
    /** 资产列表 */
    View: "cmdb:resource:view",
    /** 资产详情 */
    Detail: "cmdb:resource:get",
    /** 创建资产 */
    Add: "cmdb:resource:add",
    /** 修改资产 */
    Edit: "cmdb:resource:edit",
    /** 删除资产 */
    Delete: "cmdb:resource:delete",
    /** 全文检索资产 */
    Search: "cmdb:resource:search",
    /** 资产关联拓扑图 */
    ViewRelationGraph: "cmdb:resource:view_relation_graph",
    /** 查询加密字段 */
    GetSecure: "cmdb:resource:get_secure",
    /** 所有资产关系聚合查询 */
    RelationPipelineAll: "cmdb:resource:relation_pipeline_all",
    /** 创建资产关系 */
    RelationAdd: "cmdb:resource:relation_add",
    /** 删除资产关系 */
    RelationDelete: "cmdb:resource:relation_delete",
    /** 设置自定义属性 */
    EditCustomField: "cmdb:resource:edit_custom_field"
  },

  /** 关联关系管理 */
  Relation: {
    /** 关联类型列表 */
    View: "cmdb:relation:view",
    /** 创建关联类型 */
    Add: "cmdb:relation:add",
    /** 更新关联类型 */
    Edit: "cmdb:relation:edit",
    /** 删除关联类型 */
    Delete: "cmdb:relation:delete"
  },

  /** 在线终端相关 */
  Terminal: {
    /** 终端会话 */
    SSHSession: "cmdb:terminal:ssh_session",
    /** 终端连接验证 */
    Connect: "cmdb:terminal:connect",
    /** 远程连接 */
    GuacTunnel: "cmdb:terminal:guac_tunnel",
    /** 查看文件 */
    SFTPFiles: "cmdb:terminal:sftp_files",
    /** 创建文件 */
    SFTPNewFile: "cmdb:terminal:sftp_new_file",
    /** 创建目录 */
    SFTPNewFolder: "cmdb:terminal:sftp_new_folder",
    /** 移动文件 */
    SFTPMove: "cmdb:terminal:sftp_move",
    /** 重命名文件 */
    SFTPRename: "cmdb:terminal:sftp_rename",
    /** 保存文件内容 */
    SFTPSave: "cmdb:terminal:sftp_save",
    /** 预览文件 */
    SFTPPreview: "cmdb:terminal:sftp_preview",
    /** 搜索文件 */
    SFTPSearch: "cmdb:terminal:sftp_search",
    /** 下载文件 */
    SFTPDownload: "cmdb:terminal:sftp_download",
    /** 上传文件 */
    SFTPUploadWS: "cmdb:terminal:sftp_upload_ws",
    /** 删除文件 */
    SFTPDelete: "cmdb:terminal:sftp_delete",
    /** 压缩文件 */
    SFTPArchive: "cmdb:terminal:sftp_archive",
    /** 解压文件 */
    SFTPUnarchive: "cmdb:terminal:sftp_unarchive"
  },

  /** 文件与对象存储工具 */
  Tools: {
    /** 文件下载 */
    Download: "cmdb:tools:download",
    /** 文件上传 */
    Upload: "cmdb:tools:upload",
    /** 删除对象 */
    Remove: "cmdb:tools:remove"
  },

  /** 导入导出数据 IO */
  DataIO: {
    /** 数据导入 */
    Import: "cmdb:dataio:import",
    /** 数据导出 */
    Export: "cmdb:dataio:export",
    /** 模板导出 */
    ExportTemplate: "cmdb:dataio:export_template"
  }
} as const

/** 权限常量类型定义 */
export type AuthType = typeof IAM_CAPABILITIES
