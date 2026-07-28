import { v4 as uuidv4 } from "uuid"
import type { Policy, Statement, Condition, AccessScope, CreatePolicyRequest } from "@/api/iam/policy/type"
import type { PermissionManifest } from "@/api/iam/permission/type"
import type { AccessScopePreset } from "@/api/iam/permission/type"
import { getConditionValidationMessage } from "../utils/condition"
import { getAccessScopeValidationMessage, getSelectedAccessScopeActions } from "../utils/accessScope"
import { clonePolicyJson } from "../utils/clone"

// ---------------------------------------------------------
// 前端数据模型（UI 层独立定义，与后端解耦）
// ---------------------------------------------------------

/** 权限操作项（经过数据充实后的结构） */
export interface ManifestAction {
  code: string
  name: string
  has_menu?: boolean
  menu_urns?: string[]
  access_scope_presets?: AccessScopePreset[]
}

/** 权限分组 */
export interface ManifestGroup {
  name: string
  actions: ManifestAction[]
  children?: ManifestGroup[]
}

/** 服务权限条目 */
export interface ManifestService {
  code: string
  name: string
  entries: ManifestGroup[]
}

/**
 * 前端 Statement 视图对象
 * Condition 与 AccessScope 直接保留后端 AST，避免可视化与脚本模式切换时发生语义损失。
 */
export interface StatementVO {
  /** 仅用于 Vue 列表身份，不会提交给后端。 */
  ui_id: string
  effect: "Allow" | "Deny"
  action: string[]
  resource: string[]
  condition?: Condition
  access_scope?: AccessScope
  /** 仅用于区分“尚未选择”与明确选择“不限制数据”，不会提交给后端。 */
  access_scope_configured: boolean
}

/** 策略表单视图对象 */
export interface PolicyFormVO {
  name: string
  code: string
  desc: string
  type: number
  statement: StatementVO[]
}

const escapeRegExp = (value: string) => value.replace(/[.+^${}()|[\]\\]/g, "\\$&")

const toActionPatternRegex = (pattern: string) => {
  const source = `^${escapeRegExp(pattern).replace(/\*/g, ".*").replace(/\?/g, ".")}$`
  return new RegExp(source, "i")
}

const visitGroupActions = (group: ManifestGroup, visitor: (action: ManifestAction) => void) => {
  ;(group.actions || []).forEach(visitor)
  ;(group.children || []).forEach((child) => visitGroupActions(child, visitor))
}

export const isActionPatternMatched = (patterns: string[], code: string): boolean => {
  if (!Array.isArray(patterns) || patterns.length === 0) return false
  if (patterns.includes(code)) return true

  return patterns.some((pattern) => {
    try {
      return toActionPatternRegex(pattern).test(code)
    } catch {
      return false
    }
  })
}

export const getMatchedActionPattern = (patterns: string[], code: string): string | null => {
  if (!Array.isArray(patterns) || patterns.length === 0 || patterns.includes(code)) return null

  for (const pattern of patterns) {
    try {
      if (toActionPatternRegex(pattern).test(code)) return pattern
    } catch {
      // ignore invalid wildcard pattern
    }
  }
  return null
}

/** 计算一组叶子 Action 在当前 Statement 中的全选/半选状态。 */
export const getActionSelectionState = (selectedActions: string[], actionCodes: string[]) => {
  const selectedCount = actionCodes.filter((code) => isActionPatternMatched(selectedActions, code)).length
  return {
    all: actionCodes.length > 0 && selectedCount === actionCodes.length,
    some: selectedCount > 0 && selectedCount < actionCodes.length
  }
}

/** 批量选中或取消叶子 Action，并移除会覆盖取消项的通配符。 */
export const updateSelectedActions = (selectedActions: string[], actionCodes: string[], checked: boolean): string[] => {
  if (checked) return [...new Set([...selectedActions, ...actionCodes])]
  return selectedActions.filter((pattern) => !actionCodes.some((code) => isActionPatternMatched([pattern], code)))
}

export const serviceHasMatchedAction = (patterns: string[], service: ManifestService): boolean => {
  let matched = false
  ;(service.entries || []).some((entry) => {
    visitGroupActions(entry, (action) => {
      if (!matched && isActionPatternMatched(patterns, action.code)) matched = true
    })
    return matched
  })
  return matched
}

