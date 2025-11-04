// 匹配类型枚举
export enum MatchType {
  Equal = 1, // 等于
  NotEqual = 2, // 不等于
  Regexp = 3, // 正则
  NotRegexp = 4, // 非正则
  Exists = 5, // 存在
  NotExists = 6 // 不存在
}

// 匹配类型选项配置
export interface MatchTypeOption {
  label: string
  value: MatchType
  requiresValue: boolean // 是否需要 value 字段
  operatorText: string // 操作符显示文本
}

// 匹配类型选项列表
export const MATCH_TYPE_OPTIONS: MatchTypeOption[] = [
  {
    label: "等于",
    value: MatchType.Equal,
    requiresValue: true,
    operatorText: "="
  },
  {
    label: "不等于",
    value: MatchType.NotEqual,
    requiresValue: true,
    operatorText: "!="
  },
  {
    label: "正则",
    value: MatchType.Regexp,
    requiresValue: true,
    operatorText: "~"
  },
  {
    label: "非正则",
    value: MatchType.NotRegexp,
    requiresValue: true,
    operatorText: "!~"
  },
  {
    label: "存在",
    value: MatchType.Exists,
    requiresValue: false,
    operatorText: "存在"
  },
  {
    label: "不存在",
    value: MatchType.NotExists,
    requiresValue: false,
    operatorText: "不存在"
  }
]
