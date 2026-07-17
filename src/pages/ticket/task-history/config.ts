import { AutomationTaskPhase } from "@/api/ticket/task/types/task"
import type { Column } from "@@/components/DataTable/types"
import type { StatusMeta } from "./types"

export const taskHistoryColumns: Column[] = [
  { prop: "ticket_id", label: "工单号", slot: "ticket", width: 120, align: "center" },
  { prop: "node_name", label: "自动化节点", slot: "node", minWidth: 220, align: "center" },
  { prop: "status", label: "任务状态", slot: "status", width: 120, align: "center" },
  { prop: "phase", label: "当前阶段", slot: "phase", width: 150, align: "center" },
  { prop: "scheduled_at", label: "计划执行", slot: "scheduled_at", minWidth: 180, align: "center" },
  { prop: "utime", label: "最近更新", slot: "utime", minWidth: 180, align: "center" }
]

const statusMeta: Record<number, StatusMeta> = {
  0: { text: "未知", tone: "neutral" },
  1: { text: "成功", tone: "success" },
  2: { text: "失败", tone: "danger" },
  3: { text: "运行中", tone: "running" },
  4: { text: "等待中", tone: "neutral" },
  5: { text: "已挂起", tone: "warning" },
  6: { text: "提交中", tone: "running" }
}

const phaseText: Record<AutomationTaskPhase, string> = {
  [AutomationTaskPhase.Ready]: "等待计划时间",
  [AutomationTaskPhase.Submitting]: "提交中",
  [AutomationTaskPhase.Running]: "执行中",
  [AutomationTaskPhase.Succeeded]: "执行成功",
  [AutomationTaskPhase.Failed]: "执行失败",
  [AutomationTaskPhase.Blocked]: "已阻塞",
  [AutomationTaskPhase.Retrying]: "重试中"
}

export const getTaskStatus = (status: number): StatusMeta => statusMeta[status] ?? statusMeta[0]

export const formatAutomationTaskPhase = (phase: AutomationTaskPhase) => phaseText[phase] || phase || "-"
