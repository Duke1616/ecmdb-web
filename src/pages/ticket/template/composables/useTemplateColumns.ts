import type { Column } from "@@/components/DataTable/types"

export const templateColumns: Column[] = [
  { prop: "name", label: "名称", showOverflowTooltip: true },
  { prop: "group_id", label: "所属组", slot: "groupName" },
  { prop: "create_type", label: "来源", slot: "createType" },
  { prop: "desc", label: "描述", showOverflowTooltip: true }
]
