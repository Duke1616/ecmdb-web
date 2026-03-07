import { receiverSelectorRegistry } from "./registry"
import { ALL_STRATEGIES } from "./implementations"

// 自动完成基础策略注册
ALL_STRATEGIES.forEach((strategy) => {
  receiverSelectorRegistry.register(strategy)
})

export { receiverSelectorRegistry }
export type { ReceiverStrategy } from "./registry"
