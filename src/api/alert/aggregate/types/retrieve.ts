import type { AggregateGroupRule, GetAggregateGroupByWorkspaceResp } from "./index"

export type RetrieveAggregateGroup = AggregateGroupRule

export interface GetAggregateGroupByWorkspaceReq {
  workspace_id: number
}

export type { GetAggregateGroupByWorkspaceResp }
