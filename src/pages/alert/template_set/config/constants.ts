/**
 * 模板集合相关常量配置
 */

// 表格列配置
export const TABLE_COLUMNS = [
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

// 条目表格列配置
export const ITEM_TABLE_COLUMNS = [
  {
    prop: "channel",
    label: "渠道类型",
    width: 120,
    slot: "channel"
  },
  {
    prop: "template",
    label: "模板信息",
    slot: "template"
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

// 条目表格属性配置
export const ITEM_TABLE_PROPS = {
  height: "calc(100vh - 200px)"
}

// 操作按钮配置
export const OPERATE_ITEMS = {
  templateSet: [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "管理条目", code: "manage", type: "success" },
    { name: "删除", code: "delete", type: "danger" }
  ],
  item: [{ name: "删除", code: "delete", type: "danger" }]
}

// 表单验证规则
export const FORM_RULES = {
  templateSet: {
    name: [
      { required: true, message: "请输入集合名称", trigger: "blur" },
      { min: 1, max: 50, message: "集合名称长度在 1 到 50 个字符", trigger: "blur" }
    ]
  },
  item: {
    channel: [{ required: true, message: "请选择渠道类型", trigger: "change" }],
    template_id: [
      { required: true, message: "请选择模板", trigger: "change" },
      {
        validator: (rule: any, value: any, callback: any) => {
          if (value === undefined || value === null || value === 0) {
            callback(new Error("请选择模板"))
          } else {
            callback()
          }
        },
        trigger: "change"
      }
    ]
  }
}
