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

export const TICKET_CAPABILITIES = {
  /** 工单管理相关 */
  Manager: {
    /** 流程轨迹图 */
    Graph: "ticket:manager:graph",
    /** 关联自动化任务 */
    ViewTasks: "ticket:manager:view_tasks",
    /** 所有待办工单 */
    Todo: "ticket:manager:todo",
    /** 我发起的工单 */
    MyStart: "ticket:manager:my_start",
    /** 任务节点表单配置 */
    FormConfig: "ticket:manager:form_config",
    /** 工单详情 */
    Detail: "ticket:manager:get",
    /** 历史工单 */
    History: "ticket:manager:history",
    /** 我的待办工单 */
    MyTodo: "ticket:manager:my_todo",
    /** 转交审批人 */
    Transfer: "ticket:manager:transfer",
    /** 提交工单 */
    Submit: "ticket:manager:submit",
    /** 撤销工单 */
    Revoke: "ticket:manager:revoke",
    /** 驳回审批 */
    Reject: "ticket:manager:reject",
    /** 流转记录 */
    Record: "ticket:manager:record",
    /** 同意审批 */
    Pass: "ticket:manager:pass"
  },

  /** 工单模板相关 */
  Template: {
    /** 创建模板分类 */
    AddGroup: "ticket:template:add_group",
    /** 修改模板分类 */
    EditGroup: "ticket:template:edit_group",
    /** 删除模板分类 */
    DeleteGroup: "ticket:template:delete_group",
    /** 删除工单模板 */
    Delete: "ticket:template:delete",
    /** 创建工单模板 */
    Add: "ticket:template:add",
    /** 修改工单模板 */
    Edit: "ticket:template:edit",
    /** 查看模板详情 */
    Detail: "ticket:template:get",
    /** 工单模板列表 */
    View: "ticket:template:view",
    /** 收藏/取消收藏工单模板 */
    ToggleFavorite: "ticket:template:toggle_favorite",
    /** 查看收藏工单模板 */
    ViewFavorite: "ticket:template:view_favorite",
    /** 模板分类列表 */
    ViewGroup: "ticket:template:view_group",
    /** 按 ID 查看模板分类 */
    ViewGroupByIds: "ticket:template:view_group_by_ids",
    /** 按 ID 查看模板 */
    ViewByIds: "ticket:template:view_by_ids"
  },

  /** 流程管理相关 */
  Workflow: {
    /** 创建流程 */
    Add: "ticket:workflow:add",
    /** 删除流程 */
    Delete: "ticket:workflow:delete",
    /** 流程发布 */
    Deploy: "ticket:workflow:deploy",
    /** 修改流程 */
    Edit: "ticket:workflow:edit",
    /** 流程详情 */
    Detail: "ticket:workflow:get",
    /** 流程列表 */
    View: "ticket:workflow:view"
  },

  /** 任务记录相关 */
  Task: {
    /** 任务列表 */
    View: "ticket:task:view",
    /** 修改任务变量 */
    UpdateVariables: "ticket:task:update_variables",
    /** 修改任务参数 */
    UpdateArgs: "ticket:task:update_args",
    /** 重试任务 */
    Retry: "ticket:task:retry",
    /** 任务日志 */
    Logs: "ticket:task:logs"
  },

  /** 自动派发相关 */
  Dispatch: {
    /** 创建自动派发 */
    Add: "ticket:dispatch:add",
    /** 自动派发列表 */
    View: "ticket:dispatch:view",
    /** 删除自动派发 */
    Delete: "ticket:dispatch:delete",
    /** 修改自动派发 */
    Edit: "ticket:dispatch:edit",
    /** 同步自动派发 */
    Sync: "ticket:dispatch:sync"
  },

  /** 工单内部依赖权限 */
  Ticket: {
    /** 工单详情 */
    Detail: "ticket:ticket:get"
  }
} as const

