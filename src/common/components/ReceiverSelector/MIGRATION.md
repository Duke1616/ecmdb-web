# ReceiverSelector 迁移指南

## 迁移完成 ✅

已将 `ChatReceiverSelector` 重构为通用的 `ReceiverSelector` 组件。

## 文件变更

### 已删除的文件
```
src/common/components/workflow/RegisterNode/chat/
├── ChatReceiverSelector.vue          ❌ 已删除
├── strategies/                        ❌ 已删除
│   ├── index.ts
│   ├── registry.ts
│   └── implementations.ts
└── tabs/                              ❌ 已删除
    ├── OptionsTab.vue
    ├── SystemTab.vue
    ├── TemplateTab.vue
    └── TreeTab.vue
```

### 新增的通用组件
```
src/common/components/ReceiverSelector/
├── index.vue                          ✅ 通用组件
├── composables/
│   └── useAssignees.ts               ✅ 状态管理
├── strategies/                        ✅ 策略注册
│   ├── index.ts
│   ├── registry.ts
│   └── implementations.ts
├── tabs/                              ✅ Tab 组件
│   ├── OptionsTab.vue
│   ├── SystemTab.vue
│   ├── TemplateTab.vue
│   └── TreeTab.vue
├── OPTIMIZATION.md                    ✅ 优化文档
└── MIGRATION.md                       ✅ 本文档
```

### 已更新的文件
```
src/common/components/workflow/RegisterNode/chat/
└── chatProperty.vue                   ✅ 已更新引用
```

## 代码变更

### chatProperty.vue

**变更前:**
```vue
<script setup lang="ts">
import ChatReceiverSelector from "./ChatReceiverSelector.vue"
import { receiverSelectorRegistry } from "./strategies"
</script>

<template>
  <ChatReceiverSelector
    v-model:visible="masterSelectorVisible"
    :initial-assignees="propertyForm.assignees"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="entitiesDisplayNames"
    @confirm="handleMasterSelectorConfirm"
    @update-user-names="handleUpdateUserNames"
  />
</template>
```

**变更后:**
```vue
<script setup lang="ts">
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import { receiverSelectorRegistry } from "@/common/components/ReceiverSelector/strategies"
</script>

<template>
  <ReceiverSelector
    v-model:visible="masterSelectorVisible"
    title="配置/管理入群接收者策略"
    result-panel-title="已选加群逻辑项"
    empty-text="暂无入群接收者"
    :initial-assignees="propertyForm.assignees"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="entitiesDisplayNames"
    @confirm="handleMasterSelectorConfirm"
    @update-user-names="handleUpdateUserNames"
  />
</template>
```

## 如何在其他地方使用

### 1. 工单场景
```vue
<script setup lang="ts">
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"

const visible = ref(false)
const assignees = ref([])

const handleConfirm = (finalAssignees: any[]) => {
  assignees.value = finalAssignees
  // 处理确认逻辑
}
</script>

<template>
  <ReceiverSelector
    v-model:visible="visible"
    title="配置工单接收人"
    result-panel-title="已选接收人"
    empty-text="暂无接收人"
    :modes="['user', 'team', 'department']"
    :initial-assignees="assignees"
    @confirm="handleConfirm"
  />
</template>
```

### 2. 告警场景
```vue
<ReceiverSelector
  v-model:visible="visible"
  title="配置告警通知人"
  result-panel-title="已选通知人"
  empty-text="暂无通知人"
  :modes="['user', 'on_call', 'team']"
  :initial-assignees="assignees"
  @confirm="handleConfirm"
/>
```

### 3. 自定义规则选项
```vue
<ReceiverSelector
  v-model:visible="visible"
  title="配置审批人"
  :modes="['user', 'department']"
  :rule-options="[
    { label: '指定审批人', value: 'appoint' },
    { label: '部门负责人', value: 'leaders' },
    { label: '直属上级', value: 'direct_manager' }
  ]"
  :initial-assignees="assignees"
  @confirm="handleConfirm"
/>
```

## Props 说明

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | Boolean | - | 对话框显示状态 |
| title | String | "配置/管理接收者策略" | 对话框标题 |
| resultPanelTitle | String | "已选逻辑项" | 右侧面板标题 |
| emptyText | String | "暂无接收者" | 空状态文本 |
| initialAssignees | Array | [] | 初始选中的接收者 |
| templateRules | Array | [] | 模板规则列表 |
| getTemplateFieldOptions | Function | - | 获取模板字段选项 |
| usernameToDisplayName | Object | {} | 用户名到显示名的映射 |
| modes | Array | ['system', 'user', 'team', 'department', 'on_call', 'template'] | 显示的 tab 模式 |
| ruleOptions | Array | - | 自定义规则选项 |

## Events

| Event | 参数 | 说明 |
|-------|------|------|
| update:visible | (visible: boolean) | 对话框显示状态变更 |
| confirm | (assignees: Assignee[]) | 确认选择 |
| update-user-names | (map: Record<string, string>) | 更新用户名映射 |

## 扩展新策略

如果需要添加新的接收者策略（如告警组、项目组等），只需在 `strategies/implementations.ts` 中添加：

```typescript
import { Bell } from "@element-plus/icons-vue"
import { listAlertGroupsApi } from "@/api/alert"

export const AlertGroupStrategy: ReceiverStrategy = {
  type: "alert_group",
  label: "告警组",
  icon: Bell,
  fetchList: async (params) => {
    const { data } = await listAlertGroupsApi(params)
    return { items: data.groups, total: data.total }
  },
  resolveNames: async (ids) => {
    const dict: Record<string, string> = {}
    // 实现名称解析逻辑
    return dict
  }
}

// 添加到导出列表
export const ALL_STRATEGIES = [
  TeamStrategy,
  RotaStrategy,
  DepartmentStrategy,
  UserAppointStrategy,
  AlertGroupStrategy  // 新增
]
```

然后在使用时添加对应的 mode：
```vue
<ReceiverSelector
  :modes="['user', 'team', 'alert_group']"
  ...
/>
```

## 优势

1. **代码复用**: 一次开发，多处使用
2. **统一体验**: 所有场景的接收者选择体验一致
3. **易于维护**: 集中管理，修改一处即可
4. **易于扩展**: 通过策略模式轻松添加新类型
5. **性能优化**: 使用 composable 减少重复代码和操作
6. **更好的 UX**: 添加了过渡动画和更好的交互反馈

## 注意事项

1. 确保导入路径正确：`@/common/components/ReceiverSelector/index.vue`
2. 如果使用模板功能，需要传入 `templateRules` 和 `getTemplateFieldOptions`
3. `modes` 数组控制显示哪些 tab，可以根据场景自定义
4. 新增策略后记得在 `ALL_STRATEGIES` 中注册

## 回滚方案

如果需要回滚到旧版本，可以从 git 历史中恢复：
```bash
git checkout <commit-hash> -- src/common/components/workflow/RegisterNode/chat/
```

但建议使用新的通用组件，因为它有更好的性能和可维护性。
