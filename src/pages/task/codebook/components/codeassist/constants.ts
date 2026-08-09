export interface CodeAssistProfile {
  id: string
  label: string
  description: string
}

export const DEFAULT_PROFILE_ID = "default"

export const CODE_ASSIST_PROFILES: CodeAssistProfile[] = [
  {
    id: DEFAULT_PROFILE_ID,
    label: "智能协作",
    description: "根据你的表达自动解释、审阅或生成候选变更"
  },
  {
    id: "review",
    label: "只审阅",
    description: "只分析问题和风险，不生成候选变更"
  },
  {
    id: "legacy-migration",
    label: "旧协议迁移",
    description: "按当前 etask 参数、依赖和结果协议迁移脚本"
  },
  {
    id: "ansible",
    label: "Ansible 规范",
    description: "按 Ansible 项目结构和凭据规则处理请求"
  }
]

export const FILE_CONTEXT_EXAMPLES = [
  { label: "解释当前脚本的执行流程", prompt: "解释当前脚本的执行流程" },
  { label: "检查安全风险和依赖", prompt: "检查当前脚本的安全风险、错误处理和外部依赖" },
  { label: "优化可读性但保持行为", prompt: "优化当前脚本的可读性，同时保持原有业务行为" }
]

export const PROJECT_CONTEXT_EXAMPLES = [
  { label: "介绍当前项目结构", prompt: "介绍当前项目的目录结构和主要文件" },
  { label: "分析项目中的依赖关系", prompt: "分析当前项目的目录和依赖关系" },
  { label: "新增一个功能", prompt: "请先了解当前项目，然后帮我新增一个功能" },
  { label: "审阅项目风险", prompt: "审阅当前项目的结构、入口和潜在风险" }
]
