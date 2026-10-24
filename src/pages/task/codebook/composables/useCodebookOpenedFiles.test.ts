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

  it("当单侧缺少 workspace_key 时，具有相同 id 的文件判定为同一文件并就地更新", () => {
    const opened = file({ id: 10, workspace_key: "project:10", name: "main.yml", code: "old code" })
    const saved = file({ id: 10, name: "main.yml", code: "new code" }) // 接口返回无 workspace_key
    const openedFiles = ref<codebook[]>([opened])
    const activeEditor = ref(opened)
    const selectedTreeKey = ref("project:10")
    const files = useCodebookOpenedFiles({
      activeEditor,
      openedFiles,
      selectedTreeKey,
      createRootDirectory: () => file({ kind: "DIRECTORY" })
    })

    expect(files.isSameOpenedFile(opened, saved)).toBe(true)
    files.upsertOpenedFile(saved)
    expect(openedFiles.value).toHaveLength(1)
    expect(openedFiles.value[0].code).toBe("new code")
  })

  it("草稿保存后传入 previous 参数能就地替换草稿 Tab，不产生重复 Tab", () => {
    const draft = file({ id: 0, name: "main.yml", code: "draft code" })
    const saved = file({ id: 99, workspace_key: "project:99", name: "main.yml", code: "draft code" })
    const openedFiles = ref<codebook[]>([draft])
    const activeEditor = ref(draft)
    const selectedTreeKey = ref("draft-file")
    const files = useCodebookOpenedFiles({
      activeEditor,
      openedFiles,
      selectedTreeKey,
      createRootDirectory: () => file({ kind: "DIRECTORY" })
    })

    expect(files.isSameOpenedFile(draft, saved)).toBe(false)
    files.upsertOpenedFile(saved, draft)
    expect(openedFiles.value).toHaveLength(1)
    expect(openedFiles.value[0].id).toBe(99)
    expect(openedFiles.value[0].workspace_key).toBe("project:99")
  })
})
