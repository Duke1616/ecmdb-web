# ECMDB Web Agent Guide

本文件是仓库级开发指南。用户的明确要求优先于本文件；如果子目录新增了更具体的 `AGENTS.md`，以距离目标文件最近的规则为准。修改前先阅读目标模块的现有实现，保持与周围代码一致，不要按其他项目模板重构目录。

## 项目概览

- 技术栈：Vue 3.5、TypeScript 5.8、Vite 7、Vue Router 4、Pinia 3。
- UI 与基础设施：Element Plus、VXE Table、UnoCSS、SCSS、FormCreate、LogicFlow、CodeMirror、ECharts、FullCalendar 等。
- 包管理器：使用 `pnpm`，Docker 构建使用 Node 22 和 `pnpm@10`。
- 业务平台：CMDB、IAM、工单（Ticket）、自动化任务（Task）、告警（Alert），以及登录、导航、权限和布局等共享能力。
- 应用默认开发端口为 `3333`，Vite 配置了各后端服务和 MinIO 的代理。

## 常用命令

先执行 `pnpm install`。环境变量来自根目录 `.env`，只有以 `VITE_` 开头的变量会暴露给浏览器；不要把令牌、密码或真实环境配置提交到仓库。

```bash
pnpm dev             # 启动开发服务：http://localhost:3333
pnpm type-check      # vue-tsc 严格类型检查
pnpm build           # 类型检查并执行生产构建，输出 dist/
pnpm build-only      # 仅执行 Vite 构建
pnpm preview         # 预览 dist/
pnpm lint            # ESLint 检查并自动修复（会修改文件）
pnpm format          # 按 prettier.config.js 格式化 src/
pnpm exec vitest run # 运行全部单元测试；也可追加具体测试文件或 -t
```

提交前至少运行 `pnpm type-check`，并根据改动范围运行相关 Vitest 测试和 `pnpm build`。仓库没有 `pnpm test` 脚本，不要假设存在该命令。`pnpm lint` 会扫描部分生成/第三方静态文件；如果失败，区分本次改动与已有基线问题，不要为通过检查而大范围格式化无关文件。

## 目录边界

```text
src/api/{service}/       后端服务接口封装和类型（cmdb/iam/task/ticket/alert）
src/pages/{module}/       页面、页面私有组件、composables、utils 和局部类型
src/common/               跨业务共享的组件、composables、utils、常量、类型、鉴权
src/pinia/stores/         跨页面状态；仅在确有共享状态时新增 store
src/router/               常驻/动态路由、白名单、导航守卫
src/layouts/              应用布局、侧边栏、标签页和导航
src/plugins/              Element Plus、VXE、FormCreate、SVG 等插件注册
src/sse/                  SSE 客户端和任务流相关能力
types/                    全局和工具生成的类型声明
public/                   不经 Vite 处理的静态资源
deploy/                   Docker、Nginx、Compose 部署配置
```

- 新页面放在对应的 `src/pages/{module}`；只被该页面使用的组件和逻辑不要上移到 `src/common`。
- 新接口放在对应的 `src/api/{service}`，接口类型优先放在该服务或子功能的 `types` 目录中，避免跨服务混放。
- 复用已有的 `src/common/components`、composables 和工具；新增共享抽象前先确认至少有两个真实调用方。
- SVG 图标放在 `src/common/assets/icons`。`types/auto/auto-imports.d.ts`、`types/auto/components.d.ts` 和 SVG 声明由 Vite 插件生成，禁止手工维护；类型异常时重新运行 `pnpm dev` 或 `pnpm type-check`。
- `dist/`、`node_modules/`、`.pnpm-store/` 和生成声明不应作为手工修复目标。

## 导入与命名

- 使用 `@/*` 指向 `src/*`，使用 `@@/*` 指向 `src/common/*`；不要为同一模块混入深层相对路径。
- Vue 组件使用 PascalCase；组件目录通常使用 PascalCase，入口文件可使用 `index.vue`。页面文件沿用所在模块的现有命名风格，不要为了统一命名批量重命名旧文件。
- composable 使用 `useXxx`，函数和变量使用 camelCase，类型/接口使用 PascalCase，常量使用 UPPER_SNAKE_CASE。
- 优先 `import type` 导入纯类型；保留自动导入能力，但不要为了省几行代码扩大自动导入范围。

## Vue 与样式

