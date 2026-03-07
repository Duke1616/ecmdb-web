export interface ReceiverStrategy {
  /** 策略唯一标识 (如: team, on_call, department, appoint) */
  type: string
  /** 策略名称用于展示 */
  label: string
  /** 图标 */
  icon?: any

  /**
   * 获取列表分页数据，供 OptionsTab 使用
   */
  fetchList?: (params: { offset: number; limit: number; query?: string }) => Promise<{ items: any[]; total: number }>

  /**
   * 根据 ID 列表批量解析展示名称，供预览标签使用
   */
  resolveNames?: (ids: string[]) => Promise<Record<string, string>>
}

class StrategyRegistry {
  private strategies = new Map<string, ReceiverStrategy>()

  // 注册策略
  register(strategy: ReceiverStrategy) {
    this.strategies.set(strategy.type, strategy)
  }

  // 获取特定策略
  getStrategy(type: string): ReceiverStrategy | undefined {
    return this.strategies.get(type)
  }

  // 获取所有启用的策略 (含 fetchList 的即需要 OptionsTab 渲染的)
  getOptionsStrategies(): ReceiverStrategy[] {
    return Array.from(this.strategies.values()).filter((s) => !!s.fetchList)
  }
}

// 导出全局单一注册表实例
export const receiverSelectorRegistry = new StrategyRegistry()
