import { ref } from "vue"

export function useCodebookContextMenu<T>() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const target = ref<T | null>(null)

  function open(event: MouseEvent, item: T) {
    event.preventDefault()
    event.stopPropagation()

    visible.value = true
    x.value = event.clientX
    y.value = event.clientY
    target.value = item
  }

  function close() {
    visible.value = false
  }

  return {
    visible,
    x,
    y,
    target,
    open,
    close
  }
}
