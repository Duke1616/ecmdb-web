export type ScheduleUnit = "minute" | "hour" | "day"

interface ImmediateScheduleConfig {
  type: "immediate"
}

interface FallbackDelayScheduleConfig {
  type: "delay"
  source: {
    type: "fixed"
    value: number
  }
  unit: ScheduleUnit
}

/** Workflow 编辑器允许持久化的调度配置。 */
export type ScheduleConfig = ImmediateScheduleConfig | FallbackDelayScheduleConfig

interface StoredScheduleConfig {
  type?: string
  source?: {
    type?: string
    value?: unknown
  }
  unit?: unknown
}

const LEGACY_UNIT_MAP: Record<number, ScheduleUnit> = {
  1: "minute",
  2: "hour",
  3: "day"
}

const isScheduleUnit = (value: unknown): value is ScheduleUnit => ["minute", "hour", "day"].includes(String(value))

/** 创建立即执行配置。 */
export const createImmediateSchedule = (): ImmediateScheduleConfig => ({ type: "immediate" })

/** 创建模板未覆盖时使用的固定延迟配置。 */
export const createFixedDelaySchedule = (value = 1, unit: ScheduleUnit = "hour"): FallbackDelayScheduleConfig => ({
  type: "delay",
  source: { type: "fixed", value },
  unit
})

const readStoredSchedule = (value: unknown): ScheduleConfig | undefined => {
  if (!value || typeof value !== "object") return undefined
  const schedule = value as StoredScheduleConfig
  if (schedule.type === "immediate") return createImmediateSchedule()
  if (schedule.type !== "delay" && schedule.type !== "at") return undefined

  const quantity = schedule.source?.type === "fixed" ? Number(schedule.source.value) : 1
  const unit = isScheduleUnit(schedule.unit) ? schedule.unit : "hour"
  return createFixedDelaySchedule(quantity > 0 ? quantity : 1, unit)
}

const adaptLegacySchedule = (properties: Record<string, unknown>): ScheduleConfig => {
  if (!properties.is_timing) return createImmediateSchedule()
  const quantity = properties.exec_method === "hand" ? Number(properties.quantity) : 1
  return createFixedDelaySchedule(quantity > 0 ? quantity : 1, LEGACY_UNIT_MAP[Number(properties.unit)] || "hour")
}

/**
 * 将画布中存储的当前或历史节点属性转换为 Workflow 编辑器使用的保底调度。
 * 历史字段只在该入口解释，编辑器内部始终使用严格的 immediate/fixed-delay 联合类型。
 */
export const resolveFallbackSchedule = (properties: Record<string, unknown> | undefined): ScheduleConfig => {
  if (!properties) return createImmediateSchedule()
  return readStoredSchedule(properties.schedule) || adaptLegacySchedule(properties)
}
