import { computed, ref, watch, type Ref } from "vue"

type DragSelectionOptions<T> = {
  items: Ref<T[]>
  getKey: (item: T) => string
  isSelectable?: (item: T) => boolean
}

export function useDragSelection<T>(options: DragSelectionOptions<T>) {
  const selectedKeys = ref(new Set<string>())
  const gestureMode = ref<"select" | "deselect" | null>(null)
  const isSelectable = (item: T) => options.isSelectable?.(item) ?? true

  const selectableItems = computed(() => options.items.value.filter(isSelectable))
  const selectedItems = computed(() =>
    selectableItems.value.filter((item) => selectedKeys.value.has(options.getKey(item)))
  )
  const allSelected = computed(
    () => selectableItems.value.length > 0 && selectedItems.value.length === selectableItems.value.length
  )
  const partiallySelected = computed(() => selectedItems.value.length > 0 && !allSelected.value)

  function replaceSelection(keys: Iterable<string>) {
    selectedKeys.value = new Set(keys)
  }

  function isSelected(item: T) {
    return selectedKeys.value.has(options.getKey(item))
  }

  function setSelected(item: T, selected: boolean) {
    if (!isSelectable(item)) return
    const next = new Set(selectedKeys.value)
    const key = options.getKey(item)
    selected ? next.add(key) : next.delete(key)
    replaceSelection(next)
  }

  function toggle(item: T) {
    setSelected(item, !isSelected(item))
  }

  function toggleAll() {
    if (allSelected.value) {
      clear()
      return
    }
    replaceSelection(selectableItems.value.map(options.getKey))
  }

  function beginGesture(item: T) {
    if (!isSelectable(item)) return false
    gestureMode.value = isSelected(item) ? "deselect" : "select"
    setSelected(item, gestureMode.value === "select")
    return true
  }

  function continueGesture(item: T) {
    if (!gestureMode.value) return
    setSelected(item, gestureMode.value === "select")
  }

  function finishGesture() {
    gestureMode.value = null
  }

  function clear() {
    replaceSelection([])
    finishGesture()
  }

  watch(options.items, (items) => {
    const availableKeys = new Set(items.filter(isSelectable).map(options.getKey))
    replaceSelection([...selectedKeys.value].filter((key) => availableKeys.has(key)))
  })

  return {
    allSelected,
    beginGesture,
    clear,
    continueGesture,
    finishGesture,
    isSelected,
    partiallySelected,
    selectableItems,
    selectedItems,
    toggle,
    toggleAll
  }
}
