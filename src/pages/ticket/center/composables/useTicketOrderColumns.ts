import type { Column } from "@@/components/DataTable/types"

const idColumn: Column = { prop: "id", label: "工单号", align: "center" }
const taskIdColumn: Column = { prop: "task_id", label: "流程任务号", align: "center" }
const templateColumn: Column = { prop: "template_name", label: "工单名称", slot: "templateName", align: "center" }
const provideColumn: Column = { prop: "provide", label: "来源", slot: "provide", align: "center" }
const starterColumn: Column = { prop: "starter", label: "提单人", align: "center" }
const currentStepColumn: Column = { prop: "current_step", label: "当前步骤", align: "center" }
const approvedByColumn: Column = { prop: "approved_by", label: "当前处理人", align: "center" }
const procInstCreateTimeColumn: Column = { prop: "proc_inst_create_time", label: "流程提交时间", align: "center" }

export const myOrderColumns: Column[] = [
  idColumn,
  templateColumn,
  provideColumn,
  currentStepColumn,
  approvedByColumn,
  procInstCreateTimeColumn
]

export const userTodoOrderColumns: Column[] = [
  idColumn,
  taskIdColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  currentStepColumn,
  procInstCreateTimeColumn
]

export const allTodoOrderColumns: Column[] = [
  idColumn,
  taskIdColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  currentStepColumn,
  approvedByColumn,
  procInstCreateTimeColumn
]

export const historyOrderColumns: Column[] = [
  idColumn,
  templateColumn,
  provideColumn,
  starterColumn,
  { prop: "status", label: "状态", slot: "status", align: "center" },
  { prop: "ctime", label: "工单提交时间", align: "center" },
  { prop: "wtime", label: "工单结束时间", align: "center" }
]
