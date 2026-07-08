import * as Vue from "vue"
import * as VueRouter from "vue-router"
import * as Pinia from "pinia"
import * as ElementPlus from "element-plus"

const loadedScripts = new Set<string>()
const loadedStyles = new Set<string>()
const loadedModules = new Map<string, any>()

const moduleCacheKey = (globalName: string, url: string) => `${globalName}@@${url}`

// 挂载公共依赖至全局，供动态加载的 UMD 插件消费
const ensurePluginSharedGlobals = () => {
  ;(window as any).Vue = Vue
  ;(window as any).VueRouter = VueRouter
  ;(window as any).Pinia = Pinia
  ;(window as any).ElementPlus = ElementPlus
}

// NOTE: 该 Composable 用于统一管理 UMD 静态插件 JS/CSS 资源的拉取、去重与模块解析
export function usePluginLoader() {
  const loading = Vue.ref(false)
  const error = Vue.ref<string | null>(null)
  const resolvedComponent = Vue.shallowRef<any>(null)

  // 动态加载 CSS
  const loadCss = (url: string, globalName: string) => {
    if (loadedStyles.has(url) || document.querySelector(`link[href="${url}"]`)) return

    const resolvedUrl = new URL(url, window.location.href).href
    document.querySelectorAll<HTMLLinkElement>(`link[data-plugin-global="${globalName}"]`).forEach((link) => {
      if (link.href !== resolvedUrl) {
        loadedStyles.delete(link.getAttribute("href") || "")
        link.remove()
      }
    })

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    link.dataset.pluginGlobal = globalName
    document.head.appendChild(link)
    loadedStyles.add(url)
  }

  // 动态加载 UMD JS 并解析模块
  const loadJs = (url: string, globalName: string): Promise<any> => {
    ensurePluginSharedGlobals()

    return new Promise((resolve, reject) => {
      const key = moduleCacheKey(globalName, url)
      const cachedModule = loadedModules.get(key)
      if (cachedModule) {
        resolve(cachedModule)
        return
      }

      const resolvedUrl = new URL(url, window.location.href).href
      document.querySelectorAll<HTMLScriptElement>(`script[data-plugin-global="${globalName}"]`).forEach((script) => {
        if (script.src !== resolvedUrl) {
          loadedScripts.delete(script.getAttribute("src") || "")
          script.remove()
        }
      })

      const script = document.createElement("script")
      script.type = "text/javascript"
      script.src = url
      script.async = true
      script.dataset.pluginGlobal = globalName

      script.onload = () => {
        const module = (window as any)[globalName]
        if (module) {
          loadedScripts.add(url)
          loadedModules.set(key, module)
          resolve(module)
        } else {
          reject(new Error(`JS加载成功，但 window 上未找到全局变量: ${globalName}`))
        }
      }

      script.onerror = () => {
        reject(new Error(`插件静态资源脚本加载失败: ${url}`))
      }

      document.body.appendChild(script)
    })
  }

  // 加载入口
  const load = async (jsUrl: string, cssUrl: string | undefined, globalName: string, componentName: string) => {
    loading.value = true
    error.value = null
    try {
      if (cssUrl) loadCss(cssUrl, globalName)

      const module = await loadJs(jsUrl, globalName)
      const exports = module.default || module
      const component = exports[componentName]

      if (!component) {
        throw new Error(`在插件中找不到指定的入口组件: ${componentName}`)
      }
      resolvedComponent.value = component
    } catch (err: any) {
      error.value = err.message || "未知加载错误"
      console.error("[usePluginLoader] 动态加载失败:", err)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    resolvedComponent,
    load
  }
}
