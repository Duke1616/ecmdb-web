import { describe, expect, it } from "vitest"
import type { WorkspaceNode } from "@/api/task/codebook/types/codebook"
import { workspaceNodeToCodebook } from "./useCodebookTree"

describe("workspaceNodeToCodebook", () => {
  it("保留工作区节点的创建和修改时间", () => {
    const node: WorkspaceNode = {
      key: "project:1",
      source_id: 1,
      release_id: 0,
      digest: "",
      artifact_path: "",
      name: "site.yml",
      owner: "admin",
      kind: "FILE",
      scope: "TENANT",
      layer: "PROJECT",
      runtime_path: "site.yml",
      readonly: false,
      project_id: 9,
      parent_id: 0,
      sort_no: 0,
      download_only: false,
      size: 128,
      ctime: 100,
      utime: 200,
      namespace: "",
      children: []
    }

    expect(workspaceNodeToCodebook(node)).toMatchObject({ ctime: 100, utime: 200 })
  })
})
