import { ref } from "vue"
import { describe, expect, it } from "vitest"
import { useDragSelection } from "./useDragSelection"

type Item = { id: number; readonly?: boolean }

function createSelection(items: Item[]) {
  const source = ref(items)
  return {
    source,
    selection: useDragSelection({
      items: source,
      getKey: (item) => String(item.id),
      isSelectable: (item) => !item.readonly
    })
  }
}

describe("useDragSelection", () => {
  it("selects and deselects consecutive items with one gesture", () => {
    const { selection } = createSelection([{ id: 1 }, { id: 2 }, { id: 3 }])

    selection.beginGesture({ id: 1 })
    selection.continueGesture({ id: 2 })
    selection.finishGesture()
    expect(selection.selectedItems.value.map((item) => item.id)).toEqual([1, 2])

    selection.beginGesture({ id: 1 })
    selection.continueGesture({ id: 2 })
    selection.finishGesture()
    expect(selection.selectedItems.value).toEqual([])
  })

  it("skips readonly items when selecting all", () => {
    const { selection } = createSelection([{ id: 1 }, { id: 2, readonly: true }, { id: 3 }])

    selection.toggleAll()

    expect(selection.allSelected.value).toBe(true)
    expect(selection.selectedItems.value.map((item) => item.id)).toEqual([1, 3])
  })

  it("removes stale selections when the item list changes", async () => {
    const { source, selection } = createSelection([{ id: 1 }, { id: 2 }])
    selection.toggleAll()

    source.value = [{ id: 2 }]
    await Promise.resolve()

    expect(selection.selectedItems.value.map((item) => item.id)).toEqual([2])
  })
})
