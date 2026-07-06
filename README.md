# ECMDB Web

ECMDB Web 是 ECMDB 平台的前端工程，基于 Vue 3、TypeScript、Vite 和 Element Plus 构建。项目负责聚合 CMDB、IAM、工单、自动化任务、告警等后端服务，提供统一的登录、导航、权限、表单、流程和运维操作入口。

## 项目模块

- CMDB：模型、资源实例、关系类型、关系图、搜索、终端和插件页面。
- IAM：用户、角色、策略、授权、部门、用户组、租户和身份源管理。
- 工单：工单发起、审批管理、模板、流程、任务历史和表单预览。
- 自动化任务：执行器、Runner、Codebook、变量和任务管理。
- 告警：当前告警、历史告警、规则、数据源、升级策略、值班、团队和工作空间。
- 基础能力：登录、租户选择、动态导航、权限指令、标签页、侧边栏、主题、缓存和通用组件。

## 技术栈

- Vue 3.5、TypeScript 5.8、Vite 7
- Vue Router 4、Pinia 3
- Element Plus、VXE Table、UnoCSS、SCSS
- FormCreate、LogicFlow、CodeMirror、FullCalendar、ECharts、XTerm.js
- Axios、SSE、js-cookie、pinia-plugin-persistedstate
- unplugin-auto-import、unplugin-vue-components、unplugin-svg-component

## 环境要求

- Node.js 22 推荐，最低建议使用 Node.js 20+
- pnpm 10 推荐，项目 Docker 构建中使用 `pnpm@10`

首次安装：

```bash
pnpm install
```

## 本地开发

启动开发服务：

```bash
pnpm dev
```

默认地址：

```text
http://localhost:3333
```

常用命令：

```bash
pnpm dev          # 启动 Vite 开发服务
pnpm build        # 类型检查并构建生产包
pnpm build-only   # 仅执行 Vite 构建
pnpm preview      # 预览构建产物
pnpm type-check   # Vue/TypeScript 类型检查
pnpm lint         # ESLint 检查并自动修复
pnpm format       # 格式化 src 目录
```

## 环境变量

环境变量定义在 `.env`，变量名必须以 `VITE_` 开头。

主要配置：

```env
VITE_APP_TITLE=ECMDB
VITE_BASE_API=/api

VITE_ECMDB_API_PREFIX=cmdb
VITE_TASK_API_PREFIX=task
VITE_IAM_API_PREFIX=iam
VITE_ALERT_API_PREFIX=alert
VITE_TICKET_API_PREFIX=ticket

VITE_ECMDB_API=127.0.0.1:8000
VITE_TICKET_API=127.0.0.1:8005
VITE_ALERT_API=127.0.0.1:8006
VITE_TASK_API=127.0.0.1:8765
VITE_IAM_API=127.0.0.1:9000

VITE_ROUTER_HISTORY=html5
VITE_PUBLIC_PATH=/
VITE_MINIO_ENDPOINT=10.31.0.200:9000
VITE_FEISHU_SOURCE_ID=feishu
```

开发环境代理由 `vite.config.ts` 维护：

- `/api/cmdb` -> `VITE_ECMDB_API`
- `/api/ticket` -> `VITE_TICKET_API`
- `/api/alert` -> `VITE_ALERT_API`
- `/api/task` -> `VITE_TASK_API`
- `/api/iam` -> `VITE_IAM_API`
- `/minio` -> `VITE_MINIO_ENDPOINT`

各代理会把前缀重写为后端标准 `/api`，例如 `/api/ticket/pass` 会转发为工单服务的 `/api/pass`。

## 目录结构

```text
.
├── deploy/                    # Docker、Nginx 和 Compose 部署配置
├── public/                    # 静态资源
├── src/
│   ├── api/                   # 按后端服务拆分的接口封装
│   │   ├── alert/
│   │   ├── cmdb/
│   │   ├── iam/
│   │   ├── task/
│   │   └── ticket/
│   ├── common/                # 跨模块共享能力
│   │   ├── apis/
│   │   ├── assets/
│   │   ├── auth/              # capability、权限配置
│   │   ├── components/
│   │   ├── composables/
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   ├── directives/            # 权限、交互等自定义指令
│   ├── layouts/               # 应用布局、侧边栏、标签页等
│   ├── pages/                 # 页面模块
│   │   ├── alert/
│   │   ├── change/
│   │   ├── cmdb/
│   │   ├── iam/
│   │   ├── login/
│   │   ├── navigation/
│   │   ├── task/
│   │   └── ticket/
│   ├── pinia/                 # Pinia stores
│   ├── plugins/               # Element Plus、VXE、FormCreate、SVG 等插件注册
│   ├── router/                # 路由、守卫、白名单和模块路由
│   ├── sse/                   # SSE 客户端能力
│   ├── App.vue
│   └── main.ts
├── types/auto/                # 自动生成的导入和组件类型声明
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 开发约定

- 页面代码放在 `src/pages/{module}`，通用能力优先放在 `src/common`。
- 后端接口按服务放在 `src/api/{service}`，避免跨服务混放。
- 共享状态放在 `src/pinia/stores`，页面局部状态优先使用 composable。
- 权限相关能力优先复用 `src/common/auth` 和权限指令。
- SVG 图标放在 `src/common/assets/icons`，构建时会生成组件声明到 `types/auto`。
- `types/auto/auto-imports.d.ts` 和 `types/auto/components.d.ts` 由插件生成，类型异常时可重新运行 `pnpm dev` 或 `pnpm type-check`。

## 构建与部署

生产构建：

```bash
pnpm build
```

构建产物输出到 `dist/`。

Docker 构建：

```bash
docker build -f deploy/Dockerfile -t ecmdb-web .
```

Compose 部署参考：

```bash
cd deploy
docker compose up -d
```

`deploy/nginx.conf` 中已经配置：

- HTML5 history 路由回退到 `index.html`
- `/api/cmdb`、`/api/ticket`、`/api/alert`、`/api/task`、`/api/iam` 后端代理
- `/minio` 文件服务代理
- Brotli/Gzip 静态资源压缩
- `index.html` 禁用缓存，带 hash 的静态资源长期缓存

## 排查建议

- 接口 404：先确认请求前缀是否为 `/api/{service}`，再确认 Vite/Nginx rewrite 后的后端路径。
- 登录或租户异常：检查 IAM 服务地址、Cookie 域、后端会话和 `VITE_IAM_API`。
- 页面空白：优先运行 `pnpm type-check`，并检查自动生成的 `types/auto` 类型声明。
- 构建资源访问异常：确认 `VITE_PUBLIC_PATH` 和 Nginx `try_files` 配置是否匹配部署路径。