- 新增 SFC 默认使用 `<script setup lang="ts">` 和 Composition API；复用现有组件的 props、emits 和 expose 设计。
- props 使用基于类型的声明并提供合理默认值；复杂模板表达式提取为 computed 或方法。
- `v-for` 必须使用稳定且唯一的 `key`；不要在同一元素上同时使用 `v-if` 和 `v-for`。
- 页面或组件样式优先使用 `<style scoped lang="scss">`；共享主题和变量放在 `src/common/assets/styles`。避免无必要的 `!important` 和直接操作 DOM。
- 优先使用 Element Plus、VXE Table 和现有通用组件，不要重复实现已有交互、表格、弹窗、选择器或权限按钮。
- 遵循现有 Prettier 配置：2 空格、双引号、无分号、120 列、无尾逗号。手动修改时不要引入与仓库不一致的格式。

## 接口、租户与权限

- 普通请求使用 `src/common/utils/service.ts` 导出的请求实例和 `API_SERVICE`，不要在页面中直接创建 Axios 实例。
- 服务前缀由 `VITE_*_API_PREFIX` 配置，请求 URL 通常写成 `API_SERVICE.TASK + "/..."` 这类服务前缀路径，由 `VITE_BASE_API` 和开发代理/Nginx 组合成 `/api/{service}/...`；先查看同一服务已有接口的写法。
- 请求拦截器会自动注入当前租户的 `X-Active-Tenant-ID`；临时嵌套租户作用域使用现有 `activeTenantStack`/相关 composable。只有明确需要覆盖时才显式设置该请求头。
- 统一处理认证、错误提示和 401 跳转，不要在单个页面复制 logout 或错误分支。上传、下载、Blob/ArrayBuffer 请求沿用请求工具的既有 `responseType` 处理。
- SSE/流式接口使用现有 SSE 工具或 `@microsoft/fetch-event-source` 封装，保持连接取消、重试、租户上下文和日志游标语义；任务流路径遵循 `/api/task/streams/` 约定。
- 权限判断优先复用 `src/common/auth`、`usePermission`、`AuthButton`/`HasPermission` 和权限指令。新增菜单、路由或操作按钮时同时确认后端 capability、动态路由和前端显示条件。
- 动态路由由 `src/router/guard.ts` 和 Pinia permission store 负责；不要在页面中自行绕过导航守卫或直接清除 Token。

## 状态与数据流

- 跨页面且需要持久化/共享的数据放入对应 Pinia store；页面局部查询、分页、弹窗和表单状态优先留在 composable 或页面组件中。
- 优先使用 Setup Store 风格，并复用现有 store hook（例如 `useUserStoreHook`）处理组件外调用。
- 列表页面沿用现有分页、刷新、加载和空态模式；异步操作需要处理 loading、错误和重复点击，成功后刷新受影响的数据。
- 表单保存前做前端校验，提交后以接口返回为准更新状态；不要通过本地乐观修改掩盖后端失败。

## 测试

- 测试与被测模块就近放置，文件名使用 `*.test.ts`；当前测试主要覆盖 API 构造、composable、store、解析器、SSE 和任务/工单规则。
- 对纯函数、数据转换、权限分支、请求路径/请求头、流式连接结束和错误分支优先补 Vitest 单测；修复 bug 时添加能复现回归的用例。
- 测试中 mock 外部请求、Pinia 和浏览器能力，不要依赖真实后端、真实租户或本地服务。
- 修改 UI 交互时至少手动验证受影响页面的加载、空态、错误态、权限态和关键操作；当前仓库没有默认 E2E 脚本。

## 构建与部署注意事项

- `vite.config.ts` 同时负责路径别名、自动导入、组件解析、SVG 声明、UnoCSS、压缩、开发代理和 Vue MCP；修改插件配置后留意生成类型和构建产物。
- 生产环境通过 `deploy/Dockerfile` 构建并由 Nginx 托管 `dist/`。HTML5 history 依赖 Nginx 回退到 `index.html`，带 hash 的静态资源按长期缓存策略处理。
- 修改 `VITE_PUBLIC_PATH`、服务地址或代理前缀时，同时检查 `vite.config.ts`、`deploy/nginx.conf` 和 README 中的说明。
- 修改 `patches/` 或依赖版本时，确认 `pnpm-lock.yaml` 与安装结果一致，并执行类型检查和生产构建。

## Git 与交付

- 不要自动提交、推送、创建分支或修改用户未要求的文件。
- 提交信息沿用 `type: message`：`feat`、`fix`、`perf`、`refactor`、`docs`、`types`、`test`、`ci`、`revert`、`chore`。
- 保持变更小而完整；不要顺手升级依赖、重排目录或格式化整仓库。
- 完成后说明修改文件、验证命令及结果；如果验证因已有问题失败，明确指出失败位置和是否与本次改动相关。
