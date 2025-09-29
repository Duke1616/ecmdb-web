# ECMDB Web 前端项目

一个基于 Vue 3 + TypeScript + Element Plus 的现代化企业级配置管理数据库（ECMDB）前端应用。

## 📋 项目简介

ECMDB Web 是一个功能丰富的企业级配置管理平台，提供工单管理、排班管理、任务管理、流程管理、系统管理等功能模块，帮助企业实现高效的配置管理和运维自动化。

## ✨ 主要功能

### 🎫 工单管理
- **工单创建**：支持多种工单模板，可视化表单设计
- **工单审批**：完整的审批流程，支持多级审批
- **工单跟踪**：实时跟踪工单状态和进度
- **历史记录**：完整的工单历史记录和审计

### 📅 排班管理
- **排班规则**：灵活的时间设置和轮换规则配置
- **人员管理**：支持多组人员排班，拖拽排序
- **调班功能**：支持临时调班和规则调整
- **日历视图**：直观的日历展示排班情况

### ⚙️ 任务管理
- **任务模板**：可复用的任务模板管理
- **代码编辑**：支持多语言代码编辑（Python、JavaScript、Shell等）
- **任务执行**：任务调度和执行监控
- **历史记录**：任务执行历史和结果查看

### 🔄 流程管理
- **流程设计**：可视化流程设计器
- **流程执行**：流程实例管理和执行
- **流程监控**：实时监控流程状态
- **流程优化**：流程性能分析和优化建议

### 🏗️ 系统管理
- **用户管理**：用户账号、角色、权限管理
- **菜单管理**：系统菜单和路由配置
- **模型管理**：数据模型定义和管理
- **资源管理**：系统资源监控和管理

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5+** - 渐进式 JavaScript 框架
- **TypeScript 5.8+** - 类型安全的 JavaScript 超集
- **Vite 7+** - 下一代前端构建工具

### UI 组件库
- **Element Plus 2.10+** - 基于 Vue 3 的桌面端组件库
- **UnoCSS** - 原子化 CSS 引擎
- **SCSS** - CSS 预处理器

### 状态管理
- **Pinia 3.0+** - Vue 的官方状态管理库
- **pinia-plugin-persistedstate** - 状态持久化插件

### 路由管理
- **Vue Router 4.5+** - Vue 官方路由管理器

### 网络请求
- **Axios 1.6+** - 基于 Promise 的 HTTP 客户端

### 代码编辑
- **CodeMirror 6** - 强大的代码编辑器
- **Vue Prism Editor** - Vue 代码编辑器组件
- **Prism.js** - 代码语法高亮

### 其他工具
- **Vue Draggable Plus** - 拖拽功能
- **Vue JSON Pretty** - JSON 格式化显示
- **FullCalendar** - 日历组件
- **LogicFlow** - 流程图编辑器
- **XTerm.js** - 终端模拟器

## 📁 项目结构

```
ecmdb-web/
├── public/                     # 静态资源
├── src/
│   ├── api/                    # API 接口
│   │   ├── attribute/          # 属性管理
│   │   ├── codebook/           # 代码本管理
│   │   ├── department/         # 部门管理
│   │   ├── discovery/          # 发现管理
│   │   ├── endpoint/           # 端点管理
│   │   ├── menu/               # 菜单管理
│   │   ├── model/              # 模型管理
│   │   ├── order/              # 工单管理
│   │   ├── permission/         # 权限管理
│   │   ├── relation/           # 关系管理
│   │   ├── resource/           # 资源管理
│   │   ├── role/               # 角色管理
│   │   ├── rota/               # 排班管理
│   │   ├── runner/             # 运行器管理
│   │   ├── table/              # 表格管理
│   │   ├── task/               # 任务管理
│   │   ├── template/           # 模板管理
│   │   ├── term/               # 术语管理
│   │   ├── tools/              # 工具管理
│   │   ├── user/               # 用户管理
│   │   ├── worker/             # 工作器管理
│   │   └── workflow/           # 工作流管理
│   ├── common/                 # 通用模块
│   │   ├── apis/               # 通用 API
│   │   ├── assets/             # 静态资源
│   │   ├── components/         # 通用组件
│   │   ├── composables/        # 组合式函数
│   │   ├── constants/          # 常量定义
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 工具函数
│   ├── config/                 # 配置文件
│   ├── directives/             # 自定义指令
│   ├── layouts/                # 布局组件
│   ├── pages/                  # 页面组件
│   ├── pinia/                  # 状态管理
│   ├── plugins/                # 插件配置
│   ├── router/                 # 路由配置
│   ├── views/                  # 视图组件
│   │   ├── order/              # 工单管理
│   │   ├── rota/               # 排班管理
│   │   ├── task/               # 任务管理
│   │   ├── process/            # 流程管理
│   │   ├── system/             # 系统管理
│   │   ├── model/              # 模型管理
│   │   ├── resource/           # 资源管理
│   │   ├── terminal/           # 终端管理
│   │   └── search/             # 搜索功能
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口文件
├── types/                      # TypeScript 类型定义
├── deploy/                     # 部署配置
├── patches/                    # 补丁文件
├── package.json                # 项目配置
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── unocss.config.ts            # UnoCSS 配置
└── README.md                   # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 生产构建

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```


## 📦 部署

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t ecmdb-web .

# 运行容器
docker run -p 80:80 ecmdb-web
```


## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情


## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和开源社区。

---

**ECMDB Web** - 让企业配置管理更简单、更高效！