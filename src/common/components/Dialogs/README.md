# Dialogs 弹窗组件

这个目录包含了项目中所有的通用弹窗组件，按功能进行分类管理。

## 目录结构

```
Dialogs/
├── Base/           # 基础弹窗组件
│   └── index.vue   # BaseDialog - 提供基础的 el-dialog 封装
├── Form/           # 表单弹窗组件
│   └── index.vue   # FormDialog - 专门用于表单操作的弹窗
├── Permission/     # 权限分配弹窗组件
│   └── index.vue   # PermissionDialog - 专门用于权限分配的弹窗
├── index.ts        # 统一导出文件
└── README.md       # 说明文档
```

## 组件说明

### BaseDialog
- **功能**: 提供基础的 el-dialog 封装
- **特性**: 
  - 支持不同类型的弹窗（standard、form、permission、custom）
  - 统一的头部和底部样式
  - 可配置的宽度、关闭行为等
  - 响应式设计

### FormDialog
- **功能**: 专门用于表单操作的弹窗
- **特性**:
  - 统一的表单头部样式（图标 + 标题 + 副标题）
  - 标准的底部操作按钮（取消 + 确认）
  - 可配置的确认按钮状态（loading、disabled）
  - 底部提示信息区域

### PermissionDialog
- **功能**: 专门用于权限分配的弹窗
- **特性**:
  - 统计信息显示（已选择数量、总数量）
  - 权限分配专用的头部样式
  - 确认按钮显示选择数量
  - 无内容区域 padding，适合复杂布局

## 使用方法

### 统一导入
```typescript
import { BaseDialog, FormDialog, PermissionDialog } from "@@/components/Dialogs"
```

### 单独导入
```typescript
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import PermissionDialog from "@@/components/Dialogs/Permission/index.vue"
```

## 设计原则

1. **统一性**: 所有弹窗组件都基于 BaseDialog，确保视觉风格一致
2. **可复用性**: 组件设计时考虑了不同场景的复用需求
3. **可扩展性**: 可以轻松添加新的弹窗类型或功能
4. **类型安全**: 使用 TypeScript 提供完整的类型支持
