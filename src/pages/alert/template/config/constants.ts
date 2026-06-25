/**
 * 模板集合相关常量配置
 */

import type { Column } from "@@/components/DataTable/types"

// 表格列配置
export const TABLE_COLUMNS: Column[] = [
  {
    prop: "name",
    label: "集合信息",
    slot: "name"
  },
  {
    prop: "itemCount",
    label: "条目数量",
    width: 120,
    slot: "itemCount"
  },
  {
    prop: "description",
    label: "描述信息",
    minWidth: 200,
    slot: "description"
  },
  {
    prop: "ctime",
    label: "创建时间",
    width: 180,
    slot: "ctime"
  }
]

// 表格属性配置
export const TABLE_PROPS = {
  height: "calc(100vh - 200px)"
}

// 操作按钮配置
export const OPERATE_ITEMS = {
  templateSet: [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "编辑模板", code: "manage", type: "success" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 表单验证规则
export const FORM_RULES = {
  templateSet: {
    name: [
      { required: true, message: "请输入集合名称", trigger: "blur" },
      { min: 1, max: 50, message: "集合名称长度在 1 到 50 个字符", trigger: "blur" }
    ]
  }
}
