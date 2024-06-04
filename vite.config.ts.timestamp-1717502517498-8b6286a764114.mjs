// vite.config.ts
import { loadEnv } from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite@5.2.10_@types+node@20.12.7_sass@1.75.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/@vitejs+plugin-vue@5.0.4_vite@5.2.10_@types+node@20.12.7_sass@1.75.0__vue@3.4.25_typescript@5.4.5_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.1.0_vite@5.2.10_@types+node@20.12.7_sass@1.75.0__vue@3.4.25_typescript@5.4.5_/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import UnoCSS from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/unocss@0.59.4_postcss@5.2.18_rollup@4.17.0_vite@5.2.10_@types+node@20.12.7_sass@1.75.0_/node_modules/unocss/dist/vite.mjs";
import path, { resolve } from "path";
import svgLoader from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite-svg-loader@5.1.0_vue@3.4.25_typescript@5.4.5_/node_modules/vite-svg-loader/index.js";
import { createSvgIconsPlugin } from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_vite@5.2.10_@types+node@20.12.7_sass@1.75.0_/node_modules/vite-plugin-svg-icons/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/draken/Desktop/ecmdb-web";
var vite_config_default = ({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd());
  const { VITE_PUBLIC_PATH } = viteEnv;
  return {
    /** 打包时根据实际情况修改 base */
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        /** @ 符号指向 src 目录 */
        "@": resolve(__vite_injected_original_dirname, "./src")
      }
    },
    plugins: [
      vue(),
      vueJsx(),
      /** 将 SVG 静态图转化为 Vue 组件 */
      svgLoader({ defaultImport: "url" }),
      /** SVG */
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/icons/svg")],
        symbolId: "icon-[dir]-[name]"
      }),
      /** UnoCSS */
      UnoCSS()
    ],
    /** 混淆器 */
    esbuild: mode === "development" ? void 0 : {
      /** 打包时移除 console.log */
      pure: ["console.log"],
      /** 打包时移除 debugger */
      drop: ["debugger"],
      /** 打包时移除所有注释 */
      legalComments: "none"
    },
    server: {
      /** 设置 host: true 才可以使用 Network 的形式，以 IP 访问项目 */
      host: true,
      // host: "0.0.0.0"
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
        "/api": {
          target: "http://127.0.0.1:8000",
          ws: true,
          /** 是否允许跨域 */
          changeOrigin: true
        }
      },
      /** 预热常用文件，提高初始页面加载速度 */
      warmup: {
        clientFiles: ["./src/layouts/**/*.vue"]
      }
    },
    build: {
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: "static",
      rollupOptions: {
        output: {
          /**
           * 分块策略
           * 1. 注意这些包名必须存在，否则打包会报错
           * 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            element: ["element-plus", "@element-plus/icons-vue"],
            vxe: ["vxe-table", "vxe-table-plugin-element", "xe-utils"]
          }
        }
      }
    }
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZHJha2VuL0Rlc2t0b3AvZWNtZGItd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZHJha2VuL0Rlc2t0b3AvZWNtZGItd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kcmFrZW4vRGVza3RvcC9lY21kYi13ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB0eXBlIENvbmZpZ0VudiwgdHlwZSBVc2VyQ29uZmlnRXhwb3J0LCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIlxuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCJcbmltcG9ydCB2dWVKc3ggZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZS1qc3hcIlxuaW1wb3J0IFVub0NTUyBmcm9tIFwidW5vY3NzL3ZpdGVcIlxuaW1wb3J0IHBhdGgsIHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCJcbmltcG9ydCBzdmdMb2FkZXIgZnJvbSBcInZpdGUtc3ZnLWxvYWRlclwiXG5pbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdmctaWNvbnNcIlxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnRXhwb3J0ID0+IHtcbiAgY29uc3Qgdml0ZUVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSkgYXMgSW1wb3J0TWV0YUVudlxuICBjb25zdCB7IFZJVEVfUFVCTElDX1BBVEggfSA9IHZpdGVFbnZcbiAgcmV0dXJuIHtcbiAgICAvKiogXHU2MjUzXHU1MzA1XHU2NUY2XHU2ODM5XHU2MzZFXHU1QjlFXHU5NjQ1XHU2MEM1XHU1MUI1XHU0RkVFXHU2NTM5IGJhc2UgKi9cbiAgICBiYXNlOiBWSVRFX1BVQkxJQ19QQVRILFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIC8qKiBAIFx1N0IyNlx1NTNGN1x1NjMwN1x1NTQxMSBzcmMgXHU3NkVFXHU1RjU1ICovXG4gICAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKVxuICAgICAgfVxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICB2dWVKc3goKSxcbiAgICAgIC8qKiBcdTVDMDYgU1ZHIFx1OTc1OVx1NjAwMVx1NTZGRVx1OEY2Q1x1NTMxNlx1NEUzQSBWdWUgXHU3RUM0XHU0RUY2ICovXG4gICAgICBzdmdMb2FkZXIoeyBkZWZhdWx0SW1wb3J0OiBcInVybFwiIH0pLFxuICAgICAgLyoqIFNWRyAqL1xuICAgICAgY3JlYXRlU3ZnSWNvbnNQbHVnaW4oe1xuICAgICAgICBpY29uRGlyczogW3BhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBcInNyYy9pY29ucy9zdmdcIildLFxuICAgICAgICBzeW1ib2xJZDogXCJpY29uLVtkaXJdLVtuYW1lXVwiXG4gICAgICB9KSxcbiAgICAgIC8qKiBVbm9DU1MgKi9cbiAgICAgIFVub0NTUygpXG4gICAgXSxcbiAgICAvKiogXHU2REY3XHU2REM2XHU1NjY4ICovXG4gICAgZXNidWlsZDpcbiAgICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIlxuICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICA6IHtcbiAgICAgICAgICAgIC8qKiBcdTYyNTNcdTUzMDVcdTY1RjZcdTc5RkJcdTk2NjQgY29uc29sZS5sb2cgKi9cbiAgICAgICAgICAgIHB1cmU6IFtcImNvbnNvbGUubG9nXCJdLFxuICAgICAgICAgICAgLyoqIFx1NjI1M1x1NTMwNVx1NjVGNlx1NzlGQlx1OTY2NCBkZWJ1Z2dlciAqL1xuICAgICAgICAgICAgZHJvcDogW1wiZGVidWdnZXJcIl0sXG4gICAgICAgICAgICAvKiogXHU2MjUzXHU1MzA1XHU2NUY2XHU3OUZCXHU5NjY0XHU2MjQwXHU2NzA5XHU2Q0U4XHU5MUNBICovXG4gICAgICAgICAgICBsZWdhbENvbW1lbnRzOiBcIm5vbmVcIlxuICAgICAgICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICAvKiogXHU4QkJFXHU3RjZFIGhvc3Q6IHRydWUgXHU2MjREXHU1M0VGXHU0RUU1XHU0RjdGXHU3NTI4IE5ldHdvcmsgXHU3Njg0XHU1RjYyXHU1RjBGXHVGRjBDXHU0RUU1IElQIFx1OEJCRlx1OTVFRVx1OTg3OVx1NzZFRSAqL1xuICAgICAgaG9zdDogdHJ1ZSwgLy8gaG9zdDogXCIwLjAuMC4wXCJcbiAgICAgIC8qKiBcdTdBRUZcdTUzRTNcdTUzRjcgKi9cbiAgICAgIHBvcnQ6IDMzMzMsXG4gICAgICAvKiogXHU2NjJGXHU1NDI2XHU4MUVBXHU1MkE4XHU2MjUzXHU1RjAwXHU2RDRGXHU4OUM4XHU1NjY4ICovXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIC8qKiBcdThERThcdTU3REZcdThCQkVcdTdGNkVcdTUxNDFcdThCQjggKi9cbiAgICAgIGNvcnM6IHRydWUsXG4gICAgICAvKiogXHU3QUVGXHU1M0UzXHU4OEFCXHU1MzYwXHU3NTI4XHU2NUY2XHVGRjBDXHU2NjJGXHU1NDI2XHU3NkY0XHU2M0E1XHU5MDAwXHU1MUZBICovXG4gICAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICAgIC8qKiBcdTYzQTVcdTUzRTNcdTRFRTNcdTc0MDYgKi9cbiAgICAgIHByb3h5OiB7XG4gICAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiLFxuICAgICAgICAgIHdzOiB0cnVlLFxuICAgICAgICAgIC8qKiBcdTY2MkZcdTU0MjZcdTUxNDFcdThCQjhcdThERThcdTU3REYgKi9cbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8qKiBcdTk4ODRcdTcwRURcdTVFMzhcdTc1MjhcdTY1ODdcdTRFRjZcdUZGMENcdTYzRDBcdTlBRDhcdTUyMURcdTU5Q0JcdTk4NzVcdTk3NjJcdTUyQTBcdThGN0RcdTkwMUZcdTVFQTYgKi9cbiAgICAgIHdhcm11cDoge1xuICAgICAgICBjbGllbnRGaWxlczogW1wiLi9zcmMvbGF5b3V0cy8qKi8qLnZ1ZVwiXVxuICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIC8qKiBcdTUzNTVcdTRFMkEgY2h1bmsgXHU2NTg3XHU0RUY2XHU3Njg0XHU1OTI3XHU1QzBGXHU4RDg1XHU4RkM3IDIwNDhLQiBcdTY1RjZcdTUzRDFcdTUxRkFcdThCNjZcdTU0NEEgKi9cbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMjA0OCxcbiAgICAgIC8qKiBcdTc5ODFcdTc1MjggZ3ppcCBcdTUzOEJcdTdGMjlcdTU5MjdcdTVDMEZcdTYyQTVcdTU0NEEgKi9cbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgICAgIC8qKiBcdTYyNTNcdTUzMDVcdTU0MEVcdTk3NTlcdTYwMDFcdThENDRcdTZFOTBcdTc2RUVcdTVGNTUgKi9cbiAgICAgIGFzc2V0c0RpcjogXCJzdGF0aWNcIixcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogXHU1MjA2XHU1NzU3XHU3QjU2XHU3NTY1XG4gICAgICAgICAgICogMS4gXHU2Q0U4XHU2MTBGXHU4RkQ5XHU0RTlCXHU1MzA1XHU1NDBEXHU1RkM1XHU5ODdCXHU1QjU4XHU1NzI4XHVGRjBDXHU1NDI2XHU1MjE5XHU2MjUzXHU1MzA1XHU0RjFBXHU2MkE1XHU5NTE5XG4gICAgICAgICAgICogMi4gXHU1OTgyXHU2NzlDXHU0RjYwXHU0RTBEXHU2MEYzXHU4MUVBXHU1QjlBXHU0RTQ5IGNodW5rIFx1NTIwNlx1NTI3Mlx1N0I1Nlx1NzU2NVx1RkYwQ1x1NTNFRlx1NEVFNVx1NzZGNFx1NjNBNVx1NzlGQlx1OTY2NFx1OEZEOVx1NkJCNVx1OTE0RFx1N0Y2RVxuICAgICAgICAgICAqL1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgdnVlOiBbXCJ2dWVcIiwgXCJ2dWUtcm91dGVyXCIsIFwicGluaWFcIl0sXG4gICAgICAgICAgICBlbGVtZW50OiBbXCJlbGVtZW50LXBsdXNcIiwgXCJAZWxlbWVudC1wbHVzL2ljb25zLXZ1ZVwiXSxcbiAgICAgICAgICAgIHZ4ZTogW1widnhlLXRhYmxlXCIsIFwidnhlLXRhYmxlLXBsdWdpbi1lbGVtZW50XCIsIFwieGUtdXRpbHNcIl1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1EsU0FBZ0QsZUFBZTtBQUM5VSxPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sWUFBWTtBQUNuQixPQUFPLFFBQVEsZUFBZTtBQUM5QixPQUFPLGVBQWU7QUFDdEIsU0FBUyw0QkFBNEI7QUFOckMsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTyxzQkFBUSxDQUFDLEVBQUUsS0FBSyxNQUFtQztBQUN4RCxRQUFNLFVBQVUsUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQzNDLFFBQU0sRUFBRSxpQkFBaUIsSUFBSTtBQUM3QixTQUFPO0FBQUE7QUFBQSxJQUVMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQTtBQUFBLFFBRUwsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKLE9BQU87QUFBQTtBQUFBLE1BRVAsVUFBVSxFQUFFLGVBQWUsTUFBTSxDQUFDO0FBQUE7QUFBQSxNQUVsQyxxQkFBcUI7QUFBQSxRQUNuQixVQUFVLENBQUMsS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLGVBQWUsQ0FBQztBQUFBLFFBQ3ZELFVBQVU7QUFBQSxNQUNaLENBQUM7QUFBQTtBQUFBLE1BRUQsT0FBTztBQUFBLElBQ1Q7QUFBQTtBQUFBLElBRUEsU0FDRSxTQUFTLGdCQUNMLFNBQ0E7QUFBQTtBQUFBLE1BRUUsTUFBTSxDQUFDLGFBQWE7QUFBQTtBQUFBLE1BRXBCLE1BQU0sQ0FBQyxVQUFVO0FBQUE7QUFBQSxNQUVqQixlQUFlO0FBQUEsSUFDakI7QUFBQSxJQUNOLFFBQVE7QUFBQTtBQUFBLE1BRU4sTUFBTTtBQUFBO0FBQUE7QUFBQSxNQUVOLE1BQU07QUFBQTtBQUFBLE1BRU4sTUFBTTtBQUFBO0FBQUEsTUFFTixNQUFNO0FBQUE7QUFBQSxNQUVOLFlBQVk7QUFBQTtBQUFBLE1BRVosT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsSUFBSTtBQUFBO0FBQUEsVUFFSixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLFFBQVE7QUFBQSxRQUNOLGFBQWEsQ0FBQyx3QkFBd0I7QUFBQSxNQUN4QztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsdUJBQXVCO0FBQUE7QUFBQSxNQUV2QixzQkFBc0I7QUFBQTtBQUFBLE1BRXRCLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFNTixjQUFjO0FBQUEsWUFDWixLQUFLLENBQUMsT0FBTyxjQUFjLE9BQU87QUFBQSxZQUNsQyxTQUFTLENBQUMsZ0JBQWdCLHlCQUF5QjtBQUFBLFlBQ25ELEtBQUssQ0FBQyxhQUFhLDRCQUE0QixVQUFVO0FBQUEsVUFDM0Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