export const getServiceCodesFromActions = (actions: string[], manifest: ManifestService[]): string[] => {
  if (!Array.isArray(actions) || actions.length === 0) return []
  const codes = new Set<string>()

  manifest.forEach((service) => {
    if (serviceHasMatchedAction(actions, service)) {
      codes.add(service.code)
    }
  })

  // Manifest 尚未加载或脚本里是非标准 action 时，保留可识别的首段服务 code。
  actions.forEach((action) => {
    const serviceCode = action.split(":")[0]
    if (serviceCode && serviceCode !== "*" && manifest.some((service) => service.code === serviceCode)) {
      codes.add(serviceCode)
    }
  })

  return [...codes]
}

/** 返回 Action 的业务名称；Manifest 中不存在时回退到 code。 */
export const getActionDisplayNames = (codes: string[], manifest: ManifestService[]): string[] => {
  const names = new Map<string, string>()
  manifest.forEach((service) =>
    service.entries.forEach((entry) =>
      visitGroupActions(entry, (action) => {
        names.set(action.code, action.name)
      })
    )
  )
  return codes.map((code) => names.get(code) || code)
}

/** 创建默认的空白语句 */
const createStatementID = () => uuidv4()

export const createDefaultStatement = (): StatementVO => ({
  ui_id: createStatementID(),
  effect: "Allow",
  action: [],
  resource: ["*"],
  access_scope_configured: false
})

/** 规范化单条语句，避免局部数据缺失导致 UI 状态失真 */
export const normalizeStatement = (stmt?: Partial<StatementVO>): StatementVO => ({
  ui_id: typeof stmt?.ui_id === "string" && stmt.ui_id ? stmt.ui_id : createStatementID(),
  effect: stmt?.effect === "Deny" ? "Deny" : "Allow",
  action: Array.isArray(stmt?.action) ? stmt.action : [],
  resource: Array.isArray(stmt?.resource) && stmt.resource.length > 0 ? stmt.resource : ["*"],
  condition:
    stmt?.condition && typeof stmt.condition === "object" && !Array.isArray(stmt.condition)
      ? clonePolicyJson(stmt.condition)
      : undefined,
  access_scope:
    stmt?.access_scope && typeof stmt.access_scope === "object" && !Array.isArray(stmt.access_scope)
      ? clonePolicyJson(stmt.access_scope)
      : undefined,
  access_scope_configured: stmt?.access_scope_configured === true || stmt?.access_scope !== undefined
})

/** 规范化语句列表，确保表单里始终至少有一条可编辑语句 */
export const normalizeStatements = (statements?: Partial<StatementVO>[]): StatementVO[] => {
  if (!Array.isArray(statements) || statements.length === 0) {
    return [createDefaultStatement()]
  }
  return statements.map((stmt) => normalizeStatement(stmt))
}

/** JSON 编辑器文本转语句列表 */
export const parseStatementsJson = (value: string, manifest: ManifestService[] = []): StatementVO[] => {
  const parsed = JSON.parse(value)
  if (!Array.isArray(parsed)) {
    throw new Error("权限语句必须是一个数组格式")
  }
  parsed.forEach((stmt, index) => {
    if (stmt?.condition !== undefined && stmt.condition !== null) {
      const message = getConditionValidationMessage(stmt.condition as Condition)
      if (message) throw new Error(`第 ${index + 1} 条语句：${message}`)
    }
    if (stmt?.access_scope !== undefined && stmt.access_scope !== null) {
      const actions = Array.isArray(stmt.action) ? stmt.action : []
      const message = getAccessScopeValidationMessage(stmt.access_scope as AccessScope, actions, manifest)
      if (message) throw new Error(`第 ${index + 1} 条语句：${message}`)
    }
  })
  return normalizeStatements(parsed.map((stmt) => ({ ...stmt, access_scope_configured: true })))
}

/** 表单提交前的语句校验 */
export const getStatementValidationMessage = (
  statements: StatementVO[],
  emptyText = "请至少添加一条权限语句",
  manifest: ManifestService[] = []
) => {
  if (!Array.isArray(statements) || statements.length === 0) {
    return emptyText
  }

  const emptyIdx = statements.findIndex((stmt) => !Array.isArray(stmt.action) || stmt.action.length === 0)
  if (emptyIdx !== -1) {
    return `第 ${emptyIdx + 1} 条语句尚未配置任何权限操作`
  }

  for (let index = 0; index < statements.length; index += 1) {
    const scopedActions = getSelectedAccessScopeActions(statements[index].action || [], manifest)
    if (scopedActions.length > 0 && !statements[index].access_scope_configured) {
      return `第 ${index + 1} 条语句：请为${getActionDisplayNames(scopedActions, manifest).join("、")}选择可访问数据`
    }
    const message = getConditionValidationMessage(statements[index].condition)
    if (message) return `第 ${index + 1} 条语句：${message}`
    const accessScopeMessage = getAccessScopeValidationMessage(
      statements[index].access_scope,
      statements[index].action || [],
      manifest
    )
    if (accessScopeMessage) return `第 ${index + 1} 条语句：${accessScopeMessage}`
  }

  return ""
}

