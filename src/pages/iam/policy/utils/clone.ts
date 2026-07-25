/**
 * 克隆策略 API 的 JSON 数据，同时剥离 Vue 响应式 Proxy。
 * Condition、AccessScope 和 Statement 都是纯 JSON 结构，不包含 Date、函数或循环引用。
 */
export const clonePolicyJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
