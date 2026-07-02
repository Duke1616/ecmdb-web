import type { StatusMeta } from "../types"

const STATUS_META: Record<number, StatusMeta> = {
  0: { text: "未知", tone: "neutral" },
  1: { text: "成功", tone: "success" },
  2: { text: "失败", tone: "danger" },
  3: { text: "运行中", tone: "running" },
  4: { text: "等待中", tone: "neutral" },
  5: { text: "已挂起", tone: "warning" },
  6: { text: "就绪中", tone: "running" },
  7: { text: "重试中", tone: "warning" }
}

export const getTaskStatus = (status: number): StatusMeta => STATUS_META[status] ?? STATUS_META[0]
