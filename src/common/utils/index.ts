import dayjs from "dayjs"
import { cloneDeep } from "lodash-es"
import { BUSINESS_TYPES } from "@@/composables/useBusinessPicker"

/** 格式化时间 */
export const formatDateTime = (time: string | number | Date) => {
  return time ? dayjs(new Date(time)).format("YYYY-MM-DD HH:mm:ss") : "N/A"
}

/**
 * 清空对象中的零值，将 0 转换为 undefined
 * @param obj 要处理的对象
 * @returns 处理后的新对象
 */
export const clearZeroValues = <T extends Record<string, any>>(obj: T): T => {
  const cloned = cloneDeep(obj) as any
  Object.keys(cloned).forEach((key) => {
    if (cloned[key] === 0) {
      cloned[key] = undefined
    }
  })
  return cloned
}

/**
 * 获取业务类型的中文标签
 * @param bizId 业务类型ID
 * @returns 业务类型的中文标签
 */
export const getBusinessTypeLabel = (bizId: number): string => {
  switch (bizId) {
    case BUSINESS_TYPES.WORKSPACE:
      return "工作空间"
    case BUSINESS_TYPES.WORKFLOW:
      return "工作流"
    default:
      return `业务类型 ${bizId}`
  }
}
