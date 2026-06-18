import type { Column } from "@@/components/DataTable/types"

export const templateColumns: Column[] = [
  { prop: "name", label: "名称", showOverflowTooltip: true },
  { prop: "workflow_id", label: "关联流程", slot: "workflowName", showOverflowTooltip: true },
  { prop: "create_type", label: "来源", slot: "createType" },
  { prop: "desc", label: "描述", showOverflowTooltip: true }
]
