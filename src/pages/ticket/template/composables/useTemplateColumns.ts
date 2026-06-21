import type { Column } from "@@/components/DataTable/types"

export const templateColumns: Column[] = [
  { prop: "name", label: "名称", minWidth: 150, showOverflowTooltip: true },
  { prop: "workflow_id", label: "关联流程", slot: "workflowName", minWidth: 150, showOverflowTooltip: true },
  { prop: "create_type", label: "来源", slot: "createType", minWidth: 100 },
  { prop: "desc", label: "描述", minWidth: 150, showOverflowTooltip: true }
]
