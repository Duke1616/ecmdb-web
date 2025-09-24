/**
 * 模板表单验证规则配置
 */
import type { FormRules } from "element-plus"

export const templateFormRules: FormRules = {
  name: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  description: [
    { max: 200, message: "长度不能超过 200 个字符", trigger: "blur" }
  ],
  channel: [
    { required: true, message: "请选择渠道类型", trigger: "change" }
  ],
  "version.name": [
    { required: true, message: "请输入版本名称", trigger: "blur" },
    { min: 1, max: 20, message: "长度在 1 到 20 个字符", trigger: "blur" }
  ],
  "version.content": [
    { required: true, message: "请输入模板内容", trigger: "blur" }
  ]
}
