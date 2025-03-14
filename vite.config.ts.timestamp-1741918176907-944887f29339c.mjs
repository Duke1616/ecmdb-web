// vite.config.ts
import { loadEnv } from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite@5.2.10_@types+node@20.12.7_sass@1.75.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/@vitejs+plugin-vue@5.0.4_vite@5.2.10_@types+node@20.12.7_sass@1.75.0__vue@3.4.25_typescript@5.4.5_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.1.0_vite@5.2.10_@types+node@20.12.7_sass@1.75.0__vue@3.4.25_typescript@5.4.5_/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import UnoCSS from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/unocss@0.59.4_postcss@5.2.18_rollup@4.17.0_vite@5.2.10_@types+node@20.12.7_sass@1.75.0_/node_modules/unocss/dist/vite.mjs";
import path, { resolve } from "path";
import svgLoader from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite-svg-loader@5.1.0_vue@3.4.25_typescript@5.4.5_/node_modules/vite-svg-loader/index.js";
import { createSvgIconsPlugin } from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_vite@5.2.10_@types+node@20.12.7_sass@1.75.0_/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import prismjs from "file:///Users/draken/Desktop/ecmdb-web/node_modules/.pnpm/vite-plugin-prismjs@0.0.11_prismjs@1.29.0/node_modules/vite-plugin-prismjs/dist/index.js";
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
      // vueDevTools(),
      vueJsx(),
      /** 将 SVG 静态图转化为 Vue 组件 */
      svgLoader({ defaultImport: "url" }),
      /** SVG */
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/icons/svg")],
        symbolId: "icon-[dir]-[name]"
      }),
      // visualizer({
      //   open: true // 构建完成后自动打开分析页面
      // }),
      /** UnoCSS */
      UnoCSS(),
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
      })
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
          target: `http://${viteEnv.VITE_ECMDB_API}`,
          ws: true,
          /** 是否允许跨域 */
          changeOrigin: true
        },
        "/minio": {
          target: `http://${viteEnv.VITE_MINIO_ENDPOINT}`,
          changeOrigin: true,
          ws: true,
          rewrite: (path2) => path2.replace("/minio", "")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZHJha2VuL0Rlc2t0b3AvZWNtZGItd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZHJha2VuL0Rlc2t0b3AvZWNtZGItd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kcmFrZW4vRGVza3RvcC9lY21kYi13ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB0eXBlIENvbmZpZ0VudiwgdHlwZSBVc2VyQ29uZmlnRXhwb3J0LCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIlxuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCJcbmltcG9ydCB2dWVKc3ggZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZS1qc3hcIlxuaW1wb3J0IFVub0NTUyBmcm9tIFwidW5vY3NzL3ZpdGVcIlxuaW1wb3J0IHBhdGgsIHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCJcbmltcG9ydCBzdmdMb2FkZXIgZnJvbSBcInZpdGUtc3ZnLWxvYWRlclwiXG5pbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdmctaWNvbnNcIlxuaW1wb3J0IHByaXNtanMgZnJvbSBcInZpdGUtcGx1Z2luLXByaXNtanNcIlxuLy8gaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIlxuLy8gaW1wb3J0IHZ1ZURldlRvb2xzIGZyb20gXCJ2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHNcIlxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnRXhwb3J0ID0+IHtcbiAgY29uc3Qgdml0ZUVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSkgYXMgSW1wb3J0TWV0YUVudlxuICBjb25zdCB7IFZJVEVfUFVCTElDX1BBVEggfSA9IHZpdGVFbnZcbiAgcmV0dXJuIHtcbiAgICAvKiogXHU2MjUzXHU1MzA1XHU2NUY2XHU2ODM5XHU2MzZFXHU1QjlFXHU5NjQ1XHU2MEM1XHU1MUI1XHU0RkVFXHU2NTM5IGJhc2UgKi9cbiAgICBiYXNlOiBWSVRFX1BVQkxJQ19QQVRILFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIC8qKiBAIFx1N0IyNlx1NTNGN1x1NjMwN1x1NTQxMSBzcmMgXHU3NkVFXHU1RjU1ICovXG4gICAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKVxuICAgICAgfVxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICAvLyB2dWVEZXZUb29scygpLFxuICAgICAgdnVlSnN4KCksXG4gICAgICAvKiogXHU1QzA2IFNWRyBcdTk3NTlcdTYwMDFcdTU2RkVcdThGNkNcdTUzMTZcdTRFM0EgVnVlIFx1N0VDNFx1NEVGNiAqL1xuICAgICAgc3ZnTG9hZGVyKHsgZGVmYXVsdEltcG9ydDogXCJ1cmxcIiB9KSxcbiAgICAgIC8qKiBTVkcgKi9cbiAgICAgIGNyZWF0ZVN2Z0ljb25zUGx1Z2luKHtcbiAgICAgICAgaWNvbkRpcnM6IFtwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCJzcmMvaWNvbnMvc3ZnXCIpXSxcbiAgICAgICAgc3ltYm9sSWQ6IFwiaWNvbi1bZGlyXS1bbmFtZV1cIlxuICAgICAgfSksXG4gICAgICAvLyB2aXN1YWxpemVyKHtcbiAgICAgIC8vICAgb3BlbjogdHJ1ZSAvLyBcdTY3ODRcdTVFRkFcdTVCOENcdTYyMTBcdTU0MEVcdTgxRUFcdTUyQThcdTYyNTNcdTVGMDBcdTUyMDZcdTY3OTBcdTk4NzVcdTk3NjJcbiAgICAgIC8vIH0pLFxuICAgICAgLyoqIFVub0NTUyAqL1xuICAgICAgVW5vQ1NTKCksXG4gICAgICBwcmlzbWpzKHtcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJqYXZhc2NyaXB0XCIsIFwiY3NzXCIsIFwiaHRtbFwiLCBcImpzb25cIiwgXCJzYXNzXCIsIFwic2Nzc1wiLCBcIm1kXCIsIFwiYmFzaFwiLCBcInNoZWxsXCIsIFwidHNcIl0sXG4gICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICBcInRvb2xiYXJcIixcbiAgICAgICAgICBcInNob3ctbGFuZ3VhZ2VcIixcbiAgICAgICAgICBcImNvcHktdG8tY2xpcGJvYXJkXCIsXG4gICAgICAgICAgXCJub3JtYWxpemUtd2hpdGVzcGFjZVwiLFxuICAgICAgICAgIFwibGluZS1udW1iZXJzXCIsXG4gICAgICAgICAgXCJ1bmVzY2FwZWQtbWFya3VwXCJcbiAgICAgICAgXSxcbiAgICAgICAgdGhlbWU6IFwidG9tb3Jyb3dcIixcbiAgICAgICAgY3NzOiB0cnVlXG4gICAgICB9KVxuICAgIF0sXG4gICAgLyoqIFx1NkRGN1x1NkRDNlx1NTY2OCAqL1xuICAgIGVzYnVpbGQ6XG4gICAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCJcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiB7XG4gICAgICAgICAgICAvKiogXHU2MjUzXHU1MzA1XHU2NUY2XHU3OUZCXHU5NjY0IGNvbnNvbGUubG9nICovXG4gICAgICAgICAgICBwdXJlOiBbXCJjb25zb2xlLmxvZ1wiXSxcbiAgICAgICAgICAgIC8qKiBcdTYyNTNcdTUzMDVcdTY1RjZcdTc5RkJcdTk2NjQgZGVidWdnZXIgKi9cbiAgICAgICAgICAgIGRyb3A6IFtcImRlYnVnZ2VyXCJdLFxuICAgICAgICAgICAgLyoqIFx1NjI1M1x1NTMwNVx1NjVGNlx1NzlGQlx1OTY2NFx1NjI0MFx1NjcwOVx1NkNFOFx1OTFDQSAqL1xuICAgICAgICAgICAgbGVnYWxDb21tZW50czogXCJub25lXCJcbiAgICAgICAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgLyoqIFx1OEJCRVx1N0Y2RSBob3N0OiB0cnVlIFx1NjI0RFx1NTNFRlx1NEVFNVx1NEY3Rlx1NzUyOCBOZXR3b3JrIFx1NzY4NFx1NUY2Mlx1NUYwRlx1RkYwQ1x1NEVFNSBJUCBcdThCQkZcdTk1RUVcdTk4NzlcdTc2RUUgKi9cbiAgICAgIGhvc3Q6IHRydWUsIC8vIGhvc3Q6IFwiMC4wLjAuMFwiXG4gICAgICAvKiogXHU3QUVGXHU1M0UzXHU1M0Y3ICovXG4gICAgICBwb3J0OiAzMzMzLFxuICAgICAgLyoqIFx1NjYyRlx1NTQyNlx1ODFFQVx1NTJBOFx1NjI1M1x1NUYwMFx1NkQ0Rlx1ODlDOFx1NTY2OCAqL1xuICAgICAgb3BlbjogZmFsc2UsXG4gICAgICAvKiogXHU4REU4XHU1N0RGXHU4QkJFXHU3RjZFXHU1MTQxXHU4QkI4ICovXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgLyoqIFx1N0FFRlx1NTNFM1x1ODhBQlx1NTM2MFx1NzUyOFx1NjVGNlx1RkYwQ1x1NjYyRlx1NTQyNlx1NzZGNFx1NjNBNVx1OTAwMFx1NTFGQSAqL1xuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICAvKiogXHU2M0E1XHU1M0UzXHU0RUUzXHU3NDA2ICovXG4gICAgICBwcm94eToge1xuICAgICAgICBcIi9hcGlcIjoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHA6Ly8ke3ZpdGVFbnYuVklURV9FQ01EQl9BUEl9YCxcbiAgICAgICAgICB3czogdHJ1ZSxcbiAgICAgICAgICAvKiogXHU2NjJGXHU1NDI2XHU1MTQxXHU4QkI4XHU4REU4XHU1N0RGICovXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIFwiL21pbmlvXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IGBodHRwOi8vJHt2aXRlRW52LlZJVEVfTUlOSU9fRU5EUE9JTlR9YCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgd3M6IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZShcIi9taW5pb1wiLCBcIlwiKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLyoqIFx1OTg4NFx1NzBFRFx1NUUzOFx1NzUyOFx1NjU4N1x1NEVGNlx1RkYwQ1x1NjNEMFx1OUFEOFx1NTIxRFx1NTlDQlx1OTg3NVx1OTc2Mlx1NTJBMFx1OEY3RFx1OTAxRlx1NUVBNiAqL1xuICAgICAgd2FybXVwOiB7XG4gICAgICAgIGNsaWVudEZpbGVzOiBbXCIuL3NyYy9sYXlvdXRzLyoqLyoudnVlXCJdXG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgLyoqIFx1NTM1NVx1NEUyQSBjaHVuayBcdTY1ODdcdTRFRjZcdTc2ODRcdTU5MjdcdTVDMEZcdThEODVcdThGQzcgMjA0OEtCIFx1NjVGNlx1NTNEMVx1NTFGQVx1OEI2Nlx1NTQ0QSAqL1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDQ4LFxuICAgICAgLyoqIFx1Nzk4MVx1NzUyOCBnemlwIFx1NTM4Qlx1N0YyOVx1NTkyN1x1NUMwRlx1NjJBNVx1NTQ0QSAqL1xuICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuICAgICAgLyoqIFx1NjI1M1x1NTMwNVx1NTQwRVx1OTc1OVx1NjAwMVx1OEQ0NFx1NkU5MFx1NzZFRVx1NUY1NSAqL1xuICAgICAgYXNzZXRzRGlyOiBcInN0YXRpY1wiLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBcdTUyMDZcdTU3NTdcdTdCNTZcdTc1NjVcbiAgICAgICAgICAgKiAxLiBcdTZDRThcdTYxMEZcdThGRDlcdTRFOUJcdTUzMDVcdTU0MERcdTVGQzVcdTk4N0JcdTVCNThcdTU3MjhcdUZGMENcdTU0MjZcdTUyMTlcdTYyNTNcdTUzMDVcdTRGMUFcdTYyQTVcdTk1MTlcbiAgICAgICAgICAgKiAyLiBcdTU5ODJcdTY3OUNcdTRGNjBcdTRFMERcdTYwRjNcdTgxRUFcdTVCOUFcdTRFNDkgY2h1bmsgXHU1MjA2XHU1MjcyXHU3QjU2XHU3NTY1XHVGRjBDXHU1M0VGXHU0RUU1XHU3NkY0XHU2M0E1XHU3OUZCXHU5NjY0XHU4RkQ5XHU2QkI1XHU5MTREXHU3RjZFXG4gICAgICAgICAgICovXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICB2dWU6IFtcInZ1ZVwiLCBcInZ1ZS1yb3V0ZXJcIiwgXCJwaW5pYVwiXSxcbiAgICAgICAgICAgIGVsZW1lbnQ6IFtcImVsZW1lbnQtcGx1c1wiLCBcIkBlbGVtZW50LXBsdXMvaWNvbnMtdnVlXCJdLFxuICAgICAgICAgICAgdnhlOiBbXCJ2eGUtdGFibGVcIiwgXCJ2eGUtdGFibGUtcGx1Z2luLWVsZW1lbnRcIiwgXCJ4ZS11dGlsc1wiXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErUSxTQUFnRCxlQUFlO0FBQzlVLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sUUFBUSxlQUFlO0FBQzlCLE9BQU8sZUFBZTtBQUN0QixTQUFTLDRCQUE0QjtBQUNyQyxPQUFPLGFBQWE7QUFQcEIsSUFBTSxtQ0FBbUM7QUFZekMsSUFBTyxzQkFBUSxDQUFDLEVBQUUsS0FBSyxNQUFtQztBQUN4RCxRQUFNLFVBQVUsUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQzNDLFFBQU0sRUFBRSxpQkFBaUIsSUFBSTtBQUM3QixTQUFPO0FBQUE7QUFBQSxJQUVMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQTtBQUFBLFFBRUwsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQTtBQUFBLE1BRUosT0FBTztBQUFBO0FBQUEsTUFFUCxVQUFVLEVBQUUsZUFBZSxNQUFNLENBQUM7QUFBQTtBQUFBLE1BRWxDLHFCQUFxQjtBQUFBLFFBQ25CLFVBQVUsQ0FBQyxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsZUFBZSxDQUFDO0FBQUEsUUFDdkQsVUFBVTtBQUFBLE1BQ1osQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLRCxPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsUUFDTixXQUFXLENBQUMsY0FBYyxPQUFPLFFBQVEsUUFBUSxRQUFRLFFBQVEsTUFBTSxRQUFRLFNBQVMsSUFBSTtBQUFBLFFBQzVGLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBO0FBQUEsSUFFQSxTQUNFLFNBQVMsZ0JBQ0wsU0FDQTtBQUFBO0FBQUEsTUFFRSxNQUFNLENBQUMsYUFBYTtBQUFBO0FBQUEsTUFFcEIsTUFBTSxDQUFDLFVBQVU7QUFBQTtBQUFBLE1BRWpCLGVBQWU7QUFBQSxJQUNqQjtBQUFBLElBQ04sUUFBUTtBQUFBO0FBQUEsTUFFTixNQUFNO0FBQUE7QUFBQTtBQUFBLE1BRU4sTUFBTTtBQUFBO0FBQUEsTUFFTixNQUFNO0FBQUE7QUFBQSxNQUVOLE1BQU07QUFBQTtBQUFBLE1BRU4sWUFBWTtBQUFBO0FBQUEsTUFFWixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLFVBQVUsUUFBUSxjQUFjO0FBQUEsVUFDeEMsSUFBSTtBQUFBO0FBQUEsVUFFSixjQUFjO0FBQUEsUUFDaEI7QUFBQSxRQUNBLFVBQVU7QUFBQSxVQUNSLFFBQVEsVUFBVSxRQUFRLG1CQUFtQjtBQUFBLFVBQzdDLGNBQWM7QUFBQSxVQUNkLElBQUk7QUFBQSxVQUNKLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQzlDO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSxRQUFRO0FBQUEsUUFDTixhQUFhLENBQUMsd0JBQXdCO0FBQUEsTUFDeEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxNQUVMLHVCQUF1QjtBQUFBO0FBQUEsTUFFdkIsc0JBQXNCO0FBQUE7QUFBQSxNQUV0QixXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFVBTU4sY0FBYztBQUFBLFlBQ1osS0FBSyxDQUFDLE9BQU8sY0FBYyxPQUFPO0FBQUEsWUFDbEMsU0FBUyxDQUFDLGdCQUFnQix5QkFBeUI7QUFBQSxZQUNuRCxLQUFLLENBQUMsYUFBYSw0QkFBNEIsVUFBVTtBQUFBLFVBQzNEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJwYXRoIl0KfQo=
