import { type ConfigEnv, type UserConfigExport, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import UnoCSS from "unocss/vite"

// import path from "path"
// import { createSvgIconsPlugin } from "vite-plugin-svg-icons"

import { resolve } from "path"
import AutoImport from "unplugin-auto-import/vite"
import SvgComponent from "unplugin-svg-component/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"
import svgLoader from "vite-svg-loader"
import prismjs from "vite-plugin-prismjs"
import { VueMcp } from "vite-plugin-vue-mcp"
import { visualizer } from "rollup-plugin-visualizer"
// import vueDevTools from "vite-plugin-vue-devtools"

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv): UserConfigExport => {
  const viteEnv = loadEnv(mode, process.cwd()) as ImportMetaEnv
  const { VITE_PUBLIC_PATH } = viteEnv
  return {
    /** 打包时根据实际情况修改 base */
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        // @ 符号指向 src 目录
        "@": resolve(__dirname, "src"),
        // @@ 符号指向 src/common 通用目录
        "@@": resolve(__dirname, "src/common")
      }
    },
    plugins: [
      vue(),
      visualizer({
        open: true // 构建完成后自动打开分析页面
      }),
      // vueDevTools(),
      vueJsx(),
      // 支持将 SVG 文件导入为 Vue 组件
      svgLoader({
        defaultImport: "url",
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  // @see https://github.com/svg/svgo/issues/1128
                  removeViewBox: false
                }
              }
            }
          ]
        }
      }),
      // vite-plugin-svg-icons 插件使用方式，在当前项目中已经弃用
      // createSvgIconsPlugin({
      //   iconDirs: [path.resolve(process.cwd(), "src/common/assets/icons")],
      //   symbolId: "icon-[dir]-[name]"
      // }),
      // 自动生成 SvgIcon 组件和 SVG 雪碧图
      SvgComponent({
        iconDir: [resolve(__dirname, "src/common/assets/icons")],
        preserveColor: resolve(__dirname, "src/common/assets/icons/preserve-color"),
        dts: true,
        dtsDir: resolve(__dirname, "types/auto")
      }),
      // 原子化 CSS
      UnoCSS(),
      // 自动按需导入 API
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        dts: "types/auto/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()]
      }),
      // 自动按需导入组件
      Components({
        dts: "types/auto/components.d.ts",
        resolvers: [
          ElementPlusResolver({
            importStyle: "css" // 使用 css 样式
          })
        ]
      }),
      prismjs({
        languages: ["javascript", "css", "html", "json", "sass", "scss", "md", "bash", "shell", "ts"],
        plugins: [
          "toolbar",
          "show-language",
          "copy-to-clipboard",
          "normalize-whitespace",
          "line-numbers",
          "unescaped-markup"
        ],
        theme: "tomorrow",
        css: true
      }),
      // 为项目开启 MCP Server
      VueMcp()
    ],
    /** 混淆器 */
    esbuild:
      mode === "development"
        ? undefined
        : {
            /** 打包时移除 console.log */
            pure: ["console.log"],
            /** 打包时移除 debugger */
            drop: ["debugger"],
            /** 打包时移除所有注释 */
            legalComments: "none"
          },
    // 依赖预构建
    optimizeDeps: {
      include: ["element-plus/es/components/*/style/css", "vue", "vue-router", "pinia", "axios", "lodash-es", "dayjs"],
      exclude: ["@logicflow/core", "relation-graph", "guacamole-common-js"]
    },
    // CSS 相关配置
    css: {
      // 线程中运行 CSS 预处理器
      preprocessorMaxWorkers: true
    },
    server: {
      /** 设置 host: true 才可以使用 Network 的形式，以 IP 访问项目 */
      host: true, // host: "0.0.0.0"
      /** 端口号 */
      port: 3333,
      /** 是否自动打开浏览器 */
      open: false,
      /** 跨域设置允许 */
      cors: true,
      /** 端口被占用时，是否直接退出 */
      strictPort: false,
      /** 接口代理 */
      proxy: {
        "/api/cmdb": {
          target: `http://${viteEnv.VITE_ECMDB_API}`,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cmdb/, "/api")
        },
        "/api/alert": {
          target: `http://${viteEnv.VITE_ALERT_API}`,
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/alert/, "/api")
        },
        "/minio": {
          target: `http://${viteEnv.VITE_MINIO_ENDPOINT}`,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace("/minio", "")
        }
      },
      /** 预热常用文件，提高初始页面加载速度 */
      warmup: {
        clientFiles: ["./src/layouts/**/*.vue", "./src/common/components/**/*.vue", "./src/App.vue"]
      }
    },
    build: {
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: "static",
      /** 启用 CSS 代码分割 */
      cssCodeSplit: true,
      /** 压缩配置 */
      minify: "esbuild",
      rollupOptions: {
        output: {
          /**
           * 分块策略
           * 1. 注意这些包名必须存在，否则打包会报错
           * 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: (id) => {
            // 核心框架
            if (id.includes("vue") || id.includes("vue-router") || id.includes("pinia")) {
              return "vue-core"
            }
            // Element Plus
            if (id.includes("element-plus") || id.includes("@element-plus")) {
              return "element-plus"
            }
            // VXE Table
            if (id.includes("vxe-table") || id.includes("xe-utils")) {
              return "vxe-table"
            }
            // 代码编辑器相关
            if (id.includes("codemirror") || id.includes("@codemirror")) {
              return "codemirror"
            }
            // 图表和可视化
            if (id.includes("@logicflow") || id.includes("relation-graph")) {
              return "charts"
            }
            // 表单相关
            if (id.includes("@form-create")) {
              return "form-create"
            }
            // 日历组件
            if (id.includes("@fullcalendar")) {
              return "fullcalendar"
            }
            // 工具库
            if (id.includes("lodash") || id.includes("dayjs") || id.includes("axios")) {
              return "utils"
            }
            // 其他第三方库
            if (id.includes("node_modules")) {
              return "vendor"
            }
          }
        }
      }
    }
  }
}