export const TASK_CAPABILITIES = {
  /** 任务管理相关 */
  Manager: {
    /** 创建任务 */
    Add: "task:manager:add",
    /** 任务列表 */
    View: "task:manager:view",
    /** 停止任务 */
    Stop: "task:manager:stop",
    /** 运行任务 */
    Start: "task:manager:start",
    /** 任务日志 */
    Logs: "task:manager:logs",
    /** 任务详情 */
    Detail: "task:manager:get",
    /** 执行记录 */
    Executions: "task:manager:executions",
    /** 更新任务 */
    Edit: "task:manager:edit",
    /** 删除任务 */
    Delete: "task:manager:delete"
  },

  /** 脚本模板相关 */
  Codebook: {
    /** 创建脚本模板 */
    Add: "task:codebook:add",
    /** 删除脚本模板 */
    Delete: "task:codebook:delete",
    /** 更新脚本模板 */
    Edit: "task:codebook:edit",
    /** 脚本模板详情 */
    Detail: "task:codebook:get",
    /** 脚本模板列表 */
    View: "task:codebook:view",
    /** 代码资源子节点 */
    Children: "task:codebook:children",
    /** 代码资源树 */
    Tree: "task:codebook:tree",
    /** 查看代码资源树 */
    ViewTree: "task:codebook:view_tree",
    /** 脚本模板排序 */
    Sort: "task:codebook:sort",
    /** 创建脚本版本 */
    CreateVersion: "task:codebook:create_version",
    /** 创建版本 */
    AddVersion: "task:codebook:add_version",
    /** 脚本版本列表 */
    ViewVersion: "task:codebook:view_version",
    /** 脚本版本详情 */
    DetailVersion: "task:codebook:get_version",
    /** 使用脚本版本 */
    UseVersion: "task:codebook:use_version",
    /** 当前绑定执行单元 */
    ViewRunners: "task:codebook:view_runners",
    /** 项目列表 */
    ViewProject: "task:codebook:view_project",
    /** 创建项目 */
    AddProject: "task:codebook:add_project",
    /** 更新项目 */
    EditProject: "task:codebook:edit_project",
    /** 删除项目 */
    DeleteProject: "task:codebook:delete_project"
  },

  /** 执行单元相关 */
  Runner: {
    /** 注册执行单元 */
    Add: "task:runner:add",
    /** 删除执行单元 */
    Delete: "task:runner:delete",
    /** 更新执行单元 */
    Edit: "task:runner:edit",
    /** 执行单元详情 */
    Detail: "task:runner:get",
    /** 执行单元标签 */
    Tags: "task:runner:tags",
    /** 执行单元列表 */
    View: "task:runner:view",
    /** 按 ID 查看执行单元 */
    ViewByIds: "task:runner:view_by_ids",
    /** 按流程查看执行单元 */
    ViewByWorkflowId: "task:runner:view_by_workflow_id",
    /** 查看未绑定当前脚本的执行单元 */
    ViewExcludeCodebookId: "task:runner:view_exclude_codebook_id"
  },

  /** 全局变量相关 */
  Variable: {
    /** 创建全局变量 */
    Add: "task:variable:add",
    /** 删除全局变量 */
    Delete: "task:variable:delete",
    /** 更新全局变量 */
    Edit: "task:variable:edit",
    /** 全局变量详情 */
    Detail: "task:variable:get",
    /** 全局变量列表 */
    View: "task:variable:view"
  },

  /** 执行节点相关 */
  Executor: {
    /** 执行节点列表 */
    View: "task:executor:view"
  }
} as const

