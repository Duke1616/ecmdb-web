import { ref } from "vue"
import { describe, expect, it } from "vitest"
import type { codebook } from "@/api/task/codebook/types/codebook"
import { useCodebookOpenedFiles } from "./useCodebookOpenedFiles"

function file(overrides: Partial<codebook> = {}): codebook {
  return {
    id: 0,
    tenant_id: 0,
    project_id: 1,
    scope: "TENANT",
    parent_id: 0,
    path_ids: "/",
    depth: 0,
    name: "test.py",
    owner: "",
    kind: "FILE",
    sort_no: 0,
    code: "",
    secret: "",
    current_version_id: 0,
    ctime: 0,
    utime: 0,
    ...overrides
  }
}

describe("useCodebookOpenedFiles", () => {
  it("使用 workspace_key 区分不同制品文件", () => {
    const first = file({ workspace_key: "artifact:1:system/a.py", scope: "SYSTEM" })
    const second = file({ workspace_key: "artifact:1:system/b.py", scope: "SYSTEM" })
    const openedFiles = ref<codebook[]>([first])
    const activeEditor = ref(first)
    const selectedTreeKey = ref("")
    const files = useCodebookOpenedFiles({
      activeEditor,
      openedFiles,
      selectedTreeKey,
      createRootDirectory: () => file({ kind: "DIRECTORY" })
    })

    expect(files.isSameOpenedFile(first, second)).toBe(false)
    expect(files.findOpenedFile(second)).toBeUndefined()

    openedFiles.value.push(second)
    files.activateCodebook(second)
    expect(activeEditor.value).toStrictEqual(second)
    expect(selectedTreeKey.value).toBe(second.workspace_key)
  })

  it("制品文件不会与未保存草稿视为同一个文件", () => {
    const artifact = file({ workspace_key: "artifact:1:system/a.py", scope: "SYSTEM" })
    const draft = file()
    const files = useCodebookOpenedFiles({
      activeEditor: ref(draft),
      openedFiles: ref([]),
      selectedTreeKey: ref(""),
      createRootDirectory: () => file({ kind: "DIRECTORY" })
    })

    expect(files.isSameOpenedFile(artifact, draft)).toBe(false)
  })
})
