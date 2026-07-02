import type { Column } from "@@/components/DataTable/types"

const idColumn: Column = { prop: "id", label: "工单号", minWidth: 120, align: "center" }
const taskIdColumn: Column = { prop: "task_id", label: "流程任务号", minWidth: 120, align: "center" }
const templateColumn: Column = {
  prop: "template_name",
  label: "工单名称",
  slot: "templateName",
  minWidth: 160,
  align: "center"
}
const provideColumn: Column = { prop: "provide", label: "来源", slot: "provide", minWidth: 100, align: "center" }
const starterColumn: Column = { prop: "starter", label: "提单人", minWidth: 100, align: "center" }
const currentStepColumn: Column = { prop: "current_step", label: "当前步骤", minWidth: 120, align: "center" }
const approvedByColumn: Column = { prop: "approved_by", label: "当前处理人", minWidth: 120, align: "center" }
const procInstCreateTimeColumn: Column = {
  prop: "proc_inst_create_time",
  label: "流程提交时间",
  minWidth: 170,
  align: "center"
}

export const myTicketColumns: Column[] = [
  idColumn,
  templateColumn,
  provideColumn,
  currentStepColumn,
  approvedByColumn,
  procInstCreateTimeColumn
]

export const userTodoTicketColumns: Column[] = [
  idColumn,
  taskIdColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  currentStepColumn,
  procInstCreateTimeColumn
]

export const allTodoTicketColumns: Column[] = [
  idColumn,
  taskIdColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  currentStepColumn,
  approvedByColumn,
  procInstCreateTimeColumn
]

export const historyTicketColumns: Column[] = [
  idColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  { prop: "status", label: "状态", slot: "status", minWidth: 100, align: "center" },
  { prop: "ctime", label: "工单提交时间", minWidth: 170, align: "center" },
  { prop: "wtime", label: "工单结束时间", minWidth: 170, align: "center" }
]
