import { listTeamsApi, getTeamDetailApi } from "@/api/alert/team"
import { listRotasApi } from "@/api/rota"
import { listDepartmentTreeApi } from "@/api/department"
import { findByUsernamesApi } from "@/api/user"
import { OfficeBuilding, Clock, User } from "@element-plus/icons-vue"

import type { ReceiverStrategy } from "./registry"

// 部门数据缓存 (在本次会话中共享，因为不需要分页且返回完整树)
let deptCache: any[] | null = null
const fetchAllDepartments = async () => {
  if (deptCache) return deptCache
  const { data } = await listDepartmentTreeApi()
  const flatten = (depts: any[], parentPath = ""): any[] => {
    let res: any[] = []
    depts.forEach((dept) => {
      const currentPath = parentPath ? `${parentPath} - ${dept.name}` : dept.name
      res.push({
        id: dept.id,
        name: dept.name,
        path: currentPath
      })
      if (dept.children?.length) {
        res = res.concat(flatten(dept.children, currentPath))
      }
    })
    return res
  }
  deptCache = flatten(data)
  return deptCache
}

export const TeamStrategy: ReceiverStrategy = {
  type: "team",
  label: "关联团队",
  icon: OfficeBuilding,
  fetchList: async (params) => {
    const paramsAny: any = { offset: params.offset, limit: params.limit, keyword: params.query }
    const { data } = await listTeamsApi(paramsAny)
    return { items: data.teams, total: data.total }
  },
  resolveNames: async (ids) => {
    // 假设选择的数量较少，直接并行请求单条数据
    const dict: Record<string, string> = {}
    await Promise.allSettled(
      ids.map(async (idStr) => {
        const id = parseInt(idStr)
        if (isNaN(id)) return
        try {
          const { data } = await getTeamDetailApi(id)
          dict[idStr] = data.name
        } catch {
          dict[idStr] = idStr // 获取不到使用 id
        }
      })
    )
    return dict
  }
}

export const RotaStrategy: ReceiverStrategy = {
  type: "on_call",
  label: "值班人员",
  icon: Clock,
  fetchList: async (params) => {
    const paramsAny: any = { offset: params.offset, limit: params.limit, keyword: params.query }
    const { data } = await listRotasApi(paramsAny)
    return { items: data.rotas, total: data.total }
  },
  resolveNames: async (ids) => {
    const dict: Record<string, string> = {}
    // 注意: 目前没有 batchId 获取 Rota 详情的接口，我们大范围拉一下前 200 条作为轻量缓存找
    try {
      const { data } = await listRotasApi({ offset: 0, limit: 200 })
      const rotasMap = new Map(data.rotas.map((r) => [String(r.id), r.name]))
      ids.forEach((id) => {
        dict[id] = rotasMap.get(id) || id
      })
    } catch {
      ids.forEach((id) => (dict[id] = id))
    }
    return dict
  }
}

export const DepartmentStrategy: ReceiverStrategy = {
  type: "department",
  label: "归属部门",
  icon: OfficeBuilding,
  fetchList: async (params) => {
    const depts = await fetchAllDepartments()
    const query = params.query?.toLowerCase()
    const filtered = query ? depts.filter((d) => d.path.toLowerCase().includes(query)) : depts
    const items = filtered.slice(params.offset, params.offset + params.limit)
    return { items, total: filtered.length }
  },
  resolveNames: async (ids) => {
    const depts = await fetchAllDepartments()
    const dict: Record<string, string> = {}
    const deptMap = new Map(depts.map((d) => [String(d.id), d.name]))
    ids.forEach((id) => {
      dict[id] = deptMap.get(id) || id
    })
    return dict
  }
}

export const UserAppointStrategy: ReceiverStrategy = {
  type: "appoint",
  label: "人员白名单",
  icon: User,
  // 人员选择器由专门的组件 UserSelector 管控，无需注册 fetchList
  resolveNames: async (ids) => {
    const dict: Record<string, string> = {}
    try {
      const { data } = await findByUsernamesApi(ids)
      data.users.forEach((u) => {
        dict[u.username] = u.display_name || u.username
      })
      ids.forEach((id) => {
        if (!dict[id]) dict[id] = id
      })
    } catch {
      ids.forEach((id) => (dict[id] = id))
    }
    return dict
  }
}

// 可在此处导出全部供统一注册
export const ALL_STRATEGIES = [TeamStrategy, RotaStrategy, DepartmentStrategy, UserAppointStrategy]
