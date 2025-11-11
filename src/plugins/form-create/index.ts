import { type App } from "vue"
import formCreate from "@form-create/element-ui"
import FcDesigner from "@form-create/designer"
import type { FetchOption } from "@form-create/core"
import { getToken } from "@@/utils/cache/cookies"

export function loadFromCreate(app: App) {
  // 在全局设置 fetch，添加 token 头
  // 注意：formCreate.fetch 只在表单规则中使用 effect.fetch 时才会被调用
  // 如果表单规则中没有使用 fetch（远程数据加载），这个方法不会被调用
  const globalFetch = formCreate.fetch
  formCreate.fetch = (option: FetchOption, effectArgs: Object = {}) => {
    // 确保 headers 对象存在
    if (!option.headers) {
      option.headers = {}
    }

    // 获取 token 并设置到 headers
    const token = getToken()
    if (token && option.headers) {
      ;(option.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }

    // 调用原始的 fetch 方法，传递两个参数
    return globalFetch(option, effectArgs)
  }

  app.use(formCreate)
  app.use(FcDesigner)
}
