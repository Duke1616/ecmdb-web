export interface SelectedImportFile {
  file: File
  path: string
  rootDirectory: string
}

export interface MergeSelectionResult {
  files: SelectedImportFile[]
  duplicateCount: number
}

export interface LocalFileSystemNode {
  key: string
  name: string
  path: string
  kind: FileSystemHandleKind
  isLeaf: boolean
  handle?: FileSystemHandle
  file?: File
  children?: LocalFileSystemNode[]
}

export interface LocalSelectionTree {
  rootName: string
  nodes: LocalFileSystemNode[]
}

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

export function filesFromInput(files: Iterable<File>, directory: boolean): SelectedImportFile[] {
  return Array.from(files, (file) => {
    const path = normalizePath(directory ? file.webkitRelativePath || file.name : file.name)
    return selectedFile(file, path)
  })
}

export function mergeSelectedFiles(
  current: SelectedImportFile[],
  incoming: SelectedImportFile[]
): MergeSelectionResult {
  const paths = new Set(current.map((item) => item.path.toLowerCase()))
  const files = [...current]
  let duplicateCount = 0
  incoming.forEach((item) => {
    const key = item.path.toLowerCase()
    if (paths.has(key)) {
      duplicateCount += 1
      return
    }
    paths.add(key)
    files.push(item)
  })
  return { files, duplicateCount }
}

// collectDroppedFiles 支持 Finder 一次拖入多个文件、目录或二者的混合选择。
export async function collectDroppedFiles(items: Iterable<DataTransferItem>): Promise<SelectedImportFile[]> {
  const groups = await Promise.all(
    Array.from(items, async (item) => {
      if (item.kind !== "file") return []
      const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null
      if (entry) return readEntry(entry)
      const file = item.getAsFile()
      return file ? [selectedFile(file, file.name)] : []
    })
  )
  return groups.flat().sort((left, right) => left.path.localeCompare(right.path))
}

export async function readEntry(entry: FileSystemEntry, parentPath = ""): Promise<SelectedImportFile[]> {
  const path = normalizePath(parentPath ? `${parentPath}/${entry.name}` : entry.name)
  if (entry.isFile) {
    const file = await readFile(entry as FileSystemFileEntry)
    return [selectedFile(file, path)]
  }
  if (!entry.isDirectory) return []
  const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader())
  const groups = await Promise.all(children.map((child) => readEntry(child, path)))
  return groups.flat()
}

export async function listLocalDirectory(
  directory: FileSystemDirectoryHandle,
  parentPath = ""
): Promise<LocalFileSystemNode[]> {
  const nodes: LocalFileSystemNode[] = []
  for await (const [name, handle] of (directory as DirectoryHandleWithEntries).entries()) {
    const path = normalizePath(parentPath ? `${parentPath}/${name}` : name)
    nodes.push({
      key: `${handle.kind}:${path}`,
      name,
      path,
      kind: handle.kind,
      isLeaf: handle.kind === "file",
      handle
    })
  }
  return nodes.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1
    return left.name.localeCompare(right.name)
  })
}

// buildLocalSelectionTree 将 webkitdirectory 返回的扁平 FileList 还原为网页多选树。
// 浏览器路径的第一段是用户授权的根目录，只用于标题展示，不进入最终导入路径。
export function buildLocalSelectionTree(files: Iterable<File>): LocalSelectionTree {
  const selected = Array.from(files)
  const firstPath = normalizePath(selected[0]?.webkitRelativePath || selected[0]?.name || "")
  const rootName = firstPath.includes("/") ? firstPath.split("/")[0] : "所选目录"
  const roots: LocalFileSystemNode[] = []
  const directories = new Map<string, LocalFileSystemNode>()

  selected.forEach((file) => {
    const original = normalizePath(file.webkitRelativePath || file.name)
    const relative = original.startsWith(`${rootName}/`) ? original.slice(rootName.length + 1) : original
    const segments = relative.split("/").filter(Boolean)
    if (!segments.length) return

    let parent = roots
    let parentPath = ""
    segments.forEach((name, index) => {
      const path = normalizePath(parentPath ? `${parentPath}/${name}` : name)
      const leaf = index === segments.length - 1
      if (leaf) {
        parent.push({ key: `file:${path}`, name, path, kind: "file", isLeaf: true, file })
        return
      }
      let directory = directories.get(path)
      if (!directory) {
        directory = {
          key: `directory:${path}`,
          name,
          path,
          kind: "directory",
          isLeaf: false,
          children: []
        }
        directories.set(path, directory)
        parent.push(directory)
      }
      parent = directory.children!
      parentPath = path
    })
  })

  sortLocalNodes(roots)
  return { rootName, nodes: roots }
}

export async function filesFromLocalNodes(nodes: LocalFileSystemNode[]): Promise<SelectedImportFile[]> {
  const compacted = compactLocalSelection(nodes)
  const groups = await Promise.all(compacted.map(readLocalNode))
  return groups.flat().sort((left, right) => left.path.localeCompare(right.path))
}

export function compactLocalSelection(nodes: LocalFileSystemNode[]): LocalFileSystemNode[] {
  const sorted = [...nodes].sort((left, right) => left.path.split("/").length - right.path.split("/").length)
  const directories: string[] = []
  return sorted.filter((node) => {
    if (directories.some((path) => node.path.startsWith(`${path}/`))) return false
    if (node.kind === "directory") directories.push(node.path)
    return true
  })
}

async function readLocalHandle(handle: FileSystemHandle, path: string): Promise<SelectedImportFile[]> {
  if (handle.kind === "file") {
    const file = await (handle as FileSystemFileHandle).getFile()
    return [selectedFile(file, path)]
  }
  const children = await listLocalDirectory(handle as FileSystemDirectoryHandle, path)
  const groups = await Promise.all(children.map(readLocalNode))
  return groups.flat()
}

async function readLocalNode(node: LocalFileSystemNode): Promise<SelectedImportFile[]> {
  if (node.file) return [selectedFile(node.file, node.path)]
  if (node.handle) return readLocalHandle(node.handle, node.path)
  const groups = await Promise.all((node.children || []).map(readLocalNode))
  return groups.flat()
}

function sortLocalNodes(nodes: LocalFileSystemNode[]) {
  nodes.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1
    return left.name.localeCompare(right.name)
  })
  nodes.forEach((node) => sortLocalNodes(node.children || []))
}

async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const result: FileSystemEntry[] = []
  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
    if (!batch.length) return result
    result.push(...batch)
  }
}

function readFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise<File>((resolve, reject) => entry.file(resolve, reject))
}

function selectedFile(file: File, path: string): SelectedImportFile {
  const segments = path.split("/")
  return {
    file,
    path,
    rootDirectory: segments.length > 1 ? segments[0] : ""
  }
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\/+/, "")
}
