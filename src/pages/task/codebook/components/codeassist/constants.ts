export interface CodeAssistRecipe {
  id: string
  label: string
  prompt: string
  requiresFileContext?: boolean
}

export const GENERAL_RECIPE_ID = "codebook.general"

export const CODE_ASSIST_RECIPES: CodeAssistRecipe[] = [
  {
    id: GENERAL_RECIPE_ID,
    label: "自由对话",
    prompt: ""
  },
  {
    id: "codebook.review",
    label: "审阅代码",
    prompt: "审阅当前脚本，指出正确性、安全性和可读性问题",
    requiresFileContext: true
  },
  {
    id: "codebook.edit",
    label: "修改代码",
    prompt: "根据我的要求修改当前脚本，并生成完整候选代码：",
    requiresFileContext: true
  },
  {
    id: "codebook.legacy-migration",
    label: "迁移旧脚本",
    prompt: "将当前脚本迁移到最新 etask 运行协议",
    requiresFileContext: true
  },
  {
    id: "codebook.ansible-project",
    label: "Ansible 项目",
    prompt: "分析当前 Ansible 项目；如果需要修改，请先检查相关文件并给出完整变更集"
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
  { label: "审阅 Ansible 项目", prompt: "审阅当前 Ansible 项目的结构、入口和潜在风险" }
]
