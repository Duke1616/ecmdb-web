import { onMounted, onUnmounted, watch, toValue, type MaybeRefOrGetter } from "vue"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { activeTenantHeaders, getActiveTenantId } from "@/common/utils/service"

/**
 * SSE 连接配置项
 * @param path       接口路径（相对路径，不含 VITE_BASE_API 前缀，如 `task/streams/manager/task-events`）
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

class FatalSSEError extends Error {}

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

    const connectionController = new AbortController()
    controller = connectionController

    const baseApi = import.meta.env.VITE_BASE_API ?? "/api"
    const url = `${baseApi}/${currentPath}`

    const headers: Record<string, string> = {
      // fetch-event-source 内部按小写键判断是否已设置 Accept；保持小写可避免重复请求头。
      accept: "text/event-stream"
    }

    Object.assign(headers, activeTenantHeaders(getActiveTenantId()))

    void fetchEventSource(url, {
      method: "GET",
      headers,
      signal: connectionController.signal,
      credentials: "include",

      // 在 onopen 中校验响应状态，避免将服务端异常误认为是正常的长连接
      async onopen(response) {
        const isEventStream = response.headers.get("content-type")?.includes("text/event-stream")
        if (response.ok && isEventStream) return

        const error = new Error(`SSE 连接失败: ${response.status} ${response.statusText}`)
        // 鉴权、权限、路由或响应类型错误不会通过重试自行恢复，直接终止本次连接。
        if ((response.status >= 400 && response.status < 500 && response.status !== 429) || response.ok) {
          throw new FatalSSEError(error.message)
        }
        throw error
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
        console.error("[useSSE] SSE 连接发生异常:", err)
        onError?.(err)

        if (err instanceof FatalSSEError) throw err

        // 网络错误、限流和 5xx 使用固定退避，避免默认的一秒重试持续冲击服务端。
        return 5000
      }
    }).catch((err) => {
      if (!connectionController.signal.aborted) {
        console.error("[useSSE] SSE 连接已终止:", err)
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
