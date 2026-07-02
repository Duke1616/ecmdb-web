import type { Ref } from "vue"
import { find, findIndex } from "lodash-es"
import type { codebook } from "@/api/task/codebook/types/codebook"

type OpenedFilesOptions = {
  activeEditor: Ref<codebook>
  openedFiles: Ref<codebook[]>
  selectedTreeKey: Ref<string>
  createRootDirectory: () => codebook
}

export function useCodebookOpenedFiles(options: OpenedFilesOptions) {
  function getTreeKey(row: codebook) {
    if (!row.id) return row.kind === "FILE" ? "draft-file" : "directory-0"
    return `${row.kind.toLowerCase()}-${row.id}`
  }

  function isSameOpenedFile(left: codebook, right: codebook) {
    return Boolean(
      (left.id && left.id === right.id) || (!left.id && !right.id && left.kind === "FILE" && right.kind === "FILE")
    )
  }

  function findOpenedFile(row: codebook) {
    return find(options.openedFiles.value, (item) => isSameOpenedFile(item, row))
  }

  function findOpenedFileIndex(row: codebook) {
    return findIndex(options.openedFiles.value, (item) => isSameOpenedFile(item, row))
  }

  function activateCodebook(row: codebook) {
    options.activeEditor.value = row
    options.selectedTreeKey.value = getTreeKey(row)
  }

  function upsertOpenedFile(row: codebook) {
    const index = findOpenedFileIndex(row)
    if (index > -1) {
      options.openedFiles.value[index] = row
    } else {
      options.openedFiles.value.push(row)
    }
  }

  function closeOpenedFile(file: codebook, selectCodebook: (row: codebook) => void | Promise<void>) {
    const index = findOpenedFileIndex(file)
    if (index === -1) return

    options.openedFiles.value.splice(index, 1)
    if (!isSameOpenedFile(file, options.activeEditor.value)) return

    const nextActive = options.openedFiles.value[index] || options.openedFiles.value[index - 1]
    if (nextActive) {
      selectCodebook(nextActive)
    } else {
      activateCodebook(options.createRootDirectory())
    }
  }

  return {
    activateCodebook,
    closeOpenedFile,
    findOpenedFile,
    findOpenedFileIndex,
    isSameOpenedFile,
    upsertOpenedFile
  }
}
