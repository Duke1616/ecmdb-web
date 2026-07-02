import { onMounted, onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { useUserStoreHook } from "@/pinia/stores/user"
import { activeTenantStack } from "@/common/utils/service"

/**
 * SSE 连接配置项
 * @param path       接口路径（相对路径，不含 VITE_BASE_API 前缀，如 `task/manager/task-events/stream`）
 * @param eventName  监听的 SSE 事件名，对应后端 SSEvent 的 event 字段
 * @param onMessage  收到消息时的回调（已反序列化为具体类型 T）
 * @param onError    可选的错误回调
 * @param enabled    是否启用连接，支持 Ref 或 Getter 动态控制，默认 true
 */
interface UseSSEOptions<T> {
  path: MaybeRefOrGetter<string>
  eventName: string
  onMessage: (data: T) => void
  onError?: (err: unknown) => void
  enabled?: MaybeRefOrGetter<boolean>
}

/**
 * 通用 SSE 实时推送 Composable
 * @description 基于 @microsoft/fetch-event-source 封装，完整对齐项目的 axios 请求规范：
 *              - 自动补全 VITE_BASE_API 前缀，无需业务层手动拼接
 *              - 自动注入 X-Active-Tenant-ID 请求头，租户隔离与 axios 拦截器保持一致
 *              - 支持 enabled 和 path 双向驱动，开启、断连由响应式状态或 Getter 驱动，防止闲置连接占用或僵尸连接
 *              - 使用 AbortController 精准控制连接生命周期，彻底防范连接泄漏
 */
export function useSSE<T>(options: UseSSEOptions<T>) {
  const { path, eventName, onMessage, onError, enabled = true } = options

  // AbortController 用于精准终止 SSE 长连接
  let controller: AbortController | null = null

  const disconnect = () => {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  const connect = () => {
    // 如果已经有连接，先关闭，避免重复建立连接
    disconnect()

    const currentPath = toValue(path)
    // 保护性逻辑：如果当前路径未完全就绪，包含 undefined 或 null，则暂不发起长连接，防止不必要的 404
    if (!currentPath || currentPath.includes("undefined") || currentPath.includes("null")) {
      return
    }

    controller = new AbortController()

    const baseApi = import.meta.env.VITE_BASE_API ?? "/api"
    const url = `${baseApi}/${currentPath}`

    // 对齐 axios 拦截器的租户头注入逻辑：
    // 1. 优先从声明式上下文栈（useTenantScope）中取栈顶租户
    // 2. 退回到 Pinia 全局选择的当前租户
    const tenantId = activeTenantStack.value.at(-1)?.tenantId ?? useUserStoreHook().currentTenantId

    const headers: Record<string, string> = {
      Accept: "text/event-stream"
    }

    if (tenantId) {
      headers["X-Active-Tenant-ID"] = String(tenantId)
    }

    fetchEventSource(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      credentials: "include",

      // 在 onopen 中校验响应状态，避免将服务端异常误认为是正常的长连接
      async onopen(response) {
        if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream")) {
          throw new Error(`SSE 连接失败: ${response.status} ${response.statusText}`)
        }
      },

      onmessage(event) {
        if (event.event !== eventName) return
        try {
          if (event.data) {
            const data: T = JSON.parse(event.data)
            onMessage(data)
          }
        } catch (err) {
          console.error(`[useSSE] 解析 SSE 事件数据失败 (event=${eventName}):`, err)
        }
      },

      onerror(err) {
        // HACK: 不抛出错误时 fetchEventSource 会自动重连（指数退避）；
        //       抛出错误则终止连接，由业务层决定是否重试。
        //       此处选择打日志后允许自动重连，保持连接韧性。
        console.error("[useSSE] SSE 连接发生异常，将自动尝试重连:", err)
        onError?.(err)
      }
    })
  }

  onMounted(() => {
    const currentPath = toValue(path)
    if (toValue(enabled) && currentPath && !currentPath.includes("undefined") && !currentPath.includes("null")) {
      connect()
    }
  })

  // 监听 enabled 和 path 的动态变化，实现由外部业务状态和路径驱动的连接/断开控制
  watch([() => toValue(enabled), () => toValue(path)], ([newEnabled, newPath]) => {
    if (newEnabled && newPath && !newPath.includes("undefined") && !newPath.includes("null")) {
      connect()
    } else {
      disconnect()
    }
  })

  // 组件销毁时精准终止连接，防止内存泄漏和僵尸连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect
  }
}
