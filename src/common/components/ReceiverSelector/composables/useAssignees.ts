import { ref, Ref } from "vue"

export interface Assignee {
  rule: string
  values: string[]
}

export function useAssignees(initialAssignees: Ref<any[]>) {
  const tempAssignees = ref<Assignee[]>([])

  // 初始化
  const init = () => {
    tempAssignees.value = JSON.parse(JSON.stringify(initialAssignees.value))
  }

  // 查找指定规则的 assignee
  const findAssignee = (rule: string) => {
    return tempAssignees.value.find((a) => a.rule === rule)
  }

  // 获取指定规则的 keys
  const getKeys = (rule: string): string[] => {
    const assignee = findAssignee(rule)
    return assignee ? assignee.values : []
  }

  // 通用的 toggle 逻辑
  const toggleValue = (rule: string, id: string) => {
    let assignee = findAssignee(rule)
    if (!assignee) {
      assignee = { rule, values: [] }
      tempAssignees.value.push(assignee)
    }

    const idx = assignee.values.indexOf(id)
    if (idx > -1) {
      assignee.values.splice(idx, 1)
    } else {
      assignee.values.push(id)
    }

    // 如果 values 为空，移除该 assignee
    if (assignee.values.length === 0) {
      tempAssignees.value = tempAssignees.value.filter((a) => a.rule !== rule)
    }
  }

  // 设置指定规则的 values
  const setValues = (rule: string, values: string[]) => {
    let assignee = findAssignee(rule)
    if (!assignee) {
      assignee = { rule, values: [] }
      tempAssignees.value.push(assignee)
    }
    assignee.values = values

    if (assignee.values.length === 0) {
      tempAssignees.value = tempAssignees.value.filter((a) => a.rule !== rule)
    }
  }

  // 添加规则
  const addRule = (rule: string, values: string[] = []) => {
    const existing = findAssignee(rule)
    if (existing) {
      existing.values = values
    } else {
      tempAssignees.value.push({ rule, values })
    }
  }

  // 移除规则
  const removeRule = (index: number) => {
    tempAssignees.value.splice(index, 1)
  }

  // 切换系统规则（无 values 的规则）
  const toggleSystemRule = (rule: string) => {
    const idx = tempAssignees.value.findIndex((a) => a.rule === rule)
    if (idx > -1) {
      tempAssignees.value.splice(idx, 1)
    } else {
      tempAssignees.value.push({ rule, values: [] })
    }
  }

  // 获取所有系统规则的 keys
  const getSystemRuleKeys = () => {
    return tempAssignees.value.map((a) => a.rule)
  }

  return {
    tempAssignees,
    init,
    findAssignee,
    getKeys,
    toggleValue,
    setValues,
    addRule,
    removeRule,
    toggleSystemRule,
    getSystemRuleKeys
  }
}
