import type { Column } from "@@/components/DataTable/types"

export const taskHistoryColumns: Column[] = [
  { prop: "ticket_id", label: "工单ID", width: 140, align: "center" },
  { prop: "codebook_uid", label: "任务模板标识", minWidth: 150 },
  { prop: "execute_target", label: "执行目标", slot: "execute_target", minWidth: 200, align: "center" },
  { prop: "status", label: "状态", slot: "status", minWidth: 120, align: "center" },
  { prop: "is_timing", label: "类型", slot: "is_timing", minWidth: 100, align: "center" },
  { prop: "run_time", label: "时间线", slot: "run_time", minWidth: 180, align: "center" }
]
