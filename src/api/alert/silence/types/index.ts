import type { MatchType } from "@@/constants/match-type"

export { MatchType } from "@@/constants/match-type"

export interface Matcher {
  type: MatchType
  name: string
  value: string
}

export interface TimeRange {
  start: number
  end: number
  weekdays?: number[]
  timezone?: string
}

export interface SilenceRule {
  id: number
  name: string
  matchers: Matcher[]
  time_window: TimeRange
  enabled: boolean
  workspace_id?: number
}

export interface SaveSilenceRuleReq {
  id?: number
  name: string
  matchers: Matcher[]
  time_window: TimeRange
  enabled: boolean
  workspace_id?: number
}

export interface ListSilenceRuleByWorkspaceReq {
  workspace_id: number
}

export interface ListSilenceRuleByWorkspaceResponse {
  silence_rules: SilenceRule[]
}

export interface RenewalSilenceTimeWindowReq {
  id: number
  start_time: number
  end_time: number
}

export interface SilenceOperationResponse {
  success?: boolean
}
