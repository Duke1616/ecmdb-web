import { MatchType, MATCH_TYPE_OPTIONS, type MatchTypeOption } from "@@/constants/match-type"
import type { Matcher } from "@@/types/matcher"

/**
 * 匹配器相关工具函数 Composable
 */
export function useMatcher() {
  /**
   * 获取匹配类型选项列表
   * @param includeTypes 包含的类型列表，如果为空则返回所有类型
   */
  const getMatchTypeOptions = (includeTypes?: MatchType[]): MatchTypeOption[] => {
    if (!includeTypes || includeTypes.length === 0) {
      return MATCH_TYPE_OPTIONS
    }
    return MATCH_TYPE_OPTIONS.filter((option) => includeTypes.includes(option.value))
  }

  /**
   * 获取操作符文本
   * @param type 匹配类型
   */
  const getOperatorText = (type: MatchType): string => {
    const option = MATCH_TYPE_OPTIONS.find((opt) => opt.value === type)
    return option?.operatorText || "="
  }

  /**
   * 检查匹配类型是否需要 value 字段
   * @param type 匹配类型
   */
  const isValueRequired = (type: MatchType): boolean => {
    const option = MATCH_TYPE_OPTIONS.find((opt) => opt.value === type)
    return option?.requiresValue ?? true
  }

  /**
   * 创建空的匹配器
   */
  const createEmptyMatcher = (): Matcher => {
    return {
      type: MatchType.Equal,
      name: "",
      value: ""
    }
  }

  /**
   * 获取匹配类型的标签文本
   * @param type 匹配类型
   */
  const getMatchTypeLabel = (type: MatchType): string => {
    const option = MATCH_TYPE_OPTIONS.find((opt) => opt.value === type)
    return option?.label || "未知"
  }

  return {
    MatchType,
    getMatchTypeOptions,
    getOperatorText,
    isValueRequired,
    createEmptyMatcher,
    getMatchTypeLabel
  }
}
