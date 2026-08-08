import { describe, expect, it } from "vitest"
import {
  collectDroppedFiles,
  compactLocalSelection,
  filesFromLocalNodes,
  filesFromInput,
  mergeSelectedFiles,
  readEntry,
  type SelectedImportFile
} from "./importSelection"

function file(name: string, content = name) {
  return new File([content], name)
}

function fileEntry(name: string): FileSystemFileEntry {
  return {
    name,
    isFile: true,
    isDirectory: false,
    file: (success) => success(file(name))
  } as FileSystemFileEntry
}

function directoryEntry(name: string, batches: FileSystemEntry[][]): FileSystemDirectoryEntry {
  return {
    name,
    isFile: false,
    isDirectory: true,
    createReader: () => ({
      readEntries: (success: FileSystemEntriesCallback) => success(batches.shift() || [])
    })
  } as FileSystemDirectoryEntry
}

function transferItem(entry: FileSystemEntry): DataTransferItem {
  return {
    kind: "file",
    webkitGetAsEntry: () => entry,
    getAsFile: () => null
  } as DataTransferItem
}

function fileHandle(name: string): FileSystemFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => file(name)
  } as FileSystemFileHandle
}

function directoryHandle(name: string, children: FileSystemHandle[]): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: async function* () {
      for (const child of children) yield [child.name, child] as [string, FileSystemHandle]
    }
  } as unknown as FileSystemDirectoryHandle
}

describe("import selection", () => {
  it("keeps direct files and directory paths in one selection", () => {
    const direct = filesFromInput([file("README.md")], false)
    const nestedFile = file("main.yml")
    Object.defineProperty(nestedFile, "webkitRelativePath", { value: "roles/web/main.yml" })
    const directory = filesFromInput([nestedFile], true)

    const result = mergeSelectedFiles(direct, directory)

    expect(result.duplicateCount).toBe(0)
    expect(result.files.map((item) => item.path)).toEqual(["README.md", "roles/web/main.yml"])
    expect(result.files[1].rootDirectory).toBe("roles")
  })

  it("deduplicates case-insensitive project paths", () => {
    const current: SelectedImportFile[] = [{ file: file("main.yml"), path: "roles/main.yml", rootDirectory: "roles" }]
    const incoming: SelectedImportFile[] = [{ file: file("MAIN.yml"), path: "ROLES/MAIN.yml", rootDirectory: "ROLES" }]

    const result = mergeSelectedFiles(current, incoming)

    expect(result.files).toHaveLength(1)
    expect(result.duplicateCount).toBe(1)
  })

  it("recursively reads every directory batch", async () => {
    const tasks = directoryEntry("tasks", [[fileEntry("main.yml")], []])
    const defaults = directoryEntry("defaults", [[fileEntry("main.yml")], []])
    const root = directoryEntry("role", [[tasks], [defaults], []])

    const result = await readEntry(root)

    expect(result.map((item) => item.path).sort()).toEqual(["role/defaults/main.yml", "role/tasks/main.yml"])
    expect(result.every((item) => item.rootDirectory === "role")).toBe(true)
  })

  it("collects multiple files and directories from one mixed drop", async () => {
    const role = directoryEntry("role", [[fileEntry("tasks.yml")], []])

    const result = await collectDroppedFiles([transferItem(fileEntry("README.md")), transferItem(role)])

    expect(result.map((item) => item.path)).toEqual(["README.md", "role/tasks.yml"])
  })

  it("collects checked files and directories from the local picker", async () => {
    const role = directoryHandle("role", [fileHandle("tasks.yml")])
    const nodes = [
      {
        key: "file:README.md",
        name: "README.md",
        path: "README.md",
        kind: "file",
        isLeaf: true,
        handle: fileHandle("README.md")
      },
      { key: "directory:role", name: "role", path: "role", kind: "directory", isLeaf: false, handle: role }
    ] as const

    const result = await filesFromLocalNodes([...nodes])

    expect(result.map((item) => item.path)).toEqual(["README.md", "role/tasks.yml"])
  })

  it("does not collect a checked child twice when its parent is checked", () => {
    const parent = {
      key: "directory:role",
      name: "role",
      path: "role",
      kind: "directory",
      isLeaf: false,
      handle: directoryHandle("role", [])
    } as const
    const child = {
      key: "file:role/main.yml",
      name: "main.yml",
      path: "role/main.yml",
      kind: "file",
      isLeaf: true,
      handle: fileHandle("main.yml")
    } as const

    expect(compactLocalSelection([child, parent])).toEqual([parent])
  })
})