// ---------------------------------------------------------
// 数据转换层
// ---------------------------------------------------------

/**
 * 将后端 Manifest 原始响应充实为前端 ManifestService[]
 *
 * 后端结构：
 *   actions: [{id, service, group, code, name}, ...]
 *   services: [{code, name, entries: [{name, actions: ["code1","code2"]}]}]
 *
 * 前端需要：
 *   services: [{code, name, entries: [{name, actions: [{code, name}]}]}]
 *
 * 核心操作：将 entries[].actions 从 string[] 通过顶层 actions 查表充实为 {code, name}[]
 */
export const enrichManifest = (raw: PermissionManifest): ManifestService[] => {
  if (!raw || !raw.services) return []

  // 构建 code -> action 查表
  const actionMap = new Map<
    string,
    { name: string; has_menu?: boolean; menu_urns?: string[]; access_scope_presets?: AccessScopePreset[] }
  >()
  if (Array.isArray(raw.actions)) {
    raw.actions.forEach((a) =>
      actionMap.set(a.code, {
        name: a.name,
        has_menu: a.has_menu,
        menu_urns: a.menu_urns,
        access_scope_presets: a.access_scope_presets
      })
    )
  }

  const enrichGroup = (grp: any): ManifestGroup => {
    return {
      name: grp.name,
      actions: (grp.actions || []).map((code: string): ManifestAction => {
        const detail = actionMap.get(code)
        return {
          code,
          name: detail ? detail.name : code,
          has_menu: detail?.has_menu,
          menu_urns: detail?.menu_urns,
          access_scope_presets: detail?.access_scope_presets
        }
      }),
      children: Array.isArray(grp.children) ? grp.children.map(enrichGroup) : undefined
    }
  }

  return raw.services.map(
    (svc): ManifestService => ({
      code: svc.code,
      name: svc.name,
      entries: (svc.entries || []).map(enrichGroup)
    })
  )
}

/** 将前端 VO 转换为后端请求格式 */
export const mapVOToRequest = (vo: PolicyFormVO): CreatePolicyRequest => ({
  name: vo.name,
  code: vo.code,
  desc: vo.desc,
  type: vo.type,
  statement: normalizeStatements(vo.statement).map(
    (s): Statement => ({
      effect: s.effect,
      action: s.action,
      resource: s.resource,
      condition: s.condition ? clonePolicyJson(s.condition) : undefined,
      access_scope: s.access_scope ? clonePolicyJson(s.access_scope) : undefined
    })
  )
})

/** 将后端响应转换为前端 VO */
export const mapResponseToVO = (raw: Policy): PolicyFormVO => ({
  name: raw.name || "",
  code: raw.code || "",
  desc: raw.desc || "",
  type: raw.type || 2,
  statement: normalizeStatements(
    (raw.statement || []).map(
      (s): Partial<StatementVO> => ({
        effect: s.effect || "Allow",
        action: s.action || [],
        resource: s.resource || ["*"],
        condition: s.condition ? clonePolicyJson(s.condition) : undefined,
        access_scope: s.access_scope ? clonePolicyJson(s.access_scope) : undefined,
        access_scope_configured: true
      })
    )
  )
})

/** 根据选中的 actions 获取摘要描述（用于 UI 标题展示） */
export const getActionSummary = (selectedActions: string[], manifest: ManifestService[]): string => {
  if (!selectedActions || selectedActions.length === 0) return "权限条目配置"

  const svcCodes = getServiceCodesFromActions(selectedActions, manifest)
  const activeSvcNames = svcCodes.map((code) => manifest.find((m) => m.code === code)?.name).filter(Boolean) as string[]

  if (activeSvcNames.length === 0) return "未选择有效模块"
  if (activeSvcNames.length <= 2) return `已配置: ${activeSvcNames.join(", ")}`
  return `已配置 ${activeSvcNames[0]} 等 ${activeSvcNames.length} 个模块`
}
