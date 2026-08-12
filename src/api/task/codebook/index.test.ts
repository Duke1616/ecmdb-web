import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock("@@/utils/service", () => ({
  default: { post: mocks.post },
  API_SERVICE: { TASK: "task" }
}))

import { renameCodebookApi } from "./index"

describe("renameCodebookApi", () => {
  it("使用专用重命名接口", () => {
    renameCodebookApi({ id: 42, name: "renamed.py" })

    expect(mocks.post).toHaveBeenCalledWith({
      url: "task/codebook/rename",
      data: { id: 42, name: "renamed.py" }
    })
  })
})
