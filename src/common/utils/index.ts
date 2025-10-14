import dayjs from "dayjs"
import { cloneDeep } from "lodash-es"

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
