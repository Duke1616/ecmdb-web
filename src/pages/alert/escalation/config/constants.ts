/**
 * 升级步骤模板相关常量配置
 */

// 表格列配置
export const TABLE_COLUMNS = [
  {
    prop: "templateInfo",
    label: "模板信息",
    minWidth: 150,
    slot: "templateInfo"
  },
  {
    prop: "details",
    label: "详情信息",
    minWidth: 300,
    slot: "details"
  },
  {
    prop: "channels",
    label: "通知渠道",
    minWidth: 200,
    slot: "channels"
  },
  {
    prop: "receivers",
    label: "接收者",
    minWidth: 240,
    slot: "receivers"
  }
]

// 表格属性配置
export const TABLE_PROPS = {
  height: "calc(100vh - 200px)"
}

// 操作按钮配置
export const OPERATE_ITEMS = {
  template: [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 表单验证规则
export const FORM_RULES = {
  template: {
    name: [
      { required: true, message: "请输入模板名称", trigger: "blur" },
      { min: 1, max: 50, message: "模板名称长度在 1 到 50 个字符", trigger: "blur" }
    ],
    channels: [{ required: true, message: "请至少添加一个通知渠道", trigger: "change" }],
    receivers: [{ required: true, message: "请至少添加一个接收者", trigger: "change" }]
  }
}
