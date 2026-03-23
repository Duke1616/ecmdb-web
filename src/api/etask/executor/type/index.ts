/**
 * 绑定详情
 */
export interface BindingOption {
  component: string // UI 渲染控件提示: input, code-editor, codebook-picker, host-selector 等
  config: Record<string, string> // 扩展配置提示 (比如支持的语言, 展示风格等)
  placeholder: string // 占位符，示例
  label: string // 绑定名称
}

/**
 * 参数定义
 */
export interface Parameter {
  key: string
  desc: string
  required: boolean
  bindings: Record<string, BindingOption> // 支持的绑定能力及其详细 UI 配置: inline, codebook, secret, variable 等
  default: string // 默认值
}

/**
 * 处理器详情
 */
export interface HandlerDetail {
  name: string
  desc: string
  metadata?: Parameter[]
}

/**
 * 节点详情
 */
export interface NodeDetail {
  id: string
  address: string
}

/**
 * 执行器信息
 */
export interface Executor {
  name: string
  desc: string
  handlers: HandlerDetail[]
  nodes: NodeDetail[]
  mode?: "PULL" | "PUSH"
}
