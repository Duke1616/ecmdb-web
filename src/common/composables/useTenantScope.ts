import { onMounted, onUnmounted, watch, type MaybeRefOrGetter, toValue } from "vue"
import { activeTenantStack } from "@/common/utils/service"

/**
 * 声明一个临时的租户作用域上下文
 * 组件挂载时自动入栈，组件销毁时自动出栈
 * 支持动态响应式租户 ID 变化
 *
 * 使用 Symbol 唯一标识作用域，防范组件无序销毁导致数组索引错乱的 Bug
 *
 * @param tenantIdGetter 租户 ID，可以是 Ref、Getter 函数或具体数值
 */
export function useTenantScope(tenantIdGetter: MaybeRefOrGetter<number | undefined>) {
  const scopeId = Symbol("tenant-scope")

  const push = (id: number) => {
    activeTenantStack.value.push({ scopeId, tenantId: id })
  }

  const pop = () => {
    const index = activeTenantStack.value.findIndex((item) => item.scopeId === scopeId)
    if (index !== -1) {
      activeTenantStack.value.splice(index, 1)
    }
  }

  onMounted(() => {
    const id = toValue(tenantIdGetter)
    if (id) {
      push(id)
    }
  })

  onUnmounted(() => {
    pop()
  })

  watch(
    () => toValue(tenantIdGetter),
    (newId) => {
      pop()
      if (newId) {
        push(newId)
      }
    }
  )
}
