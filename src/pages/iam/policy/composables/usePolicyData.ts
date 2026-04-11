import type { Policy, Statement, Condition as ApiCondition, CreatePolicyRequest } from "@/api/iam/policy/type"
import type { PermissionManifest } from "@/api/iam/permission/type"

// ---------------------------------------------------------
// 前端数据模型（UI 层独立定义，与后端解耦）
// ---------------------------------------------------------

/** 权限操作项（经过数据充实后的结构） */
export interface ManifestAction {
  code: string
  name: string
}

/** 权限分组 */
export interface ManifestGroup {
  name: string
  actions: ManifestAction[]
}

/** 服务权限条目 */
export interface ManifestService {
  code: string
  name: string
  entries: ManifestGroup[]
}

/**
 * 前端 Statement 视图对象
 * 与后端 Statement 的核心区别：condition 使用 Record 结构方便 UI 编辑
 */
export interface StatementVO {
  effect: "Allow" | "Deny"
  action: string[]
  resource: string[]
  condition: Record<string, string[]>
}

/** 策略表单视图对象 */
export interface PolicyFormVO {
  name: string
  code: string
  desc: string
  type: number
  statement: StatementVO[]
}

/** 创建默认的空白语句 */
export const createDefaultStatement = (): StatementVO => ({
  effect: "Allow",
  action: [],
  resource: ["*"],
  condition: {}
})

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

  // 构建 code -> name 查表
  const nameMap = new Map<string, string>()
  if (Array.isArray(raw.actions)) {
    raw.actions.forEach((a) => nameMap.set(a.code, a.name))
  }

  return raw.services.map(
    (svc): ManifestService => ({
      code: svc.code,
      name: svc.name,
      entries: (svc.entries || []).map(
        (grp): ManifestGroup => ({
          name: grp.name,
          actions: (grp.actions || []).map(
            (code: string): ManifestAction => ({
              code,
              name: nameMap.get(code) || code
            })
          )
        })
      )
    })
  )
}

/** 将前端 VO 转换为后端请求格式 */
export const mapVOToRequest = (vo: PolicyFormVO): CreatePolicyRequest => ({
  name: vo.name,
  code: vo.code,
  desc: vo.desc,
  type: vo.type,
  statement: vo.statement.map((s) => {
    const conditions: ApiCondition[] = Object.entries(s.condition)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => ({ operator: "StringEquals", key, value: values }))

    return {
      effect: s.effect,
      action: s.action,
      resource: s.resource,
      condition: conditions.length > 0 ? conditions : undefined
    } as Statement
  })
})

/** 将后端响应转换为前端 VO */
export const mapResponseToVO = (raw: Policy): PolicyFormVO => ({
  name: raw.name || "",
  code: raw.code || "",
  desc: raw.desc || "",
  type: raw.type || 2,
  statement: (raw.statement || []).map((s): StatementVO => {
    const condition: Record<string, string[]> = {}
    if (Array.isArray(s.condition)) {
      s.condition.forEach((c) => {
        if (c.key && c.value) {
          condition[c.key] = Array.isArray(c.value) ? c.value : [c.value]
        }
      })
    }
    return { effect: s.effect || "Allow", action: s.action || [], resource: s.resource || ["*"], condition }
  })
})

/** 根据选中的 actions 获取摘要描述（用于 UI 标题展示） */
export const getActionSummary = (selectedActions: string[], manifest: ManifestService[]): string => {
  if (!selectedActions || selectedActions.length === 0) return "权限条目配置"

  // 提取唯一服务代码
  const svcCodes = [...new Set(selectedActions.map((a) => a.split(":")[0]))]
  // 匹配 manifest 获取服务名称
  const activeSvcNames = svcCodes.map((code) => manifest.find((m) => m.code === code)?.name).filter(Boolean) as string[]

  if (activeSvcNames.length === 0) return "未选择有效模块"
  if (activeSvcNames.length <= 2) return `已配置: ${activeSvcNames.join(", ")}`
  return `已配置 ${activeSvcNames[0]} 等 ${activeSvcNames.length} 个模块`
}