export const ALERT_CAPABILITIES = {
  /** 告警规则相关 */
  Rule: {
    /** 告警规则列表 */
    View: "alert:rule:view",
    /** 创建告警规则 */
    Add: "alert:rule:add",
    /** 删除告警规则 */
    Delete: "alert:rule:delete",
    /** 修改告警规则 */
    Edit: "alert:rule:edit",
    /** 告警规则详情 */
    Detail: "alert:rule:get",
    /** 创建规则分组 */
    GroupAdd: "alert:rule:group_add",
    /** 更新规则分组 */
    GroupEdit: "alert:rule:group_edit",
    /** 规则分组列表 */
    GroupView: "alert:rule:group_view",
    /** 按关键字查询告警规则 */
    ViewByKeyword: "alert:rule:view_by_keyword"
  },

  /** 协作空间相关 */
  Workspace: {
    /** 告警规则列表 */
    ViewRules: "alert:workspace:view_rules",
    /** 抑制规则列表 */
    ViewInhibits: "alert:workspace:view_inhibits",
    /** 创建空间 */
    Add: "alert:workspace:add",
    /** 更新空间 */
    Edit: "alert:workspace:edit",
    /** 空间列表 */
    View: "alert:workspace:view",
    /** 空间详情 */
    Detail: "alert:workspace:get",
    /** 告警列表 */
    ViewAlerts: "alert:workspace:view_alerts",
    /** 升级配置列表 */
    ViewEscalationConfigs: "alert:workspace:view_escalation_configs",
    /** 工单配置 */
    ViewTicketConfigs: "alert:workspace:view_ticket_configs",
    /** 我的团队空间 */
    ViewMyTeam: "alert:workspace:view_my_team",
    /** 按团队查询空间 */
    ViewByTeam: "alert:workspace:view_by_team",
    /** 按关键字查询空间 */
    ViewByKeyword: "alert:workspace:view_by_keyword"
  },

  /** 可观测源相关 */
  Datasource: {
    /** 更新数据源 */
    Edit: "alert:datasource:edit",
    /** 数据源列表 */
    View: "alert:datasource:view",
    /** 创建数据源 */
    Add: "alert:datasource:add",
    /** 删除数据源 */
    Delete: "alert:datasource:delete",
    /** 按类型查询数据源 */
    ViewByType: "alert:datasource:view_by_type"
  },

  /** 抑制规则相关 */
  Inhibit: {
    /** 状态切换 */
    Toggle: "alert:inhibit:toggle",
    /** 续期时间窗口 */
    Renewal: "alert:inhibit:renewal",
    /** 更新抑制规则 */
    Edit: "alert:inhibit:edit",
    /** 删除抑制规则 */
    Delete: "alert:inhibit:delete",
    /** 创建抑制规则 */
    Add: "alert:inhibit:add"
  },

  /** 聚合分组相关 */
  Aggregate: {
    /** 聚合分组详情 */
    Detail: "alert:aggregate:get",
    /** 更新聚合分组 */
    Edit: "alert:aggregate:edit",
    /** 删除聚合分组 */
    Delete: "alert:aggregate:delete",
    /** 创建聚合分组 */
    Add: "alert:aggregate:add"
  },

  /** 团队管理相关 */
  Team: {
    /** 更新群组 */
    ChatEdit: "alert:team:chat_edit",
    /** 删除团队 */
    Delete: "alert:team:delete",
    /** 团队列表 */
    View: "alert:team:view",
    /** 团队详情 */
    Detail: "alert:team:get",
    /** 创建团队 */
    Add: "alert:team:add",
    /** 群组列表 */
    ChatView: "alert:team:caht_view",
    /** 绑定群组 */
    ChatBind: "alert:team:chat_bind",
    /** 解绑群组 */
    ChatDelete: "alert:team:chat_delete",
    /** 更新团队 */
    Edit: "alert:team:edit"
  },

  /** 告警管理相关 */
  Manager: {
    /** 历史告警 */
    ViewHistory: "alert:manager:view_history",
    /** 当前告警 */
    ViewCurrent: "alert:manager:view_current"
  },

  /** 模版集合相关 */
  TemplateSet: {
    /** 创建模板集 */
    Add: "alert:template_set:add",
    /** 更新模板集 */
    Edit: "alert:template_set:edit",
    /** 删除模板集 */
    Delete: "alert:template_set:delete",
    /** 模板集列表 */
    View: "alert:template_set:view",
    /** 查询模板集条目 */
    ItemView: "alert:template_set:item_view",
    /** 清空模板集条目 */
    ItemDeleteAll: "alert:template_set:item_delete_all",
    /** 删除模板集条目 */
    ItemDelete: "alert:template_set:item_delete",
    /** 批量新增模板集条目 */
    ItemAddBatch: "alert:template_set:item_add_batch",
    /** 新增模板集条目 */
    ItemAdd: "alert:template_set:item_add",
    /** 获取模板集 */
    Detail: "alert:template_set:get",
    /** 按 ID 查询模板集 */
    ViewByIds: "alert:template_set:view_by_ids"
  },

  /** 模板管理相关 */
  Template: {
    /** 更新模板版本 */
    VersionEdit: "alert:template:version_edit",
    /** 发布模板 */
    Publish: "alert:template:publish",
    /** 创建模板 */
    Add: "alert:template:add",
    /** 查询模板列表 */
    View: "alert:template:view",
    /** 查询模板详情 */
    Detail: "alert:template:get",
    /** 拷贝模板版本 */
    VersionFork: "alert:template:version_fork",
    /** 更新模板 */
    Edit: "alert:template:edit",
    /** 按渠道查询模板 */
    ViewByChannel: "alert:template:view_by_channel"
  },

  /** 升级配置相关 */
  EscalationConfig: {
    /** 升级配置列表 */
    View: "alert:escalation:config_view",
    /** 状态切换 */
    Toggle: "alert:escalation:config_toggle",
    /** 交换升级配置优先级 */
    Swap: "alert:escalation:config_swap",
    /** 升级配置详情 */
    Detail: "alert:escalation:config_get",
    /** 修改升级配置 */
    Edit: "alert:escalation:config_edit",
    /** 删除升级配置 */
    Delete: "alert:escalation:config_delete",
    /** 创建升级配置 */
    Add: "alert:escalation:config_add"
  },

  /** 升级步骤相关 */
  EscalationStep: {
    /** 交换升级步骤级别 */
    Swap: "alert:escalation:step_swap",
    /** 删除升级步骤 */
    Delete: "alert:escalation:step_delete",
    /** 升级步骤详情 */
    Detail: "alert:escalation:step_get",
    /** 修改升级步骤 */
    Edit: "alert:escalation:step_edit",
    /** 创建升级步骤 */
    Add: "alert:escalation:step_add",
    /** 升级步骤列表 */
    View: "alert:escalation:step_view"
  },

  /** 升级步骤模版相关 */
  EscalationStepTemplate: {
    /** 升级步骤模板详情 */
    Detail: "alert:escalation:step_tmpl_get",
    /** 修改升级步骤模板 */
    Edit: "alert:escalation:step_tmpl_edit",
    /** 删除升级步骤模板 */
    Delete: "alert:escalation:step_tmpl_delete",
    /** 创建升级步骤模板 */
    Add: "alert:escalation:step_tmpl_add",
    /** 升级步骤模板列表 */
    View: "alert:escalation:step_tmpl_view",
    /** 按 ID 查询升级步骤模板 */
    ViewByIds: "alert:escalation:step_tmpl_view_by_ids"
  },

  /** 路由规则相关 */
  RoutingRule: {
    /** 修改路由规则 */
    Edit: "alert:routing_rule:edit",
    /** 路由规则列表 */
    View: "alert:routing_rule:view",
    /** 状态切换 */
    Toggle: "alert:routing_rule:toggle",
    /** 交换优先级 */
    SwapPriorities: "alert:routing_rule:swap_priorities",
    /** 路由规则详情 */
    Detail: "alert:routing_rule:get",
    /** 删除路由规则 */
    Delete: "alert:routing_rule:delete",
    /** 创建路由规则 */
    Add: "alert:routing_rule:add"
  },

  /** 工单转发相关 */
  TicketConfig: {
    /** 状态切换 */
    Toggle: "alert:ticket_config:toggle",
    /** 工单转发详情 */
    Detail: "alert:ticket_config:get",
    /** 交换优先级 */
    SwapPriorities: "alert:ticket_config:swap_priorities",
    /** 创建工单转发 */
    Add: "alert:ticket_config:add",
    /** 删除工单转发 */
    Delete: "alert:ticket_config:delete",
    /** 更新工单转发 */
    Edit: "alert:ticket_config:edit"
  },

  /** 即时查询相关 */
  Explore: {
    /** 添加查询历史 */
    HistoryAdd: "alert:explore:history_add",
    /** 清空查询历史 */
    HistoryClear: "alert:explore:history_clear",
    /** 删除查询历史 */
    HistoryDelete: "alert:explore:history_delete",
    /** 查询历史列表 */
    HistoryView: "alert:explore:history_view",
    /** 指标查询 */
    Metrics: "alert:explore:metrics"
  },

  /** 排班管理相关 */
  Oncall: {
    /** 更新临时规则 */
    AdjEdit: "alert:oncall:adj_edit",
    /** 删除排班 */
    Delete: "alert:oncall:delete",
    /** 修改排班 */
    Edit: "alert:oncall:edit",
    /** 删除临时规则 */
    AdjDelete: "alert:oncall:adj_delete",
    /** 新增临时规则 */
    AdjAdd: "alert:oncall:adj_add",
    /** 创建排班 */
    Add: "alert:oncall:add",
    /** 排班详情 */
    Detail: "alert:oncall:get",
    /** 预览排班 */
    PreviewView: "alert:oncall:preview_view",
    /** 新增常规规则 */
    RuleAdd: "alert:oncall:rule_add",
    /** 更新常规规则 */
    RuleEdit: "alert:oncall:rule_edit",
    /** 查看规则 */
    RuleView: "alert:oncall:rule_view",
    /** 排班列表 */
    View: "alert:oncall:view"
  }
} as const

/** 权限常量类型定义 */
export type AuthType = typeof IAM_CAPABILITIES
