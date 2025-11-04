import type { MatchType } from "@@/constants/match-type"

// 标签匹配器接口
export interface Matcher {
  type: MatchType
  name: string
  value: string
}

export type Matchers = Matcher[]
